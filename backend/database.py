import sqlite3
import json
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent / "trudeed.db"
DATABASE_URL = os.environ.get("DATABASE_URL")

class DbWrapper:
    def __init__(self, conn, is_postgres=False):
        self.conn = conn
        self.is_postgres = is_postgres

    def execute(self, sql, params=None):
        if self.is_postgres:
            sql = sql.replace("?", "%s")
            if "INSERT OR REPLACE INTO reference_documents" in sql:
                sql = sql.replace(
                    "INSERT OR REPLACE INTO reference_documents",
                    "INSERT INTO reference_documents"
                )
                sql += " ON CONFLICT (ref_id) DO UPDATE SET doc_type = EXCLUDED.doc_type, label = EXCLUDED.label, phash = EXCLUDED.phash, content_hash = EXCLUDED.content_hash, fields_json = EXCLUDED.fields_json, uploaded_by = EXCLUDED.uploaded_by"
            import psycopg2.extras
            cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(sql, params or ())
            return cur
        else:
            if params is not None:
                return self.conn.execute(sql, params)
            else:
                return self.conn.execute(sql)

    def executescript(self, sql):
        if self.is_postgres:
            sql = sql.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
            cur = self.conn.cursor()
            cur.execute(sql)
            return cur
        else:
            return self.conn.executescript(sql)


@contextmanager
def _conn():
    if DATABASE_URL:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL)
        try:
            yield DbWrapper(conn, is_postgres=True)
            conn.commit()
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield DbWrapper(conn, is_postgres=False)
            conn.commit()
        finally:
            conn.close()


def init_db() -> None:
    with _conn() as c:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS submissions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                applicant_id TEXT    NOT NULL,
                doc_type     TEXT    NOT NULL,
                phash        TEXT,
                content_hash TEXT,
                verdict      TEXT    NOT NULL,
                score        REAL    NOT NULL,
                intake_mode  TEXT,
                fields_json  TEXT,
                flags_json   TEXT,
                heatmap_b64  TEXT,
                officer_name TEXT,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS applicant_fields (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                applicant_id TEXT NOT NULL,
                doc_type     TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                field_name   TEXT NOT NULL,
                field_value  TEXT NOT NULL,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reference_documents (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                ref_id       TEXT NOT NULL UNIQUE,
                doc_type     TEXT NOT NULL,
                label        TEXT,
                phash        TEXT,
                content_hash TEXT,
                fields_json  TEXT,
                uploaded_by  TEXT,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        try:
            c.execute("ALTER TABLE submissions ADD COLUMN officer_name TEXT")
        except Exception:
            pass


def insert_submission(
    applicant_id: str,
    doc_type: str,
    phash: str,
    content_hash: str,
    verdict: str,
    score: float,
    intake_mode: str,
    fields_json: str,
    flags_json: str,
    heatmap_b64: Optional[str],
    officer_name: str = "unknown",
) -> None:
    with _conn() as c:
        c.execute(
            """INSERT INTO submissions
               (applicant_id, doc_type, phash, content_hash, verdict, score,
                intake_mode, fields_json, flags_json, heatmap_b64, officer_name)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (applicant_id, doc_type, phash, content_hash, verdict, score,
             intake_mode, fields_json, flags_json, heatmap_b64, officer_name),
        )


def store_applicant_fields(
    applicant_id: str, doc_type: str, content_hash: str, fields: dict
) -> None:
    with _conn() as c:
        for name, value in fields.items():
            if value:
                c.execute(
                    """INSERT INTO applicant_fields
                       (applicant_id, doc_type, content_hash, field_name, field_value)
                       VALUES (?,?,?,?,?)""",
                    (applicant_id, doc_type, content_hash, name, str(value)),
                )


def get_submissions(officer_name: Optional[str] = None) -> list[dict]:
    with _conn() as c:
        if officer_name:
            rows = c.execute(
                "SELECT id, applicant_id, doc_type, verdict, score, intake_mode, created_at, officer_name "
                "FROM submissions WHERE LOWER(officer_name)=LOWER(?) ORDER BY created_at DESC",
                (officer_name,)
            ).fetchall()
        else:
            rows = c.execute(
                "SELECT id, applicant_id, doc_type, verdict, score, intake_mode, created_at, officer_name "
                "FROM submissions ORDER BY created_at DESC"
            ).fetchall()
    return [dict(r) for r in rows]


def get_applicant_docs(applicant_id: str) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT doc_type, verdict, score, intake_mode, fields_json, flags_json, created_at "
            "FROM submissions WHERE applicant_id=? ORDER BY created_at DESC",
            (applicant_id,),
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["fields"] = json.loads(d.pop("fields_json") or "{}")
            d["flags"] = json.loads(d.pop("flags_json") or "[]")
        except Exception:
            d["fields"] = {}
            d["flags"] = []
        result.append(d)
    return result


def get_applicant_fields(applicant_id: str) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT doc_type, field_name, field_value FROM applicant_fields "
            "WHERE applicant_id=?",
            (applicant_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def pan_seen_for_other_applicant(pan: str, applicant_id: str) -> Optional[str]:
    """Return applicant_id that previously used this PAN, if different from current."""
    if not pan:
        return None
    with _conn() as c:
        row = c.execute(
            """SELECT applicant_id FROM applicant_fields
               WHERE field_name='pan' AND field_value=? AND applicant_id!=?
               LIMIT 1""",
            (pan.upper(), applicant_id),
        ).fetchone()
    return row["applicant_id"] if row else None


def store_reference(
    ref_id: str, doc_type: str, label: str, phash: str,
    content_hash: str, fields: dict, uploaded_by: str
) -> None:
    with _conn() as c:
        c.execute(
            """INSERT OR REPLACE INTO reference_documents
               (ref_id, doc_type, label, phash, content_hash, fields_json, uploaded_by)
               VALUES (?,?,?,?,?,?,?)""",
            (ref_id, doc_type, label, phash, content_hash, json.dumps(fields), uploaded_by),
        )


def get_all_references() -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT ref_id, doc_type, label, phash, content_hash, fields_json, uploaded_by, created_at "
            "FROM reference_documents ORDER BY created_at DESC"
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["fields"] = json.loads(d.pop("fields_json") or "{}")
        except Exception:
            d["fields"] = {}
        result.append(d)
    return result


def find_similar_references(phash: str, doc_type: str) -> list[dict]:
    """Return reference docs of the same type for hamming-distance comparison."""
    if not phash:
        return []
    with _conn() as c:
        rows = c.execute(
            "SELECT ref_id, label, phash, content_hash, fields_json "
            "FROM reference_documents WHERE doc_type=?",
            (doc_type,),
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["fields"] = json.loads(d.pop("fields_json") or "{}")
        except Exception:
            d["fields"] = {}
        result.append(d)
    return result


def delete_reference(ref_id: str) -> bool:
    with _conn() as c:
        c.execute("DELETE FROM reference_documents WHERE ref_id=?", (ref_id,))
    return True


def phash_seen_before(phash: str, applicant_id: str) -> Optional[str]:
    """Return applicant_id that previously submitted a doc with this perceptual hash."""
    if not phash:
        return None
    with _conn() as c:
        row = c.execute(
            "SELECT applicant_id FROM submissions WHERE phash=? AND applicant_id!=? LIMIT 1",
            (phash, applicant_id),
        ).fetchone()
    return row["applicant_id"] if row else None

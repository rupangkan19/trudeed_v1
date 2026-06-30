"""
Cross-document consistency engine.
Compares fields across all documents submitted for the same applicant.
Uses token-based name matching (not exact string) to handle formatting differences.
"""
import re
from database import get_applicant_fields, store_applicant_fields

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "cross_doc"}

NUMERIC_TOLERANCE_PCT = 20.0   # salary vs bank credit: allow 20% variance
INCOME_FIELDS = {"annual_income", "gross_salary", "net_salary"}
IDENTIFIER_FIELDS = {"pan", "account_number", "aadhaar_number"}
NAME_FIELDS = {"employee_name", "holder_name", "taxpayer_name"}


def _tokenize_name(name: str) -> set[str]:
    name = re.sub(r"\b(mr|mrs|ms|dr|shri|smt|prof)\.?\s*", "", name.lower())
    return {t for t in name.split() if len(t) > 1}


def _names_match(a: str, b: str) -> bool:
    tokens_a = _tokenize_name(a)
    tokens_b = _tokenize_name(b)
    if not tokens_a or not tokens_b:
        return True
    overlap = tokens_a & tokens_b
    return len(overlap) / max(len(tokens_a), len(tokens_b)) >= 0.6


def _numeric_consistent(a: str, b: str, tol_pct: float) -> bool:
    try:
        fa, fb = float(a), float(b)
        if fa == fb == 0:
            return True
        ref = max(abs(fa), abs(fb), 1.0)
        return abs(fa - fb) / ref * 100 <= tol_pct
    except ValueError:
        return True


def check_cross_doc(
    applicant_id: str,
    doc_type: str,
    current_fields: dict,
    content_hash: str,
) -> list[dict]:
    store_applicant_fields(applicant_id, doc_type, content_hash, current_fields)
    prior_docs = get_applicant_fields(applicant_id)

    flags: list[dict] = []
    prior_by_field: dict[str, list[tuple[str, str]]] = {}
    for row in prior_docs:
        if row.get("field_name") and row.get("field_value"):
            prior_by_field.setdefault(row["field_name"], []).append(
                (row["doc_type"], row["field_value"])
            )

    for field, value in current_fields.items():
        if not value or field not in prior_by_field:
            continue
        for prior_doc_type, prior_value in prior_by_field[field]:
            if prior_doc_type == doc_type:
                continue

            if field in IDENTIFIER_FIELDS:
                if value.upper() != prior_value.upper():
                    flags.append(_FLAG(
                        f"IDENTIFIER_MISMATCH_{field.upper()}", "RED",
                        f"{field.upper()} mismatch: '{doc_type}' shows '{value}' but "
                        f"'{prior_doc_type}' shows '{prior_value}'. "
                        f"Identifier fields must be identical across all documents."
                    ))

            elif field in NAME_FIELDS:
                if not _names_match(value, prior_value):
                    flags.append(_FLAG(
                        "NAME_MISMATCH", "AMBER",
                        f"Name mismatch: '{doc_type}' shows '{value}' but "
                        f"'{prior_doc_type}' shows '{prior_value}'. "
                        f"Could be formatting difference or different person."
                    ))

            elif field in INCOME_FIELDS:
                if not _numeric_consistent(value, prior_value, NUMERIC_TOLERANCE_PCT):
                    try:
                        v1, v2 = float(value), float(prior_value)
                        flags.append(_FLAG(
                            "INCOME_MISMATCH", "RED",
                            f"Income mismatch across documents: '{doc_type}' declares ₹{v1:,.0f} "
                            f"but '{prior_doc_type}' declares ₹{v2:,.0f} "
                            f"(difference: {abs(v1-v2)/max(v1,v2)*100:.0f}%). "
                            f"Suggests one document has been inflated/deflated."
                        ))
                    except ValueError:
                        pass

    if not flags and len(prior_by_field) > 0:
        flags.append(_FLAG("CROSS_DOC_CONSISTENT", "GREEN",
                           "All shared fields are consistent across submitted documents."))

    return flags

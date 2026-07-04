import json
import re
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import (init_db, insert_submission, get_submissions, get_applicant_docs,
                      store_reference, get_all_references, delete_reference)
from intake import process_document
from cross_doc import check_cross_doc
from history import check_history, check_reference
from scoring import compute_score
from forensics.highlight import generate_highlight

app = FastAPI(title="TruDeed API", version="2.0.0", description="Real-time document forgery detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOC_TYPES = {"SALARY_SLIP", "BANK_STATEMENT", "ITR", "FORM16", "CHEQUE", "AADHAAR"}

api = APIRouter(prefix="/api")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@api.get("/")
def root():
    return {"status": "ok", "service": "TruDeed Document Verification API v2.0"}


@api.post("/verify")
async def verify(
    file: UploadFile = File(...),
    applicant_id: str = Form(...),
    doc_type: str = Form(...),
    officer_name: str = Form("unknown"),
) -> dict:
    if not applicant_id.strip():
        raise HTTPException(status_code=422, detail="applicant_id is required.")
    doc_type = doc_type.upper()
    if doc_type not in DOC_TYPES:
        raise HTTPException(status_code=422, detail=f"doc_type must be one of: {', '.join(sorted(DOC_TYPES))}")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    filename = file.filename or "upload.pdf"

    result = process_document(file_bytes, filename, doc_type, applicant_id)

    pan = result["fields"].get("pan", "")
    cross_flags = check_cross_doc(applicant_id, doc_type, result["fields"], result["content_hash"])
    history_flags = check_history(result["phash"], result["content_hash"], applicant_id, pan)
    reference_flags = check_reference(result["phash"], doc_type, result["fields"])

    score_result = compute_score(
        result["forensic_flags"],
        result["content_flags"],
        cross_flags,
        history_flags + reference_flags,
    )

    annotated_b64 = generate_highlight(file_bytes, filename, score_result["all_flags"])

    insert_submission(
        applicant_id=applicant_id,
        doc_type=doc_type,
        phash=result["phash"],
        content_hash=result["content_hash"],
        verdict=score_result["verdict"],
        score=score_result["score"],
        intake_mode=result["intake_mode"],
        fields_json=json.dumps(result["fields"]),
        flags_json=json.dumps(score_result["all_flags"]),
        heatmap_b64=annotated_b64 or result.get("heatmap_b64"),
        officer_name=officer_name,
    )

    return {
        "verdict": score_result["verdict"],
        "score": score_result["score"],
        "confidence": score_result["confidence"],
        "intake_mode": result["intake_mode"],
        "reasons": score_result["reasons"],
        "flags": score_result["all_flags"],
        "fields": result["fields"],
        "heatmap_b64": annotated_b64 or result.get("heatmap_b64"),
        "fingerprint": result["content_hash"],
    }


@api.get("/history")
def history(officer_name: Optional[str] = None) -> list[dict]:
    return get_submissions(officer_name)


@api.get("/applicant/{applicant_id}")
def applicant(applicant_id: str) -> dict:
    docs = get_applicant_docs(applicant_id)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No documents found for applicant '{applicant_id}'.")
    return {"applicant_id": applicant_id, "documents": docs}


@api.post("/admin/reference")
async def upload_reference(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    ref_id: str = Form(...),
    label: str = Form(""),
    uploaded_by: str = Form("admin"),
) -> dict:
    doc_type = doc_type.upper()
    if doc_type not in DOC_TYPES:
        raise HTTPException(status_code=422, detail=f"doc_type must be one of: {', '.join(sorted(DOC_TYPES))}")
    if not ref_id.strip():
        raise HTTPException(status_code=422, detail="ref_id is required.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    result = process_document(file_bytes, file.filename or "ref.pdf", doc_type, "__reference__")
    store_reference(
        ref_id=ref_id.strip(),
        doc_type=doc_type,
        label=label.strip() or ref_id.strip(),
        phash=result["phash"],
        content_hash=result["content_hash"],
        fields=result["fields"],
        uploaded_by=uploaded_by,
    )
    return {
        "status": "stored",
        "ref_id": ref_id.strip(),
        "doc_type": doc_type,
        "label": label.strip() or ref_id.strip(),
        "fields_extracted": list(result["fields"].keys()),
        "phash": result["phash"],
    }


@api.get("/admin/references")
def list_references() -> list[dict]:
    return get_all_references()


@api.delete("/admin/reference/{ref_id}")
def remove_reference(ref_id: str) -> dict:
    delete_reference(ref_id)
    return {"status": "deleted", "ref_id": ref_id}


@api.get("/tools/ifsc/{code}")
def tool_ifsc(code: str) -> dict:
    import csv
    from rules.common import validate_ifsc
    code = re.sub(r"\s+", "", code).upper()
    valid_format = bool(re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", code))
    if not valid_format:
        return {"valid": False, "reason": "Invalid format. IFSC must be 11 chars: 4 letters + 0 + 6 alphanumeric."}
    in_registry = validate_ifsc(code)
    if not in_registry:
        return {"valid": False, "ifsc": code, "reason": "Not found in RBI IFSC registry. This branch does not exist."}
    csv_path = Path(__file__).parent / "data" / "ifsc_codes.csv"
    info: dict = {"valid": True, "ifsc": code}
    try:
        with open(csv_path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("IFSC", "").strip().upper() == code:
                    info["bank"]    = row.get("BANK", "").strip()
                    info["branch"]  = row.get("BRANCH", "").strip()
                    info["city"]    = row.get("CITY", row.get("CENTRE", "")).strip()
                    info["state"]   = row.get("STATE", "").strip()
                    info["address"] = row.get("ADDRESS", "").strip()[:120]
                    break
    except Exception:
        pass
    return info


@api.get("/tools/aadhaar/{uid}")
def tool_aadhaar(uid: str) -> dict:
    from rules.common import verhoeff_validate
    digits = re.sub(r"\s+", "", uid)
    if not digits.isdigit() or len(digits) != 12:
        return {"valid": False, "reason": "Aadhaar must be exactly 12 digits."}
    valid = verhoeff_validate(digits)
    return {
        "valid": valid,
        "uid": f"{digits[:4]} {digits[4:8]} {digits[8:]}",
        "reason": "Verhoeff checksum passed — UID is mathematically valid." if valid
                  else "Verhoeff checksum failed — this UID is not valid.",
    }


@api.get("/tools/pan/{pan}")
def tool_pan(pan: str) -> dict:
    pan = pan.upper().strip()
    valid = bool(re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", pan))
    fourth = pan[3] if len(pan) >= 4 else ""
    type_map = {"P": "Individual", "C": "Company", "H": "HUF", "F": "Firm",
                "A": "AOP", "T": "Trust", "B": "BOI", "L": "Local Authority",
                "J": "AJP", "G": "Government"}
    return {
        "valid": valid,
        "pan": pan,
        "holder_type": type_map.get(fourth, "Unknown") if valid else None,
        "reason": f"Valid PAN format. Holder type: {type_map.get(fourth, 'Unknown')}." if valid
                  else "Invalid PAN format. Expected: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F).",
    }


@api.get("/health")
def health():
    return {"status": "healthy"}


# Register all API routes
app.include_router(api)

# Serve the built React frontend (production mode)
# When frontend/dist exists, the entire app runs from a single port 8000.
_dist = Path(__file__).parent.parent / "frontend" / "dist"
if _dist.exists():
    # Serve compiled JS/CSS assets directly — must be mounted BEFORE the catch-all
    # so asset requests are never intercepted and served as index.html.
    _assets = _dist / "assets"
    if _assets.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets)), name="assets")

    # Serve any other static files at root (favicon.ico, etc.)
    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        f = _dist / "favicon.ico"
        return FileResponse(str(f)) if f.exists() else FileResponse(str(_dist / "index.html"))

    # Catch-all: serve index.html for every other path (SPA client-side routing).
    # This runs AFTER the asset mount, so /assets/* never reaches here.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        return FileResponse(str(_dist / "index.html"))

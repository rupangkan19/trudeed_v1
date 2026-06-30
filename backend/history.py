"""
Document history and recycling detection.
Uses perceptual hashing to catch visually similar documents submitted
for different applicants, and PAN reuse across applicants.
Also compares submitted docs against admin-uploaded reference documents.
"""
from database import phash_seen_before, pan_seen_for_other_applicant, find_similar_references

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "history"}


def compute_phash(image_bytes: bytes) -> str:
    """Perceptual hash of image. Robust to minor edits."""
    try:
        import imagehash
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes)).convert("L").resize((256, 256))
        return str(imagehash.phash(img))
    except Exception:
        return ""


def compute_phash_from_pdf(pdf_bytes: bytes) -> str:
    try:
        import fitz
        import imagehash
        from PIL import Image
        import io
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[0]
        pix = page.get_pixmap(dpi=72)
        img_bytes = pix.tobytes("png")
        doc.close()
        return compute_phash(img_bytes)
    except Exception:
        return ""


def content_hash(text: str) -> str:
    import hashlib
    return hashlib.sha256(text.strip().encode()).hexdigest()[:16]


def check_history(phash: str, c_hash: str, applicant_id: str, pan: str) -> list[dict]:
    flags: list[dict] = []

    # Perceptual hash recycling check
    if phash:
        prior_applicant = phash_seen_before(phash, applicant_id)
        if prior_applicant:
            flags.append(_FLAG(
                "DOCUMENT_RECYCLED", "RED",
                f"This document (perceptual hash match) was previously submitted for applicant "
                f"'{prior_applicant}'. The same physical document is being reused for a different "
                f"loan application — strong indicator of syndicated fraud."
            ))

    # PAN reuse across applicants
    if pan:
        prior_applicant = pan_seen_for_other_applicant(pan, applicant_id)
        if prior_applicant:
            flags.append(_FLAG(
                "PAN_REUSED_ACROSS_APPLICANTS", "RED",
                f"PAN '{pan}' has already been submitted for applicant '{prior_applicant}'. "
                f"The same PAN cannot belong to two different loan applicants — "
                f"indicates identity fraud or document recycling."
            ))

    return flags


def _phash_distance(a: str, b: str) -> int:
    """Hamming distance between two hex pHash strings."""
    try:
        import imagehash
        return imagehash.hex_to_hash(a) - imagehash.hex_to_hash(b)
    except Exception:
        return 99


# Numeric field keys we compare between reference and submitted doc
_NUMERIC_FIELDS = {
    "gross_salary", "net_salary", "annual_income",
    "total_credits", "total_debits", "opening_balance", "closing_balance",
    "tds_deducted",
}


def check_reference(phash: str, doc_type: str, submitted_fields: dict) -> list[dict]:
    """Compare submitted document against admin-uploaded reference documents."""
    flags: list[dict] = []
    candidates = find_similar_references(phash, doc_type)

    for ref in candidates:
        ref_phash = ref.get("phash", "")
        if not ref_phash or not phash:
            continue

        dist = _phash_distance(phash, ref_phash)
        if dist > 15:
            continue  # not visually similar — different document

        ref_fields = ref.get("fields", {})
        ref_label = ref.get("label") or ref.get("ref_id", "reference")

        mismatches = []
        for key in _NUMERIC_FIELDS:
            ref_val = ref_fields.get(key)
            sub_val = submitted_fields.get(key)
            if ref_val and sub_val:
                try:
                    rv, sv = float(ref_val), float(sub_val)
                    if rv > 0 and abs(rv - sv) / rv > 0.005:  # >0.5% difference
                        mismatches.append(
                            f"{key.replace('_', ' ').title()}: "
                            f"original ₹{rv:,.0f} → submitted ₹{sv:,.0f}"
                        )
                except (ValueError, ZeroDivisionError):
                    pass

        if mismatches:
            flags.append(_FLAG(
                "REFERENCE_MISMATCH", "RED",
                f"Document matches reference '{ref_label}' (visual similarity score: {15-dist}/15) "
                f"but {len(mismatches)} field(s) were altered: "
                + "; ".join(mismatches) + ". "
                f"Original document exists on file — this is a tampered copy."
            ))
        else:
            flags.append(_FLAG(
                "MATCHES_REFERENCE", "GREEN",
                f"Document matches reference '{ref_label}' (visual similarity {15-dist}/15) "
                f"and all key fields are identical to the original on file."
            ))

    return flags

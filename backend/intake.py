"""
Document intake pipeline.
Detects intake mode, extracts text and images, runs appropriate forensics,
applies document-type rules, returns a unified result dict.
"""
import io
import hashlib
import base64
from typing import Optional

import numpy as np

from preprocessing import image_bytes_to_array, pdf_page_to_array, preprocess_for_ocr
from ocr_engine import extract_text
from classifier import validate_doc_type
from forensics import digital as dforensic
from forensics import physical as pforensic
from history import compute_phash, compute_phash_from_pdf, content_hash
import rules.salary as salary_rules
import rules.bank_statement as bank_rules
import rules.itr_form16 as itr_rules
import rules.aadhaar as aadhaar_rules
import rules.cheque as cheque_rules


def _detect_mode(file_bytes: bytes, filename: str) -> str:
    lower = filename.lower()
    if lower.endswith((".jpg", ".jpeg", ".png", ".webp", ".bmp")):
        return "photo"
    if lower.endswith(".pdf"):
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = "".join(page.get_text() for page in doc)
            doc.close()
            return "born_digital_pdf" if len(text.strip()) > 50 else "scanned_pdf"
        except Exception:
            return "scanned_pdf"
    return "photo"


def _extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    except Exception:
        return ""


def _image_to_b64_heatmap(image: np.ndarray) -> Optional[str]:
    try:
        import cv2
        _, buf = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return base64.b64encode(buf.tobytes()).decode()
    except Exception:
        return None


def _run_rules(text: str, doc_type: str) -> tuple[list[dict], dict]:
    """Run document-type-specific rules. Returns (flags, extracted_fields)."""
    if doc_type == "SALARY_SLIP":
        fields = salary_rules.extract_fields(text)
        flags = salary_rules.run(text, fields)
    elif doc_type == "BANK_STATEMENT":
        fields = bank_rules.extract_fields(text)
        flags = bank_rules.run(text, fields)
    elif doc_type == "ITR":
        fields = itr_rules.extract_itr_fields(text)
        flags = itr_rules.run_itr(text, fields)
    elif doc_type == "FORM16":
        fields = itr_rules.extract_form16_fields(text)
        flags = itr_rules.run_form16(text, fields)
    elif doc_type == "AADHAAR":
        fields = aadhaar_rules.extract_fields(text)
        flags = aadhaar_rules.run(text, fields)
    elif doc_type == "CHEQUE":
        fields = cheque_rules.extract_fields(text)
        flags = cheque_rules.run(text, fields)
    else:
        fields = {}
        flags = []
    return flags, fields


def process_document(
    file_bytes: bytes,
    filename: str,
    doc_type: str,
    applicant_id: str,
) -> dict:
    mode = _detect_mode(file_bytes, filename)
    text = ""
    forensic_flags: list[dict] = []
    heatmap_b64 = None  # type: Optional[str]
    raw_image = None  # type: Optional[np.ndarray]

    if mode == "born_digital_pdf":
        text = _extract_text_from_pdf(file_bytes)
        forensic_flags += dforensic.analyze_pdf_metadata(file_bytes)
        ph = compute_phash_from_pdf(file_bytes)

    elif mode == "scanned_pdf":
        text = _extract_text_from_pdf(file_bytes)
        raw_image = pdf_page_to_array(file_bytes)
        if raw_image is not None:
            cleaned = preprocess_for_ocr(raw_image)
            if not text.strip():
                ocr_text, _ = extract_text(cleaned)
                text = ocr_text
            forensic_flags += pforensic.analyze_photo(raw_image)
            try:
                img_bytes = _array_to_bytes(raw_image)
                forensic_flags += dforensic.run_ela(img_bytes)
            except Exception:
                pass
        ph = compute_phash(file_bytes[:10000]) if len(file_bytes) > 0 else ""

    else:  # photo
        raw_image = image_bytes_to_array(file_bytes)
        if raw_image is not None:
            cleaned = preprocess_for_ocr(raw_image)
            text, _ = extract_text(cleaned)
            forensic_flags += pforensic.analyze_photo(raw_image)
        ph = compute_phash(file_bytes)

    # Doc type validation
    forensic_flags += validate_doc_type(text, doc_type)

    # Content rules
    content_flags, fields = _run_rules(text, doc_type)

    # Fingerprint
    c_hash = content_hash(text) if text else hashlib.sha256(file_bytes[:4096]).hexdigest()[:16]

    # Heatmap (pass-through the cleaned image for display)
    if raw_image is not None:
        heatmap_b64 = _image_to_b64_heatmap(raw_image)

    return {
        "mode": mode,
        "intake_mode": mode,
        "text": text,
        "fields": fields,
        "forensic_flags": forensic_flags,
        "content_flags": content_flags,
        "phash": ph,
        "content_hash": c_hash,
        "heatmap_b64": heatmap_b64,
    }


def _array_to_bytes(image: np.ndarray) -> bytes:
    try:
        import cv2
        _, buf = cv2.imencode(".jpg", image)
        return buf.tobytes()
    except Exception:
        return b""

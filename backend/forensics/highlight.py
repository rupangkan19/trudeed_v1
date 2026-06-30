"""
Document annotation — draws red boxes around regions where forgery flags fired.
Works for born-digital PDFs (text search via PyMuPDF) and photos (OCR word boxes).
"""
import base64
import re
from typing import Optional

# Maps flag code → list of text strings to search for in the document.
# Each found occurrence gets a red rectangle.
_FLAG_TARGETS: dict[str, list[str]] = {
    "SALARY_MATH_MISMATCH":    ["Net Salary", "Net Pay", "Gross Earnings",
                                 "Total Earnings", "Total Deductions", "Total Gross"],
    "NET_EXCEEDS_GROSS":       ["Net Salary", "Net Pay", "Gross"],
    "BALANCE_MISMATCH":        ["Closing Balance", "Opening Balance",
                                 "Total Credits", "Total Debits"],
    "RUNNING_BALANCE_ERROR":   ["Balance", "Date"],
    "AMOUNT_MISMATCH":         ["Amount in Words", "Amount"],
    "AADHAAR_CHECKSUM_INVALID":["UID", "Aadhaar"],
    "INVALID_IFSC":            ["IFSC"],
    "INVALID_PAN_FORMAT":      ["PAN"],
    "FORM16_SALARY_MATH":      ["Gross Salary", "Standard Deduction", "Net Taxable Salary"],
    "ITR_INCOME_MATH":         ["Gross Total Income", "Net Taxable Income",
                                 "Standard Deduction", "Deductions under Chapter"],
    "FUTURE_DATE":             ["Date", "Pay Period"],
    "STALE_CHEQUE":            ["Date"],
    "FUTURE_DATED_CHEQUE":     ["Date"],
    "EXCESS_TDS":              ["TDS", "Total TDS"],
    "REFERENCE_MISMATCH":      [],   # targets extracted from flag detail at runtime
    "DOCUMENT_RECYCLED":       [],
    "PAN_REUSED_ACROSS_APPLICANTS": ["PAN"],
}

# Highlight colours (R, G, B) in 0-1 scale for PyMuPDF
_RED   = (0.95, 0.1, 0.1)
_AMBER = (1.0,  0.6, 0.0)


def _extract_field_names_from_detail(detail: str) -> list[str]:
    """Pull out field names from REFERENCE_MISMATCH detail string."""
    # Detail format: "...but 2 field(s) were altered: Net Salary: original ₹56,850 →..."
    after = re.split(r"were altered:", detail, flags=re.IGNORECASE)
    if len(after) < 2:
        return []
    names = []
    for part in after[1].split(";"):
        m = re.match(r"\s*([A-Za-z ]+?):", part.strip())
        if m:
            names.append(m.group(1).strip())
    return names


def generate_highlight(
    file_bytes: bytes,
    filename: str,
    all_flags: list[dict],
) -> Optional[str]:
    """
    Render the first page of the document with coloured boxes over flagged regions.
    Returns a base64-encoded JPEG string, or None if rendering fails.
    """
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _highlight_pdf(file_bytes, all_flags)
    return _highlight_image(file_bytes, all_flags)


def _highlight_pdf(pdf_bytes: bytes, all_flags: list[dict]) -> Optional[str]:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return None

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[0]

        red_flags   = [f for f in all_flags if f.get("severity") == "RED"]
        amber_flags = [f for f in all_flags if f.get("severity") == "AMBER"]

        def _annotate(flags: list[dict], colour: tuple) -> None:
            seen_terms: set[str] = set()
            for flag in flags:
                code   = flag.get("code", "")
                detail = flag.get("detail", "")

                terms = list(_FLAG_TARGETS.get(code, []))
                if code == "REFERENCE_MISMATCH":
                    terms += _extract_field_names_from_detail(detail)

                for term in terms:
                    if term in seen_terms:
                        continue
                    seen_terms.add(term)
                    hits = page.search_for(term, quads=False)
                    for rect in hits:
                        # Draw a box around the label + extend right to cover the value
                        value_rect = fitz.Rect(
                            rect.x0, rect.y0 - 1,
                            min(rect.x1 + 160, page.rect.width - 5), rect.y1 + 1
                        )
                        shape = page.new_shape()
                        shape.draw_rect(value_rect)
                        shape.finish(color=colour, fill=(*colour, 0.10), width=1.6)
                        shape.commit()

        _annotate(red_flags,   _RED)
        _annotate(amber_flags, _AMBER)

        # Render at 150 dpi — good balance of size vs. readability
        pix = page.get_pixmap(dpi=150)
        img_data = pix.tobytes("jpeg", jpg_quality=88)
        doc.close()
        return base64.b64encode(img_data).decode()

    except Exception:
        return None


def _highlight_image(img_bytes: bytes, all_flags: list[dict]) -> Optional[str]:
    """For photos/scans: use OCR word boxes + OpenCV to draw highlights."""
    try:
        import cv2
        import numpy as np
        from PIL import Image
        import io
        import pytesseract

        pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

        red_terms:   set[str] = set()
        amber_terms: set[str] = set()

        for flag in all_flags:
            code   = flag.get("code", "")
            detail = flag.get("detail", "")
            terms  = list(_FLAG_TARGETS.get(code, []))
            if code == "REFERENCE_MISMATCH":
                terms += _extract_field_names_from_detail(detail)
            if flag.get("severity") == "RED":
                red_terms.update(t.lower() for t in terms)
            elif flag.get("severity") == "AMBER":
                amber_terms.update(t.lower() for t in terms)

        n_words = len(data["text"])
        for i in range(n_words):
            word = (data["text"][i] or "").strip().lower()
            if not word:
                continue
            colour = None
            if any(word in t or t in word for t in red_terms):
                colour = (0, 0, 230)     # BGR red
            elif any(word in t or t in word for t in amber_terms):
                colour = (0, 140, 255)   # BGR amber
            if colour:
                x, y, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
                # Extend box rightward to capture the value next to the label
                cv2.rectangle(img, (x - 2, y - 2), (x + w + 120, y + h + 2), colour, 2)

        _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 88])
        return base64.b64encode(buf.tobytes()).decode()

    except Exception:
        return None

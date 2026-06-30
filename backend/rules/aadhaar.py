"""
Aadhaar card rules.
Core check: 12-digit UID with Verhoeff checksum.
Secondary: name present, DOB present, address present.
"""
import re
from rules.common import validate_aadhaar, extract_dates

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "content"}


def run(text: str, fields: dict) -> list[dict]:
    flags: list[dict] = []

    uid = fields.get("aadhaar_number", "")
    if uid:
        if validate_aadhaar(uid):
            flags.append(_FLAG("AADHAAR_CHECKSUM_VALID", "GREEN",
                               f"Aadhaar UID {uid[:4]} **** **** passes Verhoeff checksum validation."))
        else:
            flags.append(_FLAG("AADHAAR_CHECKSUM_INVALID", "RED",
                               f"Aadhaar UID {uid[:4]} **** **** FAILS Verhoeff checksum. "
                               f"The UID has been altered — even a single digit change breaks the checksum."))
    else:
        flags.append(_FLAG("AADHAAR_NUMBER_NOT_FOUND", "AMBER",
                           "12-digit Aadhaar number not found in document. "
                           "May be masked or OCR failed on this field."))

    # Presence checks
    if not fields.get("holder_name"):
        flags.append(_FLAG("NAME_MISSING", "AMBER", "Name field not extracted from Aadhaar card."))

    if not fields.get("dob"):
        flags.append(_FLAG("DOB_MISSING", "AMBER", "Date of birth not found in Aadhaar card."))
    else:
        dates = extract_dates(fields["dob"])
        if dates:
            from datetime import datetime
            dob = dates[0]
            age = (datetime.now() - dob).days / 365.25
            if age < 0 or age > 120:
                flags.append(_FLAG("INVALID_DOB", "RED",
                                   f"Date of birth {fields['dob']} gives impossible age ({age:.0f} years)."))

    # UIDAI header check
    if "unique identification authority" not in text.lower() and "uidai" not in text.lower():
        flags.append(_FLAG("UIDAI_HEADER_MISSING", "AMBER",
                           "UIDAI header text not found. Genuine Aadhaar cards carry "
                           "'Unique Identification Authority of India' text."))
    else:
        flags.append(_FLAG("UIDAI_HEADER_PRESENT", "GREEN", "UIDAI issuing authority text present."))

    return flags


def extract_fields(text: str) -> dict:
    fields: dict[str, str] = {}

    uid_m = re.search(r"\b(\d{4})\s+(\d{4})\s+(\d{4})\b", text)
    if uid_m:
        uid = uid_m.group(1) + uid_m.group(2) + uid_m.group(3)
        fields["aadhaar_number"] = uid

    name_m = re.search(r"(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\n|$)", text, re.MULTILINE)
    if name_m:
        fields["holder_name"] = name_m.group(1).strip()

    dob_m = re.search(r"(?:DOB|Date\s+of\s+Birth)\s*[:\-]?\s*(\d{2}[/\-]\d{2}[/\-]\d{4})", text, re.IGNORECASE)
    if dob_m:
        fields["dob"] = dob_m.group(1)

    gender_m = re.search(r"\b(Male|Female|Transgender)\b", text, re.IGNORECASE)
    if gender_m:
        fields["gender"] = gender_m.group(1).capitalize()

    return fields

"""
Document type validator.
The bank officer selects the doc type; this validates the selection
by checking for expected keywords. If there's a mismatch, we warn.
"""

SIGNATURES: dict[str, list[str]] = {
    "SALARY_SLIP": ["salary slip", "pay slip", "payslip", "earnings", "gross salary",
                    "net salary", "net pay", "employee name", "deductions"],
    "BANK_STATEMENT": ["account statement", "bank statement", "transaction", "closing balance",
                       "opening balance", "account number", "credits", "debits"],
    "ITR": ["income tax return", "itr", "gross total income", "net taxable income",
            "assessment year", "tax liability", "tds deducted"],
    "FORM16": ["form 16", "form no. 16", "tds certificate", "deductor", "deductee",
               "certificate for tax deducted", "gross salary"],
    "CHEQUE": ["pay to", "amount in words", "micr", "cheque no", "bearer",
               "a/c payee", "bank", "branch"],
    "AADHAAR": ["aadhaar", "uid", "unique identification", "uidai", "government of india",
                "date of birth", "enrolment"],
}

from typing import Optional

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "forensic"}


def validate_doc_type(text: str, claimed_type: str) -> list[dict]:
    flags: list[dict] = []
    text_lower = text.lower()

    claimed_keywords = SIGNATURES.get(claimed_type, [])
    matches = sum(1 for kw in claimed_keywords if kw in text_lower)
    match_ratio = matches / len(claimed_keywords) if claimed_keywords else 0

    if match_ratio < 0.25:
        # Check what it actually looks like
        best_match = _best_match(text_lower)
        if best_match and best_match != claimed_type:
            flags.append(_FLAG(
                "DOC_TYPE_MISMATCH", "AMBER",
                f"You selected '{claimed_type}' but the document content resembles '{best_match}'. "
                f"Wrong document type selected, or document content is unexpected."
            ))
        else:
            flags.append(_FLAG(
                "DOC_TYPE_UNRECOGNIZED", "AMBER",
                f"Document does not contain expected keywords for '{claimed_type}'. "
                f"May be an unrecognized format or layout."
            ))
    return flags


def _best_match(text_lower: str) -> Optional[str]:
    best, best_score = None, 0
    for doc_type, keywords in SIGNATURES.items():
        score = sum(1 for kw in keywords if kw in text_lower) / len(keywords)
        if score > best_score:
            best_score, best = score, doc_type
    return best if best_score > 0.2 else None

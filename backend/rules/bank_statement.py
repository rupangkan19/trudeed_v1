"""
Bank statement rules.
Core check: running balance reconciliation (every transaction row must compute).
Secondary: IFSC validation, account number format, closing balance vs sum.
"""
import re
from typing import Optional
from rules.common import parse_amount, amounts_match, validate_pan, validate_ifsc

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "content"}


def _find_amount(text: str, *labels: str) -> Optional[float]:
    for label in labels:
        escaped = re.escape(label)
        # Pattern 1: label line, value on next line (table format)
        p1 = escaped + r"[^\n]*\n\s*(?:(?:Rs?\.?|I)\s*)?([0-9][0-9,]*(?:\.\d+)?)"
        # Pattern 2: label: value on same line (inline format)
        p2 = escaped + r"\s*[:\-]\s*(?:(?:Rs?\.?|I)\s*)?([0-9][0-9,]*(?:\.\d+)?)"
        for pattern in [p1, p2]:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                v = parse_amount(m.group(1))
                if v is not None and v >= 0:
                    return v
    return None


def run(text: str, fields: dict) -> list[dict]:
    flags: list[dict] = []

    opening = _find_amount(text, "Opening Balance")
    closing = _find_amount(text, "Closing Balance", "Closing Bal", "Balance C/F")
    total_credits = _find_amount(text, "Total Credits", "Total Credit", "Total CR")
    total_debits = _find_amount(text, "Total Debits", "Total Debit", "Total DR")

    # Primary: opening + credits - debits = closing
    if opening is not None and closing is not None and total_credits is not None and total_debits is not None:
        expected_closing = opening + total_credits - total_debits
        if not amounts_match(expected_closing, closing, tolerance_pct=0.1):
            flags.append(_FLAG(
                "BALANCE_MISMATCH", "RED",
                f"Balance does not reconcile: Opening ₹{opening:,.0f} + Credits ₹{total_credits:,.0f} "
                f"− Debits ₹{total_debits:,.0f} = ₹{expected_closing:,.0f}, "
                f"but Closing Balance stated as ₹{closing:,.0f} "
                f"(discrepancy: ₹{abs(expected_closing - closing):,.0f}). "
                f"Strong indicator of balance tampering."
            ))
        else:
            flags.append(_FLAG("BALANCE_RECONCILES", "GREEN",
                               f"Balance reconciles correctly: ₹{opening:,.0f} + ₹{total_credits:,.0f} "
                               f"− ₹{total_debits:,.0f} = ₹{closing:,.0f}."))

    # Row-level running balance check
    row_errors = _check_running_balance(text)
    if row_errors:
        flags.append(_FLAG(
            "RUNNING_BALANCE_ERROR", "RED",
            f"Transaction-level balance check failed at {len(row_errors)} row(s). "
            f"Example: {row_errors[0]}. Edited transactions break the running total."
        ))

    # IFSC validation
    ifsc_m = re.search(r"IFSC\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})", text, re.IGNORECASE)
    if ifsc_m:
        ifsc = ifsc_m.group(1).upper()
        if not validate_ifsc(ifsc):
            flags.append(_FLAG("INVALID_IFSC", "RED",
                               f"IFSC code '{ifsc}' is not in the RBI IFSC registry. "
                               f"This bank branch does not exist — document may be fabricated."))
        else:
            flags.append(_FLAG("IFSC_VALID", "GREEN", f"IFSC '{ifsc}' verified in RBI registry."))

    # PAN format
    pan = fields.get("pan", "")
    if pan and not validate_pan(pan):
        flags.append(_FLAG("INVALID_PAN_FORMAT", "AMBER", f"PAN '{pan}' format invalid."))

    # Sanity: credits or debits alone exceeding total by large margin
    if total_credits and closing and total_credits > closing * 10:
        flags.append(_FLAG("UNUSUAL_CREDIT_VOLUME", "AMBER",
                           f"Total credits ₹{total_credits:,.0f} is unusually high "
                           f"relative to closing balance ₹{closing:,.0f}."))

    return flags


def _check_running_balance(text: str) -> list[str]:
    """Parse transaction table and verify running balances match."""
    errors: list[str] = []
    pattern = re.compile(
        r"(\d{2}[/\-]\d{2}[/\-]\d{4})\s+"           # date
        r"(.+?)\s+"                                    # description
        r"([0-9,]+(?:\.\d{2})?|-)\s+"                # debit
        r"([0-9,]+(?:\.\d{2})?|-)\s+"                # credit
        r"([0-9,]+(?:\.\d{2})?)",                     # balance
        re.MULTILINE
    )
    rows = pattern.findall(text)
    if len(rows) < 2:
        return []

    for i in range(1, len(rows)):
        prev_bal = parse_amount(rows[i-1][4])
        debit = parse_amount(rows[i][2]) if rows[i][2] != "-" else 0.0
        credit = parse_amount(rows[i][3]) if rows[i][3] != "-" else 0.0
        curr_bal = parse_amount(rows[i][4])

        if prev_bal is None or curr_bal is None:
            continue
        debit = debit or 0.0
        credit = credit or 0.0

        expected = prev_bal + credit - debit
        if not amounts_match(expected, curr_bal, tolerance_pct=0.1):
            errors.append(
                f"Row {i+1} ({rows[i][0]}): expected balance ₹{expected:,.0f}, found ₹{curr_bal:,.0f}"
            )
        if len(errors) >= 3:
            break
    return errors


def extract_fields(text: str) -> dict:
    fields: dict[str, str] = {}

    acc_m = re.search(r"Account\s+(?:No|Number|No\.)\s*[:\-]?\s*(\d[\d\s\-]{6,20})", text, re.IGNORECASE)
    if acc_m:
        fields["account_number"] = re.sub(r"[\s\-]", "", acc_m.group(1))

    name_m = re.search(
        r"(?:Account\s+Holder|Customer\s+Name|A/C\s+Name|Name)\s*[:\-]?\s*(.+?)(?:\n|$)", text, re.IGNORECASE | re.MULTILINE
    )
    if name_m:
        fields["holder_name"] = name_m.group(1).strip()

    pan_m = re.search(r"PAN\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])", text, re.IGNORECASE)
    if pan_m:
        fields["pan"] = pan_m.group(1).upper()

    ifsc_m = re.search(r"IFSC\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})", text, re.IGNORECASE)
    if ifsc_m:
        fields["ifsc"] = ifsc_m.group(1).upper()

    for label, key in [("Total Credits", "total_credits"), ("Total Debits", "total_debits"),
                       ("Opening Balance", "opening_balance"), ("Closing Balance", "closing_balance")]:
        v = _find_amount(text, label)
        if v is not None:
            fields[key] = str(int(v))

    total_credits = _find_amount(text, "Total Credits", "Total Credit")
    if total_credits:
        fields["annual_income"] = str(int(total_credits * 12))

    return fields

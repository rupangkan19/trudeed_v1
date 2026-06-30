"""
Cheque / bank draft rules.
Core checks:
  1. Amount in words vs amount in figures
  2. Date validity (not stale >3 months, not future-dated)
  3. MICR line format
  4. IFSC validity
"""
import re
from datetime import datetime, timedelta
from typing import Optional
from rules.common import (parse_amount, words_to_amount, validate_ifsc,
                          extract_dates)

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "content"}


def run(text: str, fields: dict) -> list[dict]:
    flags: list[dict] = []

    # 1. Amount consistency
    amount_words_raw = fields.get("amount_words", "")
    amount_figures_raw = fields.get("amount_figures", "")

    amount_words_val = words_to_amount(amount_words_raw) if amount_words_raw else None
    amount_figures_val = parse_amount(amount_figures_raw) if amount_figures_raw else None

    if amount_words_val and amount_figures_val:
        diff_pct = abs(amount_words_val - amount_figures_val) / max(amount_figures_val, 1) * 100
        if diff_pct > 1.0:
            flags.append(_FLAG(
                "AMOUNT_MISMATCH", "RED",
                f"Amount mismatch: words say ₹{amount_words_val:,} but figures show ₹{amount_figures_val:,.0f}. "
                f"Classic cheque fraud — figure altered without changing the words."
            ))
        else:
            flags.append(_FLAG("AMOUNT_CONSISTENT", "GREEN",
                               f"Amount in words (₹{amount_words_val:,}) matches figures (₹{amount_figures_val:,.0f})."))
    elif amount_words_raw and not amount_words_val:
        flags.append(_FLAG("AMOUNT_WORDS_UNPARSEABLE", "AMBER",
                           f"Could not parse amount in words: '{amount_words_raw}'."))

    # 2. Date validity
    dates = extract_dates(text)
    if dates:
        cheque_date = dates[0]
        now = datetime.now()
        if cheque_date > now + timedelta(days=1):
            flags.append(_FLAG("FUTURE_DATED_CHEQUE", "AMBER",
                               f"Cheque dated {cheque_date.strftime('%d/%m/%Y')} is future-dated."))
        elif (now - cheque_date).days > 90:
            flags.append(_FLAG("STALE_CHEQUE", "AMBER",
                               f"Cheque dated {cheque_date.strftime('%d/%m/%Y')} is over 3 months old — "
                               f"banks do not honour stale cheques."))
        else:
            flags.append(_FLAG("CHEQUE_DATE_VALID", "GREEN",
                               f"Cheque date {cheque_date.strftime('%d/%m/%Y')} is valid."))
    else:
        flags.append(_FLAG("CHEQUE_DATE_MISSING", "AMBER", "Cheque date not found."))

    # 3. MICR line
    micr = fields.get("micr", "")
    if micr:
        if re.match(r"^\d{9}$", micr):
            flags.append(_FLAG("MICR_FORMAT_VALID", "GREEN", f"MICR code {micr} is correctly formatted."))
        else:
            flags.append(_FLAG("MICR_FORMAT_INVALID", "AMBER",
                               f"MICR code '{micr}' is not a valid 9-digit code."))

    # 4. IFSC (if present on cheque)
    ifsc = fields.get("ifsc", "")
    if ifsc:
        if not validate_ifsc(ifsc):
            flags.append(_FLAG("INVALID_IFSC", "RED",
                               f"IFSC '{ifsc}' not found in RBI registry. Branch may not exist."))
        else:
            flags.append(_FLAG("IFSC_VALID", "GREEN", f"IFSC '{ifsc}' verified."))

    return flags


def extract_fields(text: str) -> dict:
    fields: dict[str, str] = {}

    cheque_m = re.search(r"Cheque\s+No\.?\s*[:\-]?\s*(\d{6,9})", text, re.IGNORECASE)
    if cheque_m:
        fields["cheque_number"] = cheque_m.group(1)

    payee_m = re.search(r"Pay\s+to\s*[:\-]?\s*(.+?)(?:\n|$)", text, re.IGNORECASE | re.MULTILINE)
    if payee_m:
        fields["payee"] = payee_m.group(1).strip()

    words_m = re.search(r"Amount\s+in\s+Words?\s*[:\-]?\s*(?:Rupees?\s+)?(.+?)(?:Only)?(?:\n|$)",
                        text, re.IGNORECASE | re.MULTILINE)
    if words_m:
        fields["amount_words"] = words_m.group(1).strip()

    figures_m = re.search(r"Amount\s*[:\-]?\s*(?:(?:Rs?\.?|I)\s*)?([0-9][0-9,]*(?:\.\d{2})?)", text, re.IGNORECASE)
    if figures_m:
        fields["amount_figures"] = figures_m.group(1)

    micr_m = re.search(r"MICR\s*[:\-]?\s*(\d{9})", text, re.IGNORECASE)
    if micr_m:
        fields["micr"] = micr_m.group(1)

    ifsc_m = re.search(r"IFSC\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})", text, re.IGNORECASE)
    if ifsc_m:
        fields["ifsc"] = ifsc_m.group(1).upper()

    acc_m = re.search(r"A/C\s+No\.?\s*[:\-]?\s*(\d[\d\s]{8,20})", text, re.IGNORECASE)
    if acc_m:
        fields["account_number"] = re.sub(r"\s+", "", acc_m.group(1))

    return fields

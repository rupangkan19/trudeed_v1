"""
Salary slip / payslip rules.
Core check: Gross - Total_Deductions = Net (within 1%).
Secondary: PAN format, date validity, component sanity.
"""
import re
from typing import Optional
from rules.common import parse_amount, amounts_match, validate_pan, extract_dates
from datetime import datetime

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
                if v is not None and v > 0:
                    return v
    return None


def run(text: str, fields: dict) -> list[dict]:
    flags: list[dict] = []

    gross = _find_amount(text, "Gross Earnings", "Gross Salary", "Gross Pay", "Total Earnings", "Total Gross")
    deductions = _find_amount(text, "Total Deductions", "Total Deduction", "Net Deductions")
    net = _find_amount(text, "Net Salary", "Net Pay", "Take Home", "Net Amount", "Net Take Home")

    if gross and deductions and net:
        expected_net = gross - deductions
        if not amounts_match(expected_net, net, tolerance_pct=1.5):
            flags.append(_FLAG(
                "SALARY_MATH_MISMATCH", "RED",
                f"Salary math does not reconcile: Gross ₹{gross:,.0f} − Deductions ₹{deductions:,.0f} = ₹{expected_net:,.0f}, "
                f"but document states Net ₹{net:,.0f} (difference: ₹{abs(expected_net - net):,.0f}). "
                f"Likely field tampering."
            ))
        else:
            flags.append(_FLAG("SALARY_MATH_OK", "GREEN",
                               f"Salary math reconciles: ₹{gross:,.0f} − ₹{deductions:,.0f} = ₹{net:,.0f}."))
    elif gross and net and not deductions:
        if gross < net:
            flags.append(_FLAG("NET_EXCEEDS_GROSS", "RED",
                               f"Net salary ₹{net:,.0f} exceeds gross ₹{gross:,.0f} — impossible without negative deductions."))

    pan = fields.get("pan", "")
    if pan and not validate_pan(pan):
        flags.append(_FLAG("INVALID_PAN_FORMAT", "AMBER",
                           f"PAN '{pan}' does not conform to Indian PAN format (AAAAA0000A)."))

    # HRA should typically not exceed 50% of basic
    basic = _find_amount(text, "Basic Salary", "Basic", "Basic Pay")
    hra = _find_amount(text, "HRA", "House Rent Allowance")
    if basic and hra and basic > 0:
        hra_pct = hra / basic * 100
        if hra_pct > 60:
            flags.append(_FLAG("HRA_EXCESSIVE", "AMBER",
                               f"HRA ₹{hra:,.0f} is {hra_pct:.0f}% of basic ₹{basic:,.0f} — "
                               f"standard limit is 40–50%. Unusual."))

    # PF should be 12% of basic (±5%)
    pf = _find_amount(text, "PF (Employee)", "Provident Fund", "EPF", "PF")
    if basic and pf and basic > 0:
        expected_pf = basic * 0.12
        if not amounts_match(expected_pf, pf, tolerance_pct=10):
            flags.append(_FLAG("PF_MISMATCH", "AMBER",
                               f"PF ₹{pf:,.0f} deviates significantly from statutory 12% of basic "
                               f"(expected ~₹{expected_pf:,.0f})."))

    # Check date is not in the future
    dates = extract_dates(text)
    now = datetime.now()
    for d in dates:
        if d > now:
            flags.append(_FLAG("FUTURE_DATE", "AMBER",
                               f"Document contains a future date ({d.strftime('%d/%m/%Y')}). "
                               f"Salary slips should not be pre-dated."))
            break

    return flags


def extract_fields(text: str) -> dict:
    fields: dict[str, str] = {}

    pan_m = re.search(r"PAN\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])", text, re.IGNORECASE)
    if pan_m:
        fields["pan"] = pan_m.group(1).upper()

    name_m = re.search(
        r"(?:Employee\s+Name|Name\s+of\s+Employee|Name)\s*[:\-]?\s*(.+?)(?:\n|$)", text, re.IGNORECASE | re.MULTILINE
    )
    if name_m:
        fields["employee_name"] = name_m.group(1).strip()

    emp_m = re.search(
        r"(?:Company|Organisation|Organization|Employer)\s*[:\-]?\s*(.+?)(?:\n|$)", text, re.IGNORECASE | re.MULTILINE
    )
    if emp_m:
        fields["employer_name"] = emp_m.group(1).strip()

    gross = _find_amount(text, "Gross Earnings", "Gross Salary", "Gross Pay", "Total Earnings", "Total Gross")
    if gross:
        fields["gross_salary"] = str(int(gross))
        fields["annual_income"] = str(int(gross * 12))

    net = _find_amount(text, "Net Salary", "Net Pay", "Take Home")
    if net:
        fields["net_salary"] = str(int(net))

    month_m = re.search(r"(?:Month|Pay Period|Salary Month)\s*[:\-]?\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
    if month_m:
        fields["pay_month"] = month_m.group(1).strip()

    return fields

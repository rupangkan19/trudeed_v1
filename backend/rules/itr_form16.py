"""
ITR and Form 16 rules.
Core checks: income math, valid financial year, PAN format.
Cross-check between ITR and Form 16 is handled in cross_doc.py.
"""
import re
from typing import Optional
from rules.common import (parse_amount, amounts_match, validate_pan,
                          validate_financial_year, extract_dates)
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


def run_itr(text: str, fields: dict) -> list[dict]:
    flags: list[dict] = []

    gross = _find_amount(text, "Gross Total Income", "Total Income", "Gross Income")
    std_deduction = _find_amount(text, "Standard Deduction", "Deductions under Chapter VI-A")
    net_taxable = _find_amount(text, "Net Taxable Income", "Total Taxable Income")

    if gross and std_deduction and net_taxable:
        expected_net = gross - std_deduction
        if not amounts_match(expected_net, net_taxable, tolerance_pct=2.0):
            flags.append(_FLAG(
                "ITR_INCOME_MATH", "RED",
                f"ITR income calculation error: Gross ₹{gross:,.0f} − Deductions ₹{std_deduction:,.0f} "
                f"= ₹{expected_net:,.0f}, but Net Taxable Income stated as ₹{net_taxable:,.0f}."
            ))
        else:
            flags.append(_FLAG("ITR_INCOME_MATH_OK", "GREEN",
                               f"ITR income calculation is internally consistent."))

    # Financial year validation
    fy_m = re.search(r"(?:Assessment|Financial)\s+Year\s*[:\-]?\s*(20\d{2}[-–]\d{2,4})", text, re.IGNORECASE)
    if fy_m:
        fy = fy_m.group(1)
        if not validate_financial_year(fy):
            flags.append(_FLAG("INVALID_FY", "RED",
                               f"Financial year '{fy}' is invalid. "
                               f"FY must span April–March (e.g., 2024-25)."))
    else:
        flags.append(_FLAG("FY_NOT_FOUND", "AMBER",
                           "Assessment year not found in document. Expected 'Assessment Year: YYYY-YY'."))

    pan = fields.get("pan", "")
    if pan and not validate_pan(pan):
        flags.append(_FLAG("INVALID_PAN_FORMAT", "AMBER", f"PAN '{pan}' format invalid."))

    # TDS check: TDS should not exceed tax liability by large margin
    tds = _find_amount(text, "TDS Deducted", "Tax Deducted at Source", "Total TDS")
    tax_liability = _find_amount(text, "Total Tax Liability", "Tax Payable", "Tax on Total Income")
    if tds and tax_liability and tds > tax_liability * 2.0:
        flags.append(_FLAG("EXCESS_TDS", "AMBER",
                           f"TDS ₹{tds:,.0f} is more than double the stated tax liability ₹{tax_liability:,.0f}. Unusual."))

    return flags


def run_form16(text: str, fields: dict) -> list[dict]:
    flags: list[dict] = []

    gross = _find_amount(text, "Gross Salary", "Total Salary", "Salary Paid")
    std_deduction = _find_amount(text, "Standard Deduction")
    net_salary = _find_amount(text, "Net Salary", "Net Taxable Salary")

    if gross and std_deduction and net_salary:
        expected = gross - std_deduction
        if not amounts_match(expected, net_salary, tolerance_pct=2.0):
            flags.append(_FLAG(
                "FORM16_SALARY_MATH", "RED",
                f"Form 16 salary math error: Gross ₹{gross:,.0f} − Std Deduction ₹{std_deduction:,.0f} "
                f"= ₹{expected:,.0f}, stated Net ₹{net_salary:,.0f}."
            ))
        else:
            flags.append(_FLAG("FORM16_MATH_OK", "GREEN", "Form 16 salary calculation is consistent."))

    fy_m = re.search(r"(?:Financial|Assessment)\s+Year\s*[:\-]?\s*(20\d{2}[-–]\d{2,4})", text, re.IGNORECASE)
    if fy_m and not validate_financial_year(fy_m.group(1)):
        flags.append(_FLAG("INVALID_FY", "RED", f"Financial year '{fy_m.group(1)}' invalid."))

    pan = fields.get("pan", "")
    if pan and not validate_pan(pan):
        flags.append(_FLAG("INVALID_PAN_FORMAT", "AMBER", f"PAN '{pan}' format invalid."))

    return flags


def extract_itr_fields(text: str) -> dict:
    fields: dict[str, str] = {}

    pan_m = re.search(r"PAN\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])", text, re.IGNORECASE)
    if pan_m:
        fields["pan"] = pan_m.group(1).upper()

    name_m = re.search(r"Name\s*[:\-]?\s*(.+?)(?:\n|$)", text, re.IGNORECASE | re.MULTILINE)
    if name_m:
        fields["taxpayer_name"] = name_m.group(1).strip()

    emp_m = re.search(r"(?:Employer\s+Name|Name\s+of\s+Employer)\s*[:\-]?\s*(.+?)(?:\n|$)",
                      text, re.IGNORECASE | re.MULTILINE)
    if emp_m:
        fields["employer_name"] = emp_m.group(1).strip()

    gross = _find_amount(text, "Gross Total Income", "Total Income")
    if gross:
        fields["annual_income"] = str(int(gross))

    fy_m = re.search(r"(?:Assessment|Financial)\s+Year\s*[:\-]?\s*(20\d{2}[-–]\d{2,4})", text, re.IGNORECASE)
    if fy_m:
        fields["financial_year"] = fy_m.group(1)

    return fields


def extract_form16_fields(text: str) -> dict:
    fields: dict[str, str] = {}

    pan_m = re.search(r"PAN\s+of\s+Employee\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])", text, re.IGNORECASE)
    if not pan_m:
        pan_m = re.search(r"PAN\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])", text, re.IGNORECASE)
    if pan_m:
        fields["pan"] = pan_m.group(1).upper()

    name_m = re.search(r"Name\s+of\s+Employee\s*[:\-]?\s*(.+?)(?:\n|$)",
                       text, re.IGNORECASE | re.MULTILINE)
    if name_m:
        fields["employee_name"] = name_m.group(1).strip()

    emp_m = re.search(r"(?:Name\s+of\s+Employer|Employer(?:'s)?\s+Name)\s*[:\-]?\s*(.+?)(?:\n|$)",
                      text, re.IGNORECASE | re.MULTILINE)
    if emp_m:
        fields["employer_name"] = emp_m.group(1).strip()

    gross = _find_amount(text, "Gross Salary", "Total Salary")
    if gross:
        fields["annual_income"] = str(int(gross))

    tds = _find_amount(text, "Total TDS Deducted", "TDS Deducted", "Tax Deducted")
    if tds:
        fields["tds_deducted"] = str(int(tds))

    fy_m = re.search(r"(?:Financial|Assessment)\s+Year\s*[:\-]?\s*(20\d{2}[-–]\d{2,4})", text, re.IGNORECASE)
    if fy_m:
        fields["financial_year"] = fy_m.group(1)

    return fields

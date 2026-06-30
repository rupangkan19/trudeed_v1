"""
Generates demo PDFs — genuine and tampered versions of each document type.
Run: python demo_generator.py
Output: demo_docs/ directory with 12 PDFs.
"""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle,
                                 Paragraph, Spacer, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from rules.common import verhoeff_generate_check

OUT = Path(__file__).parent / "demo_docs"
OUT.mkdir(exist_ok=True)

styles = getSampleStyleSheet()
TITLE = ParagraphStyle("title", parent=styles["Title"], fontSize=14, spaceAfter=4)
H2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=11, spaceAfter=3)
BODY = ParagraphStyle("body", parent=styles["Normal"], fontSize=9, spaceAfter=2)
SMALL = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, spaceAfter=1)
CENTER = ParagraphStyle("center", parent=styles["Normal"], fontSize=9, alignment=TA_CENTER)
RIGHT = ParagraphStyle("right", parent=styles["Normal"], fontSize=9, alignment=TA_RIGHT)

NAVY = colors.HexColor("#1e3a5f")
LIGHT = colors.HexColor("#e8edf2")


def _doc(filename: str) -> SimpleDocTemplate:
    return SimpleDocTemplate(str(OUT / filename), pagesize=A4,
                             topMargin=15*mm, bottomMargin=15*mm,
                             leftMargin=20*mm, rightMargin=20*mm)


def _table(data, col_widths=None, header_rows=1):
    t = Table(data, colWidths=col_widths)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    t.setStyle(TableStyle(style))
    return t


# ── VALID AADHAAR ─────────────────────────────────────────────────────────────
VALID_UID = verhoeff_generate_check("23456789012")   # 12-digit valid
INVALID_UID = str(int(VALID_UID[:-1]) + 1).zfill(11) + str((int(VALID_UID[-1]) + 1) % 10)


# ══════════════════════════════════════════════════════════════════════════════
# SALARY SLIP
# ══════════════════════════════════════════════════════════════════════════════
def make_salary_slip(filename: str, net_salary: int) -> None:
    """Genuine: net=56850. Tampered: net=76850 (math fails)."""
    doc = _doc(filename)
    story = []

    story.append(Paragraph("INFOSYS LIMITED", TITLE))
    story.append(Paragraph("CIN: L85110KA1981PLC013115 | www.infosys.com", SMALL))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("SALARY SLIP", ParagraphStyle("ss", parent=TITLE, fontSize=12)))
    story.append(Spacer(1, 3*mm))

    info = [
        ["Employee Name:", "RAVI KUMAR SHARMA", "Month:", "April 2024"],
        ["Employee ID:", "INF-10234", "Department:", "Technology"],
        ["Designation:", "Senior Software Engineer", "PAN:", "ABCPK1234E"],
        ["Bank:", "STATE BANK OF INDIA", "A/C No:", "10234567890"],
    ]
    t = Table(info, colWidths=[45*mm, 65*mm, 30*mm, 45*mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    earn = [
        ["EARNINGS", "AMOUNT (₹)"],
        ["Basic Salary", "40,000"],
        ["HRA", "16,000"],
        ["Special Allowance", "8,000"],
        ["Transport Allowance", "1,600"],
        ["Medical Allowance", "1,250"],
        ["Gross Earnings", "66,850"],
    ]
    ded = [
        ["DEDUCTIONS", "AMOUNT (₹)"],
        ["PF (Employee)", "4,800"],
        ["Professional Tax", "200"],
        ["Income Tax (TDS)", "5,000"],
        ["Total Deductions", "10,000"],
        ["", ""],
        ["", ""],
    ]
    side = Table([[_table(earn, [70*mm, 35*mm]), _table(ded, [70*mm, 35*mm])]],
                 colWidths=[108*mm, 108*mm])
    side.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                               ("LEFTPADDING", (0, 0), (-1, -1), 0),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    story.append(side)
    story.append(Spacer(1, 4*mm))

    net_tbl = Table([["NET SALARY", f"₹{net_salary:,}"]],
                    colWidths=[140*mm, 35*mm])
    net_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(net_tbl)

    doc.build(story)
    print(f"  Created: {filename} (net=₹{net_salary:,})")


# ══════════════════════════════════════════════════════════════════════════════
# BANK STATEMENT
# ══════════════════════════════════════════════════════════════════════════════
def make_bank_statement(filename: str, closing_balance: int) -> None:
    """Genuine: closing=74000. Tampered: closing=94000 (math fails)."""
    doc = _doc(filename)
    story = []

    story.append(Paragraph("STATE BANK OF INDIA", TITLE))
    story.append(Paragraph("Main Branch, MG Road, Bangalore - 560001", SMALL))
    story.append(Paragraph("IFSC: SBIN0001234  |  MICR: 560002009", SMALL))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("ACCOUNT STATEMENT", ParagraphStyle("ss", parent=TITLE, fontSize=12)))
    story.append(Spacer(1, 3*mm))

    info = [
        ["Account Holder:", "PRIYA MEHTA", "Account Type:", "Savings"],
        ["Account Number:", "20987654321", "PAN:", "BCDQM5678F"],
        ["Period:", "01/04/2024 to 30/04/2024", "Branch:", "MG Road, Bangalore"],
    ]
    t = Table(info, colWidths=[40*mm, 70*mm, 35*mm, 60*mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    txns = [
        ["DATE", "DESCRIPTION", "DEBIT (₹)", "CREDIT (₹)", "BALANCE (₹)"],
        ["01/04/2024", "Opening Balance", "-", "-", "50,000"],
        ["05/04/2024", "NEFT-INFOSYS SALARY", "-", "45,000", "95,000"],
        ["10/04/2024", "UPI-ZOMATO TECHNOLOGIES", "500", "-", "94,500"],
        ["15/04/2024", "ATM-WITHDRAWAL JALAHALLI", "5,000", "-", "89,500"],
        ["20/04/2024", "EMI-HDFC HOME LOAN", "12,000", "-", "77,500"],
        ["25/04/2024", "UPI-AMAZON RETAIL INDIA", "2,000", "-", "75,500"],
        ["28/04/2024", "BESCOM ELECTRICITY BILL", "1,500", "-", "74,000"],
    ]
    story.append(_table(txns, [30*mm, 65*mm, 27*mm, 27*mm, 27*mm]))
    story.append(Spacer(1, 4*mm))

    summary = [
        ["Opening Balance:", f"Rs. 50,000"],
        ["Total Credits:", f"Rs. 45,000"],
        ["Total Debits:", f"Rs. 21,000"],
        ["Closing Balance:", f"Rs. {closing_balance:,}"],
    ]
    t2 = Table(summary, colWidths=[80*mm, 80*mm])
    t2.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 3), (1, 3), "Helvetica-Bold"),
        ("BACKGROUND", (0, 3), (-1, 3), NAVY),
        ("TEXTCOLOR", (0, 3), (-1, 3), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t2)
    doc.build(story)
    print(f"  Created: {filename} (closing=₹{closing_balance:,})")


# ══════════════════════════════════════════════════════════════════════════════
# ITR
# ══════════════════════════════════════════════════════════════════════════════
def make_itr(filename: str, gross_income: int) -> None:
    """Genuine: 790000. Tampered: 500000 (cross-doc mismatch with Form 16)."""
    doc = _doc(filename)
    story = []

    story.append(Paragraph("INCOME TAX DEPARTMENT — GOVERNMENT OF INDIA", TITLE))
    story.append(Paragraph("INCOME TAX RETURN — ITR-1 (SAHAJ)", H2))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
    story.append(Spacer(1, 3*mm))

    info = [
        ["Assessment Year:", "2024-25", "PAN:", "CDEPK5678G"],
        ["Name:", "RAVI KUMAR SHARMA", "Filing Date:", "31/07/2024"],
        ["Employer Name:", "INFOSYS LIMITED", "Return Type:", "Original"],
    ]
    t = Table(info, colWidths=[40*mm, 65*mm, 30*mm, 65*mm])
    t.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 8),
                            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                            ("TOPPADDING", (0, 0), (-1, -1), 2),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    net_taxable = gross_income - 50000
    tax = max(0, int((net_taxable - 500000) * 0.2)) if net_taxable > 500000 else 0
    cess = int(tax * 0.04)
    total_tax = tax + cess
    tds = 60000
    refund = max(0, tds - total_tax)

    income_data = [
        ["INCOME DETAILS", "AMOUNT (₹)"],
        ["Gross Total Income", f"{gross_income:,}"],
        ["Standard Deduction (u/s 16(ia))", "50,000"],
        ["Net Taxable Income", f"{net_taxable:,}"],
    ]
    story.append(_table(income_data, [120*mm, 60*mm]))
    story.append(Spacer(1, 3*mm))

    tax_data = [
        ["TAX COMPUTATION", "AMOUNT (₹)"],
        ["Tax on Total Income", f"{tax:,}"],
        ["Education Cess @ 4%", f"{cess:,}"],
        ["Total Tax Liability", f"{total_tax:,}"],
        ["TDS Deducted (as per Form 16)", f"{tds:,}"],
        ["Refund Due", f"{refund:,}"],
    ]
    story.append(_table(tax_data, [120*mm, 60*mm]))
    doc.build(story)
    print(f"  Created: {filename} (gross=₹{gross_income:,})")


# ══════════════════════════════════════════════════════════════════════════════
# FORM 16
# ══════════════════════════════════════════════════════════════════════════════
def make_form16(filename: str) -> None:
    doc = _doc(filename)
    story = []

    story.append(Paragraph("FORM 16", TITLE))
    story.append(Paragraph("[See rule 31(1)(a)]", SMALL))
    story.append(Paragraph("Certificate for Tax Deducted at Source on Salary", H2))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
    story.append(Spacer(1, 3*mm))

    info = [
        ["Financial Year:", "2024-25", "Assessment Year:", "2025-26"],
        ["TAN of Employer:", "BLRI12345A", "PAN of Employer:", "AAACI5678F"],
        ["Name of Employer:", "INFOSYS LIMITED", "", ""],
        ["PAN of Employee:", "CDEPK5678G", "", ""],
        ["Name of Employee:", "RAVI KUMAR SHARMA", "", ""],
    ]
    t = Table(info, colWidths=[40*mm, 60*mm, 40*mm, 60*mm])
    t.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 8),
                            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                            ("TOPPADDING", (0, 0), (-1, -1), 2),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    salary_data = [
        ["SALARY DETAILS (PART A)", "AMOUNT (₹)"],
        ["Gross Salary", "7,90,000"],
        ["Standard Deduction (u/s 16(ia))", "50,000"],
        ["Net Taxable Salary", "7,40,000"],
        ["Total TDS Deducted", "60,000"],
    ]
    story.append(_table(salary_data, [120*mm, 60*mm]))
    story.append(Spacer(1, 3*mm))

    monthly = [
        ["MONTH", "AMOUNT PAID (₹)", "TDS DEDUCTED (₹)"],
        ["April 2023", "65,833", "5,000"],
        ["May 2023", "65,833", "5,000"],
        ["June 2023", "65,833", "5,000"],
        ["July 2023", "65,833", "5,000"],
        ["August 2023", "65,833", "5,000"],
        ["September 2023", "65,833", "5,000"],
        ["October 2023", "65,833", "5,000"],
        ["November 2023", "65,833", "5,000"],
        ["December 2023", "65,833", "5,000"],
        ["January 2024", "65,833", "5,000"],
        ["February 2024", "65,833", "5,000"],
        ["March 2024", "65,837", "5,000"],
        ["TOTAL", "7,90,000", "60,000"],
    ]
    story.append(_table(monthly, [60*mm, 60*mm, 60*mm]))
    doc.build(story)
    print(f"  Created: {filename}")


# ══════════════════════════════════════════════════════════════════════════════
# AADHAAR
# ══════════════════════════════════════════════════════════════════════════════
def make_aadhaar(filename: str, uid: str) -> None:
    doc = _doc(filename)
    story = []

    story.append(Paragraph("Government of India", TITLE))
    story.append(Paragraph("Unique Identification Authority of India (UIDAI)", H2))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
    story.append(Spacer(1, 5*mm))

    uid_display = f"{uid[:4]} {uid[4:8]} {uid[8:12]}"
    info = [
        ["Name:", "PRIYA MEHTA"],
        ["Date of Birth:", "15/03/1990"],
        ["Gender:", "Female"],
        ["Address:", "42, MG Road, Bangalore - 560001, Karnataka, India"],
        ["Aadhaar Number:", uid_display],
        ["Enrollment:", "1234/56789/00001"],
    ]
    t = Table(info, colWidths=[50*mm, 130*mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 4), (1, 4), "Helvetica-Bold"),
        ("FONTSIZE", (1, 4), (1, 4), 14),
        ("TEXTCOLOR", (1, 4), (1, 4), NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
    ]))
    story.append(t)
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("This Aadhaar card is issued by UIDAI under the Aadhaar Act, 2016.", SMALL))
    story.append(Paragraph("For verification visit: resident.uidai.gov.in", SMALL))

    doc.build(story)
    print(f"  Created: {filename} (uid={uid_display})")


# ══════════════════════════════════════════════════════════════════════════════
# CHEQUE
# ══════════════════════════════════════════════════════════════════════════════
def make_cheque(filename: str, amount_figures: int, amount_words: str) -> None:
    doc = _doc(filename)
    story = []

    story.append(Paragraph("STATE BANK OF INDIA", TITLE))
    story.append(Paragraph("MG Road Branch, Bangalore — IFSC: SBIN0001234", SMALL))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
    story.append(Spacer(1, 5*mm))

    cheque_data = [
        ["Cheque No.:", "001234", "Date:", "15/05/2024"],
        ["Pay to:", "RAVI KUMAR SHARMA", "", ""],
        ["Amount in Words:", f"Rupees {amount_words} Only", "", ""],
        ["Amount:", f"₹{amount_figures:,}/-", "", ""],
        ["A/C No.:", "20987654321", "MICR:", "560002011"],
        ["IFSC:", "SBIN0001234", "", ""],
    ]
    t = Table(cheque_data, colWidths=[40*mm, 85*mm, 20*mm, 60*mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
    ]))
    story.append(t)
    story.append(Spacer(1, 10*mm))

    sig_row = Table([["Authorized Signatory: _________________________", ""]],
                    colWidths=[130*mm, 60*mm])
    sig_row.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 9)]))
    story.append(sig_row)
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("⑆560002011⑆ ⑇20987654321⑇ 001234",
                            ParagraphStyle("micr", parent=BODY, fontName="Courier", fontSize=11)))

    doc.build(story)
    print(f"  Created: {filename} (figures=₹{amount_figures:,}, words={amount_words})")


# ══════════════════════════════════════════════════════════════════════════════
# BANK STATEMENT WITH FAKE IFSC
# ══════════════════════════════════════════════════════════════════════════════
def make_fake_bank_statement(filename: str) -> None:
    """Bank statement with a fabricated IFSC (not in RBI registry)."""
    doc = _doc(filename)
    story = []

    story.append(Paragraph("SUNRISE COOPERATIVE BANK", TITLE))
    story.append(Paragraph("Main Branch, Electronic City, Bangalore - 560100", SMALL))
    story.append(Paragraph("IFSC: SUNR0001234  |  MICR: 560099001", SMALL))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("ACCOUNT STATEMENT", ParagraphStyle("ss", parent=TITLE, fontSize=12)))
    story.append(Spacer(1, 3*mm))

    info = [
        ["Account Holder:", "AMIT VERMA", "Account Type:", "Savings"],
        ["Account Number:", "99887766554", "PAN:", "CVTPA9876G"],
        ["Period:", "01/04/2024 to 30/04/2024", "Branch:", "Electronic City"],
    ]
    t = Table(info, colWidths=[40*mm, 70*mm, 35*mm, 60*mm])
    t.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 8),
                            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                            ("TOPPADDING", (0, 0), (-1, -1), 2),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    txns = [
        ["DATE", "DESCRIPTION", "DEBIT (₹)", "CREDIT (₹)", "BALANCE (₹)"],
        ["01/04/2024", "Opening Balance", "-", "-", "1,00,000"],
        ["05/04/2024", "CASH DEPOSIT", "-", "5,00,000", "6,00,000"],
        ["15/04/2024", "NEFT TRANSFER OUT", "2,00,000", "-", "4,00,000"],
        ["25/04/2024", "WITHDRAWAL", "1,00,000", "-", "3,00,000"],
    ]
    story.append(_table(txns, [30*mm, 65*mm, 27*mm, 27*mm, 27*mm]))
    story.append(Spacer(1, 4*mm))

    summary = [
        ["Opening Balance:", "Rs. 1,00,000"],
        ["Total Credits:", "Rs. 5,00,000"],
        ["Total Debits:", "Rs. 3,00,000"],
        ["Closing Balance:", "Rs. 3,00,000"],
    ]
    t2 = Table(summary, colWidths=[80*mm, 80*mm])
    t2.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 3), (-1, 3), NAVY),
        ("TEXTCOLOR", (0, 3), (-1, 3), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t2)
    doc.build(story)
    print(f"  Created: {filename} (FAKE IFSC: SUNR0001234)")


if __name__ == "__main__":
    print("Generating demo documents...")
    print(f"Output directory: {OUT}")
    print()

    # Salary slips
    make_salary_slip("salary_genuine.pdf", net_salary=56850)
    make_salary_slip("salary_tampered.pdf", net_salary=76850)   # net inflated, math breaks

    # Bank statements
    make_bank_statement("bank_genuine.pdf", closing_balance=74000)
    make_bank_statement("bank_tampered.pdf", closing_balance=94000)  # closing inflated

    # ITR (matches Form 16)
    make_itr("itr_genuine.pdf", gross_income=790000)
    make_itr("itr_tampered.pdf", gross_income=500000)   # income deflated vs Form 16

    # Form 16 (income = 7,90,000 — matches genuine ITR, not tampered)
    make_form16("form16.pdf")

    # Aadhaar
    make_aadhaar("aadhaar_genuine.pdf", uid=VALID_UID)
    make_aadhaar("aadhaar_tampered.pdf", uid=INVALID_UID)   # checksum fails

    # Cheques
    make_cheque("cheque_genuine.pdf", 25000, "Twenty Five Thousand")
    make_cheque("cheque_tampered.pdf", 75000, "Twenty Five Thousand")  # figures altered

    # Fabricated bank (fake IFSC)
    make_fake_bank_statement("bank_fabricated.pdf")

    print()
    print(f"Done! {len(list(OUT.iterdir()))} files created in {OUT}")
    print()
    print("Demo scenarios:")
    print("  salary_genuine.pdf   → GENUINE  (math: 66850 - 10000 = 56850 ✓)")
    print("  salary_tampered.pdf  → FORGED   (math: 66850 - 10000 ≠ 76850 ✗)")
    print("  bank_genuine.pdf     → GENUINE  (50000 + 45000 - 21000 = 74000 ✓)")
    print("  bank_tampered.pdf    → FORGED   (balance does not reconcile ✗)")
    print("  itr_genuine.pdf      → GENUINE  (income matches Form 16 ✓)")
    print("  itr_tampered.pdf     → SUSPICIOUS (upload Form 16 first, then this)")
    print("  aadhaar_genuine.pdf  → GENUINE  (Verhoeff checksum ✓)")
    print("  aadhaar_tampered.pdf → FORGED   (Verhoeff checksum fails ✗)")
    print("  cheque_genuine.pdf   → GENUINE  (words = figures ✓)")
    print("  cheque_tampered.pdf  → FORGED   (₹75000 figures ≠ Twenty Five Thousand ✗)")
    print("  bank_fabricated.pdf  → SUSPICIOUS (IFSC not in RBI registry ✗)")

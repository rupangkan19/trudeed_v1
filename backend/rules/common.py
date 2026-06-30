"""
Universal format validators: PAN, Aadhaar (Verhoeff), GSTIN, IFSC, dates.
All run from local data — no internet.
"""
import re
import csv
from pathlib import Path
from datetime import datetime
from typing import Optional

# ── Verhoeff tables ───────────────────────────────────────────────────────────
_D = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0],
]
_P = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8],
]
_INV = [0,4,3,2,1,5,6,7,8,9]


def verhoeff_validate(number: str) -> bool:
    digits = [int(d) for d in number if d.isdigit()]
    c = 0
    for i, digit in enumerate(reversed(digits)):
        c = _D[c][_P[i % 8][digit]]
    return c == 0


def verhoeff_generate_check(number: str) -> str:
    """Append check digit to make an 11-digit number a valid 12-digit Aadhaar."""
    digits = [int(d) for d in number if d.isdigit()]
    c = 0
    for i, digit in enumerate(reversed(digits)):
        c = _D[c][_P[(i + 1) % 8][digit]]
    return number + str(_INV[c])


# ── IFSC offline lookup ───────────────────────────────────────────────────────
_IFSC_SET: set[str] = set()
_IFSC_LOADED = False

def _load_ifsc() -> None:
    global _IFSC_LOADED
    if _IFSC_LOADED:
        return
    path = Path(__file__).parent.parent / "data" / "ifsc_codes.csv"
    if path.exists():
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                code = row.get("IFSC", "").strip().upper()
                if code:
                    _IFSC_SET.add(code)
    _IFSC_LOADED = True


def validate_ifsc(code: str) -> bool:
    _load_ifsc()
    code = re.sub(r"\s+", "", code).upper()
    if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", code):
        return False
    return code in _IFSC_SET if _IFSC_SET else True  # if DB empty, format check only


# ── Format validators ─────────────────────────────────────────────────────────
def validate_pan(pan: str) -> bool:
    return bool(re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", pan.upper().strip()))


def validate_aadhaar(uid: str) -> bool:
    digits = re.sub(r"[\s\-]", "", uid)
    if not re.match(r"^\d{12}$", digits):
        return False
    return verhoeff_validate(digits)


def validate_gstin(gstin: str) -> tuple[bool, Optional[str]]:
    """Returns (valid, embedded_pan). valid=False if format wrong."""
    g = gstin.upper().strip()
    if not re.match(r"^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$", g):
        return False, None
    embedded_pan = g[2:12]
    return True, embedded_pan


# ── Date helpers ──────────────────────────────────────────────────────────────
_DATE_PATTERNS = [
    r"\b(\d{2})[/\-](\d{2})[/\-](\d{4})\b",   # DD/MM/YYYY
    r"\b(\d{4})[/\-](\d{2})[/\-](\d{2})\b",   # YYYY/MM/DD
]

def extract_dates(text: str) -> list[datetime]:
    dates = []
    for pat in _DATE_PATTERNS:
        for m in re.finditer(pat, text):
            try:
                parts = [int(x) for x in m.groups()]
                if parts[0] > 31:             # YYYY-MM-DD
                    d = datetime(parts[0], parts[1], parts[2])
                else:                          # DD/MM/YYYY
                    d = datetime(parts[2], parts[1], parts[0])
                dates.append(d)
            except ValueError:
                pass
    return dates


def validate_financial_year(fy: str) -> bool:
    """Accept formats like 2024-25, 2024-2025, AY 2024-25."""
    m = re.search(r"(20\d{2})[-–](20)?(\d{2})", fy)
    if not m:
        return False
    start_year = int(m.group(1))
    end_suffix = int(m.group(3))
    expected_end = (start_year + 1) % 100
    return end_suffix == expected_end


# ── Amount helpers ────────────────────────────────────────────────────────────
def parse_amount(text: str) -> Optional[float]:
    cleaned = re.sub(r"[₹Rs.,\s]", "", text)
    try:
        return float(cleaned)
    except ValueError:
        return None


def amounts_match(a: float, b: float, tolerance_pct: float = 1.0) -> bool:
    ref = max(abs(a), abs(b), 1.0)
    return abs(a - b) / ref * 100 <= tolerance_pct


# ── Amount-in-words parser (Indian English) ───────────────────────────────────
_ONES = {
    "zero":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,
    "eight":8,"nine":9,"ten":10,"eleven":11,"twelve":12,"thirteen":13,
    "fourteen":14,"fifteen":15,"sixteen":16,"seventeen":17,"eighteen":18,
    "nineteen":19,
}
_TENS = {
    "twenty":20,"thirty":30,"forty":40,"fifty":50,
    "sixty":60,"seventy":70,"eighty":80,"ninety":90,
}
_SCALES = {"hundred":100,"thousand":1000,"lakh":100000,"crore":10000000}


def words_to_amount(phrase: str) -> Optional[int]:
    phrase = phrase.lower()
    phrase = re.sub(r"\b(?:rupees?|only|and)\b|-", " ", phrase)
    tokens = phrase.split()
    current, result = 0, 0
    for token in tokens:
        if token in _ONES:
            current += _ONES[token]
        elif token in _TENS:
            current += _TENS[token]
        elif token == "hundred":
            current = max(current, 1) * 100
        elif token in ("thousand", "lakh", "crore"):
            current = max(current, 1)
            result += current * _SCALES[token]
            current = 0
    result += current
    return result if result > 0 else None

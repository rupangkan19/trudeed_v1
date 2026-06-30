# TruDeed — Setup & Deployment Guide

## Quick Start (recommended)

### macOS / Linux

```bash
# 1. Unzip the file
unzip TruDeed.zip
cd TruDeed

# 2. Make the start script executable
chmod +x start.sh

# 3. Run it
./start.sh
```

### Windows

```
1. Unzip TruDeed.zip
2. Double-click start.bat
   (or right-click → "Run as Administrator" if you hit permission errors)
```

Then open **http://localhost:8000** in your browser.

That's it. The script installs all dependencies automatically on first run (~60 seconds). After that it starts in under 5 seconds.

---

## What the Start Script Does

1. Creates a Python virtual environment in `backend/venv/`
2. Installs all Python packages from `backend/requirements.txt`
3. Generates demo test documents in `backend/demo_docs/` (first run only)
4. Starts the FastAPI server on port 8000
5. The server serves both the API and the React frontend from a single port

---

## Prerequisites

You only need **Python 3.10 or later**. Nothing else.

Check your Python version:
```bash
python3 --version   # macOS/Linux
python --version    # Windows
```

If you don't have Python 3.10+:
- macOS: `brew install python@3.12`
- Windows: Download from https://python.org/downloads (check "Add to PATH" during install)
- Linux (Ubuntu): `sudo apt install python3.12 python3.12-venv`

### Additional system dependencies (for OCR on scanned documents)

If you want to process photographed or scanned documents (not just PDFs), also install:

**macOS:**
```bash
brew install tesseract poppler
```

**Ubuntu/Debian:**
```bash
sudo apt install tesseract-ocr poppler-utils
```

**Windows:**
- Tesseract: https://github.com/UB-Mannheim/tesseract/wiki (install to `C:\Program Files\Tesseract-OCR`)
- Poppler: https://github.com/oschwartz10612/poppler-windows (add `bin/` to PATH)

OCR is optional — clear PDFs work perfectly without it.

---

## Accessing from Another Device on the Same Network

By default the server binds to `0.0.0.0`, so anyone on your local network can access it.

Find your machine's IP address:
```bash
# macOS/Linux
ipconfig getifaddr en0   # or: ifconfig | grep "inet "

# Windows
ipconfig
```

Then on the other device open: `http://<your-IP>:8000`

Example: `http://192.168.1.42:8000`

---

## Manual Setup (if start.sh doesn't work)

```bash
# From the TruDeed folder:

# Create and activate virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate        # macOS/Linux
# backend\venv\Scripts\activate.bat     # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Generate demo documents (optional)
python backend/demo_generator.py

# Start the server
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000` in your browser.

---

## Ports

| Service | Port | Notes |
|---|---|---|
| Everything (API + UI) | 8000 | Single port — open this in browser |

No other ports needed.

---

## Demo Test Documents

After setup, you'll find ready-made test PDFs in `backend/demo_docs/`:

| File | Use as Applicant ID | Doc Type | Expected Result |
|---|---|---|---|
| `salary_genuine.pdf` | APP001 | SALARY_SLIP | ✅ GENUINE |
| `salary_tampered.pdf` | APP001 | SALARY_SLIP | 🔴 FORGED |
| `bank_genuine.pdf` | APP002 | BANK_STATEMENT | ✅ GENUINE |
| `bank_tampered.pdf` | APP002 | BANK_STATEMENT | 🔴 FORGED |
| `bank_fabricated.pdf` | APP003 | BANK_STATEMENT | 🔴 FORGED |
| `itr_genuine.pdf` | APP004 | ITR | ✅ GENUINE |
| `itr_tampered.pdf` | APP004 | ITR | 🟡 SUSPICIOUS |
| `cheque_genuine.pdf` | APP005 | CHEQUE | ✅ GENUINE |
| `cheque_tampered.pdf` | APP005 | CHEQUE | 🔴 FORGED |
| `aadhaar_genuine.pdf` | APP006 | AADHAAR | ✅ GENUINE |
| `aadhaar_tampered.pdf` | APP006 | AADHAAR | 🟡 SUSPICIOUS |
| `form16.pdf` | APP007 | FORM16 | ✅ GENUINE |

**Testing reference document comparison:**
1. Go to Admin Portal → Reference Library
2. Upload `salary_genuine.pdf` as doc type SALARY_SLIP
3. Then go to Officer Portal → Verify Document
4. Upload `salary_tampered.pdf` with applicant ID APP001
5. The system will detect it matches the reference but has altered numbers → FORGED

---

## Troubleshooting

**Port 8000 already in use:**
```bash
# macOS/Linux — kill whatever is on port 8000
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**`ModuleNotFoundError` on startup:**
Delete the venv and re-run the start script:
```bash
rm -rf backend/venv
./start.sh
```

**Tesseract not found (OCR warning in logs):**
This only affects scanned/photographed documents. PDFs with text still work. Install Tesseract to enable full OCR support.

**Slow first verification:**
The IFSC database (182,295 entries) loads into memory on first use. This takes ~0.5 seconds once, then it's cached.

**Database resets:**
`backend/trudeed.db` is the SQLite database. Deleting it resets all history. The app creates a fresh one on next startup.

---

## File Structure After Unzip

```
TruDeed/
├── start.sh            ← Run this (macOS/Linux)
├── start.bat           ← Run this (Windows)
├── SETUP.md            ← This file
├── README.md           ← Full technical documentation
├── DESIGN.md           ← Mobile app design spec for developers
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── data/
│   │   └── ifsc_codes.csv    (34 MB — 182,295 RBI IFSC codes)
│   └── demo_docs/            (generated by start script)
└── frontend/
    └── dist/                 (pre-built React app — no Node.js needed)
```

---

*TruDeed v2.0 — For questions, refer to README.md or the team that built this.*

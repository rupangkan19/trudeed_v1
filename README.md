# TruDeed — Real-Time Document Forgery Detection

TruDeed is an offline-first, bank-grade document fraud detection system. A bank officer uploads a document (salary slip, bank statement, ITR, cheque, Aadhaar, Form 16); the system runs three independent forensic pipelines and returns a verdict with a risk score and an annotated image showing exactly where anomalies were found.

**100% offline. No external API calls. No document leaves the local machine.**

---

## What It Does

| Capability | Detail |
|---|---|
| Document types | Salary Slip, Bank Statement, ITR, Form 16, Cheque, Aadhaar |
| Intake modes | PDF text extraction → pdfplumber fallback → OCR (pytesseract) |
| Visual forensics | Perceptual hash (pHash), Error Level Analysis (ELA), JPEG artifact detection |
| Content rules | Math consistency, IFSC validation (182,295 RBI codes offline), PAN format, Aadhaar Verhoeff checksum, date sanity |
| Cross-document | Income/name consistency across multiple docs for the same applicant |
| Reference matching | Admin uploads originals; system auto-detects visual matches and flags altered numbers |
| Forgery highlighting | Red/amber rectangles drawn directly on the document image at flagged regions |
| Verdict | GENUINE · REVIEW · SUSPICIOUS · FORGED with 0–100 risk score |

---

## System Architecture

```
┌─────────────────────────────────┐     HTTP/REST      ┌──────────────────────────┐
│        React Frontend           │ ◄────────────────► │     FastAPI Backend       │
│  (Vite · TypeScript · lucide)   │                    │  (Python · SQLite · OCR)  │
│                                 │                    │                           │
│  Admin Portal   Officer Portal  │                    │  /verify                  │
│  ─────────────  ──────────────  │                    │  /history                 │
│  Ref Library    Verify Doc      │                    │  /applicant/{id}          │
│  Verif Center   My Submissions  │                    │  /admin/reference (CRUD)  │
│  Analytics      Applicant Lookup│                    │  /tools/ifsc · pan · uid  │
│  Case Mgmt      Quick Tools     │                    │                           │
│  IFSC Registry  Document Guide  │                    │  SQLite: trudeed.db      │
│  Audit Log      Stats           │                    │  182K IFSC codes (CSV)    │
└─────────────────────────────────┘                    └──────────────────────────┘
```

### Backend Pipeline (per document upload)

```
File upload
    │
    ▼
 intake.py ──► classifier.py          Detects doc type from text patterns
    │
    ├──► ocr_engine.py                PDF text / pdfplumber / pytesseract
    │
    ├──► forensics/physical.py        pHash · ELA · JPEG artifact score
    │
    ├──► rules/{doc_type}.py          Math checks, IFSC, PAN, Aadhaar, dates
    │
    ├──► cross_doc.py                 Name/income consistency across applicant history
    │
    ├──► history.py                   Duplicate detection + reference doc comparison
    │
    ├──► scoring.py                   RED +35 · AMBER +10 · GREEN -5 → 0-100 score
    │
    └──► forensics/highlight.py       Annotated JPEG with red/amber bounding boxes
```

### Scoring Formula

| Severity | Points |
|---|---|
| RED flag | +35 |
| AMBER flag | +10 |
| GREEN (passed check) | −5 |

| Score range | Verdict |
|---|---|
| 0–20 | GENUINE |
| 21–45 | REVIEW |
| 46–70 | SUSPICIOUS |
| 71–100 | FORGED |

---

## Project Structure

```
TruDeed/
├── backend/
│   ├── main.py                 FastAPI app, all endpoints
│   ├── database.py             SQLite init, queries, reference store
│   ├── intake.py               File ingestion, OCR orchestration
│   ├── classifier.py           Document type detection
│   ├── ocr_engine.py           PDF/image text extraction
│   ├── preprocessing.py        Image normalisation
│   ├── cross_doc.py            Cross-document consistency checks
│   ├── history.py              Duplicate + reference comparison
│   ├── scoring.py              Flag aggregation → verdict
│   ├── demo_generator.py       Generates test PDFs (genuine + tampered)
│   ├── forensics/
│   │   ├── physical.py         pHash, ELA, JPEG forensics
│   │   └── highlight.py        Annotated image generation
│   ├── rules/
│   │   ├── common.py           Shared: IFSC lookup, Verhoeff, amount parsing
│   │   ├── salary.py           Salary slip math checks
│   │   ├── bank_statement.py   Bank statement balance checks
│   │   ├── itr_form16.py       ITR/Form 16 income consistency
│   │   ├── cheque.py           Cheque amount words-vs-figures
│   │   └── aadhaar.py          Aadhaar UID format + checksum
│   └── data/
│       └── ifsc_codes.csv      182,295-row RBI IFSC database (34 MB)
│
└── frontend/
    ├── src/
    │   ├── App.tsx             Login / portal selector
    │   ├── AdminApp.tsx        Admin shell + routing
    │   ├── OfficerApp.tsx      Officer shell + routing
    │   ├── ThemeContext.tsx    Light/dark theme provider + tokens
    │   ├── theme.ts            Re-exports from ThemeContext
    │   ├── api.ts              All fetch calls to backend
    │   ├── types.ts            Shared TypeScript types
    │   ├── components/
    │   │   ├── Sidebar.tsx     Collapsible sidebar (240px / 58px)
    │   │   └── layout/
    │   │       └── PageShell.tsx  Top bar + layout wrapper
    │   └── pages/
    │       ├── admin/          8 admin pages
    │       └── officer/        8 officer pages
    └── public/
```

---

## Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- Tesseract OCR installed (`brew install tesseract` on macOS)
- Poppler (`brew install poppler` on macOS, needed by pdfplumber)

### Backend

```bash
cd backend
pip install -r requirements.txt

# Generate demo test documents (optional)
python demo_generator.py

# Start the server
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Auto-creates `trudeed.db` on first start.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Proxies API calls to `localhost:8000`.

---

## API Reference

### Document Verification

#### `POST /verify`
Submit a document for forensic analysis.

**Form data:**
| Field | Type | Description |
|---|---|---|
| `file` | File | PDF, JPG, PNG, or WebP |
| `applicant_id` | string | Unique applicant identifier (e.g. `APP001`) |
| `doc_type` | string | One of: `SALARY_SLIP`, `BANK_STATEMENT`, `ITR`, `FORM16`, `CHEQUE`, `AADHAAR` |

**Response:**
```json
{
  "verdict": "FORGED",
  "score": 82,
  "confidence": 0.91,
  "intake_mode": "PDF_TEXT",
  "reasons": ["Math mismatch: gross ≠ deductions + net", "Invalid IFSC: HDFC0099999"],
  "flags": [
    {
      "code": "MATH_MISMATCH",
      "severity": "RED",
      "category": "CONTENT",
      "detail": "gross_salary (85000) ≠ deductions (5000) + net_salary (90000)"
    }
  ],
  "fields": {
    "gross_salary": 85000,
    "net_salary": 90000,
    "pan": "ABCDE1234F"
  },
  "heatmap_b64": "<base64 JPEG with red/amber boxes>",
  "fingerprint": "<sha256 content hash>"
}
```

#### `GET /history`
Returns all past verification submissions.

#### `GET /applicant/{applicant_id}`
Returns all documents submitted for a specific applicant.

---

### Admin — Reference Library

#### `POST /admin/reference`
Upload an original document as a reference baseline.

**Form data:** `file`, `doc_type`, `ref_id`, `label`, `uploaded_by`

#### `GET /admin/references`
List all stored reference documents.

#### `DELETE /admin/reference/{ref_id}`
Remove a reference document.

---

### Utility Tools

#### `GET /tools/ifsc/{code}`
Validate an IFSC code against the 182,295-entry RBI database.

```json
{
  "valid": true,
  "ifsc": "HDFC0001234",
  "bank": "HDFC Bank",
  "branch": "Koramangala",
  "city": "Bengaluru",
  "state": "Karnataka",
  "address": "No. 12, 80 Feet Road, Koramangala..."
}
```

#### `GET /tools/aadhaar/{uid}`
Validate an Aadhaar UID using the Verhoeff checksum algorithm.

#### `GET /tools/pan/{pan}`
Validate PAN format and identify holder type (Individual / Company / HUF / etc.).

---

## Document Rules Summary

### Salary Slip
- Gross Salary = Basic + HRA + Allowances
- Net Salary = Gross − Total Deductions
- PAN format validation
- IFSC format + registry check

### Bank Statement
- Opening Balance + Credits − Debits = Closing Balance
- IFSC validation on all transactions
- Date sequence sanity

### ITR / Form 16
- Declared income cross-checked with salary documents for same applicant
- PAN must match across documents

### Cheque
- Amount in words must match amount in figures (parsed via Indian number system)
- IFSC/MICR code validation
- Date not in the past beyond 3 months

### Aadhaar
- 12-digit Verhoeff checksum
- Format: XXXX XXXX XXXX

---

## Demo Test Documents

Run `python backend/demo_generator.py` to generate test PDFs in `backend/demo_docs/`:

| File | Applicant | Doc Type | Expected Verdict |
|---|---|---|---|
| `salary_genuine.pdf` | APP001 | SALARY_SLIP | GENUINE |
| `salary_tampered.pdf` | APP001 | SALARY_SLIP | FORGED |
| `bank_genuine.pdf` | APP002 | BANK_STATEMENT | GENUINE |
| `bank_tampered.pdf` | APP002 | BANK_STATEMENT | FORGED |
| `bank_fabricated.pdf` | APP003 | BANK_STATEMENT | FORGED |
| `itr_genuine.pdf` | APP004 | ITR | GENUINE |
| `itr_tampered.pdf` | APP004 | ITR | SUSPICIOUS |
| `cheque_genuine.pdf` | APP005 | CHEQUE | GENUINE |
| `cheque_tampered.pdf` | APP005 | CHEQUE | FORGED |
| `aadhaar_genuine.pdf` | APP006 | AADHAAR | GENUINE |
| `aadhaar_tampered.pdf` | APP006 | AADHAAR | SUSPICIOUS |
| `form16.pdf` | APP007 | FORM16 | GENUINE |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI 0.111 |
| Database | SQLite (via Python stdlib) |
| PDF parsing | PyMuPDF, pdfplumber, pikepdf |
| OCR | pytesseract + Tesseract 5 |
| Image processing | OpenCV, Pillow, scikit-image |
| Visual hashing | imagehash (pHash) |
| Statistical analysis | NumPy, SciPy |
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Icons | lucide-react |
| Styling | Inline React styles + ThemeContext |

---

## Security & Privacy

- **No network egress.** All processing is local. Documents are never sent to any external service.
- **SQLite only.** No external database. `trudeed.db` lives on the local machine.
- **No authentication** in the current version — intended for internal bank deployment behind a firewall.
- The IFSC database (34 MB CSV) is bundled locally. Zero internet needed for IFSC validation.

---

## Known Limitations

- OCR accuracy depends on Tesseract and document scan quality. Low-resolution photos may reduce extraction accuracy.
- pHash matching works best when the document structure is similar (same template). Highly different layouts will not match.
- Reference comparison requires at least one reference document to be uploaded by an admin first.
- Currently single-user — no role-based access control or audit trail per user session.

---

*TruDeed v2.0 — Built for internal bank fraud detection. All processing offline.*

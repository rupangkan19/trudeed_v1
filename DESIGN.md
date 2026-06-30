# TruDeed — Mobile App Design Specification

This document is for the designer and developer building the **iOS/Android mobile app** version of TruDeed. It covers the design system, navigation structure, screen inventory, component patterns, and backend API contract.

The web app at `frontend/src/` is the reference implementation. When in doubt, match its behaviour.

---

## 1. What the App Does

TruDeed detects forged bank documents. Two types of users:

**Admin** — uploads original reference documents to a library. Reviews flagged cases. Manages the system.

**Officer (Bank Officer)** — photographs or uploads documents submitted by loan applicants. The app analyses the document and returns a verdict: GENUINE / REVIEW / SUSPICIOUS / FORGED, with a risk score and an annotated image showing exactly where problems were found.

---

## 2. Design Principles

1. **Trust through clarity.** Verdicts must be impossible to misread. Use large, high-contrast verdict chips with unambiguous labels.
2. **Dark-first.** The app defaults to dark mode. Provide a toggle. Officers often work in low-light branch environments.
3. **Offline-capable UI.** All forensic processing happens on the backend (local server). The app only needs to be on the same local network. Show clear offline/server-unreachable states.
4. **Zero ambiguity on RED.** When a document is flagged FORGED or SUSPICIOUS, the annotated image must be the first thing the officer sees — not buried below a fold.
5. **Dense but not cluttered.** The web sidebar has many options. On mobile, use a bottom tab bar (5 tabs max) + a drawer for secondary nav. Do not flatten everything into one scroll.

---

## 3. Color System

Use these exact values. They match the web app so that officers can switch between web and mobile without visual confusion.

### Dark Theme (default)

| Token | Hex | Usage |
|---|---|---|
| `content-bg` | `#0f172a` | Screen background |
| `card-bg` | `#1e293b` | Cards, sheets, panels |
| `card-hover` | `#263347` | Pressed/selected card state |
| `sidebar-bg` | `#0c1120` | Drawer background |
| `text-primary` | `#f1f5f9` | Headings, body text |
| `text-secondary` | `#94a3b8` | Labels, timestamps, hints |
| `border` | `#334155` | Dividers, input borders, card borders |
| `input-bg` | `#0f172a` | Text inputs, search bars |
| `blue` | `#3b82f6` | Primary CTA, links, active states |
| `red` | `#ef4444` | Errors, FORGED verdict accent |
| `green` | `#22c55e` | GENUINE verdict accent, success |
| `amber` | `#f59e0b` | REVIEW verdict accent, warnings |
| `purple` | `#8b5cf6` | Admin accent colour |

### Light Theme

| Token | Hex |
|---|---|
| `content-bg` | `#f0f2f5` |
| `card-bg` | `#ffffff` |
| `card-hover` | `#f8fafc` |
| `sidebar-bg` | `#1c2333` |
| `text-primary` | `#111827` |
| `text-secondary` | `#6b7280` |
| `border` | `#e5e7eb` |
| `input-bg` | `#ffffff` |
| `blue` | `#2563eb` |
| `red` | `#dc2626` |
| `green` | `#16a34a` |
| `amber` | `#d97706` |
| `purple` | `#7c3aed` |

### Verdict / Status Banner Colours

Each verdict or status area needs background + border + text colour. Do not use solid fills — use these semi-transparent values for dark mode, and soft pastels for light mode.

| Verdict | Dark BG | Dark Border | Dark Text | Light BG | Light Text |
|---|---|---|---|---|---|
| GENUINE / Success | `rgba(34,197,94,0.10)` | `rgba(34,197,94,0.28)` | `#86efac` | `#f0fdf4` | `#16a34a` |
| FORGED / Error | `rgba(239,68,68,0.10)` | `rgba(239,68,68,0.28)` | `#fca5a5` | `#fef2f2` | `#dc2626` |
| REVIEW / Warning | `rgba(245,158,11,0.10)` | `rgba(245,158,11,0.28)` | `#fcd34d` | `#fffbeb` | `#d97706` |
| SUSPICIOUS | `rgba(249,115,22,0.10)` | `rgba(249,115,22,0.28)` | `#fdba74` | `#fff7ed` | `#ea580c` |
| Info / Blue | `rgba(59,130,246,0.10)` | `rgba(59,130,246,0.28)` | `#93c5fd` | `#eff6ff` | `#1d4ed8` |

### Flag Severity Chips

Small pill chips that label each detection finding.

| Severity | Dark BG | Dark Border | Dark Text | Light BG | Light Text |
|---|---|---|---|---|---|
| RED (critical) | `rgba(239,68,68,0.15)` | `rgba(239,68,68,0.30)` | `#fca5a5` | `#fee2e2` | `#dc2626` |
| AMBER (warning) | `rgba(245,158,11,0.15)` | `rgba(245,158,11,0.30)` | `#fcd34d` | `#fef3c7` | `#d97706` |
| GREEN (passed) | `rgba(34,197,94,0.15)` | `rgba(34,197,94,0.30)` | `#86efac` | `#dcfce7` | `#16a34a` |

---

## 4. Typography

Font: **Inter** (system fallback: SF Pro on iOS, Roboto on Android)

| Style | Size | Weight | Usage |
|---|---|---|---|
| Screen title | 22–24sp | 700 | Page headings |
| Card title | 16sp | 600 | Card headings, section labels |
| Body | 14sp | 400 | Normal text, list items |
| Label / Caption | 12sp | 500–600 | Form labels, timestamps |
| Micro | 11sp | 500 | Chips, badges, monospace IDs |
| Verdict label | 20–22sp | 800 | GENUINE / FORGED verdict text |
| Score | 32–40sp | 800 | Risk score number |

Monospace font for: PAN numbers, IFSC codes, Aadhaar UIDs, reference IDs, fingerprint hashes.

---

## 5. Navigation Structure

### Login / Entry Screen

Single screen:
- App name + shield logo
- "100% Offline" badge
- Name input field
- Two role cards: **Admin Portal** (purple accent) · **Bank Officer** (blue accent)
- Tapping a card with a name entered navigates to that portal

### Officer Portal — Bottom Tab Bar (5 tabs)

| Tab | Icon | Screen |
|---|---|---|
| Home | House | Officer Dashboard |
| Verify | ScanLine / Upload | Verify Document (primary CTA) |
| History | Clock | My Submissions |
| Tools | Wrench | Quick Tools |
| Profile | User | My Profile |

Secondary screens accessed from Home or drawer:
- Applicant Lookup
- Case Tracker
- Document Guide
- My Statistics

### Admin Portal — Bottom Tab Bar (4 tabs) + Drawer

| Tab | Icon | Screen |
|---|---|---|
| Dashboard | LayoutDashboard | Admin Dashboard |
| Library | FolderOpen | Reference Library |
| Cases | Shield | Verification Center |
| More | Menu | Opens slide-over drawer |

Drawer items:
- Analytics & Reports
- Applicant Management
- IFSC Registry
- Audit Log
- Settings
- My Profile

---

## 6. Screen Inventory

### Shared Screens

#### Login Screen
- Dark `#0f172a` background with subtle grid overlay
- Centered logo: 72×72 rounded square with shield icon, dark blue `#1e3a8a`, glow effect
- Name text field (centered, full width)
- Two portal cards side by side (or stacked on small screens)
- Error state: red border on name field + red helper text if no name entered

---

### Officer Screens

#### 6.1 Officer Dashboard

Stats row (4 chips):
- Verified Today · Flagged Today · Passed · Pending

Greeting: "Good morning, {name}" with current date

Big "Verify a Document" CTA button — full width, blue, prominent

Recent verdicts list (last 5 submissions):
- Each row: doc type · applicant ID · verdict chip · score · time ago

Quick tips section: 3 cards (Today's Flag Count, Avg Risk Score, Most Common Doc Type)

---

#### 6.2 Verify Document Screen ⭐ (most important screen)

**Upload area:**
- Large dashed rectangle, camera icon, "Tap to photograph or upload"
- On mobile: offer Camera / Photo Library / Files as a bottom sheet
- Show file name and size once selected
- Clear/change button

**Form fields:**
- Applicant ID (text input)
- Document Type (picker/dropdown): Salary Slip · Bank Statement · ITR · Form 16 · Cheque · Aadhaar

**Analyse button:** Full width, blue, disabled until file + applicant ID + type all filled

**Loading state:** Progress indicator with text "Analysing document…" (typical 2–5 seconds)

**Result (appears below or on new screen):**

1. **Verdict banner** — full width, takes up ~35% of screen
   - Large icon (shield check / x-circle / alert)
   - Verdict label (GENUINE / REVIEW REQUIRED / SUSPICIOUS / LIKELY FORGED)
   - Score: `82 / 100` in large numerals
   - Confidence percentage
   - 3 chips: N Critical · N Warning · N Passed

2. **Annotated document image** — shown immediately after verdict
   - Full width, contained aspect ratio
   - Red rectangles = critical forgery regions
   - Amber rectangles = anomaly / warning regions
   - Legend: small coloured squares with labels below the image
   - Pinch-to-zoom should work

3. **Detection findings** — collapsible list
   - Each finding: severity chip (RED/AMBER/GREEN) + code label + detail text
   - Sort: RED first, then AMBER, then GREEN

4. **Extracted fields** — grid of key-value chips
   - Gross Salary, Net Salary, PAN, IFSC, etc.
   - PAN and IFSC shown in monospace

---

#### 6.3 My Submissions

Filter tabs: Today · This Week · All History

List of submissions:
- Each row: doc type badge · applicant ID · verdict chip · risk score bar · date
- Tap row → opens read-only result view (verdict + annotated image + flags)

Empty state: icon + "No submissions yet. Go verify your first document."

---

#### 6.4 Applicant Lookup

Search input: "Search by Applicant ID"

Result shows all documents for that applicant:
- Each doc as a card: type · verdict · score · date
- Cross-document consistency banner: green "Income consistent" or red "Income mismatch detected"

---

#### 6.5 Quick Tools

Four tool cards, each expandable:

**IFSC Validator**
- Text input for 11-character IFSC code
- Result: Bank name · Branch · City · State · Address (green for valid, red for invalid)

**PAN Validator**
- Text input for 10-character PAN
- Result: Valid format + holder type (Individual / Company / HUF / etc.)

**Aadhaar Checksum**
- Text input for 12-digit Aadhaar
- Result: Valid / Invalid (Verhoeff algorithm)

**Amount → Words**
- Numeric input
- Result: Indian system words (e.g. "₹1,25,000 → One Lakh Twenty Five Thousand Rupees Only")

---

#### 6.6 Document Guide

Six accordion cards, one per document type:

- **Salary Slip** — what to check: math consistency, IFSC, PAN, employer name
- **Bank Statement** — opening + credits − debits = closing, IFSC per transaction
- **ITR** — income matching salary docs, PAN consistency
- **Form 16** — TDS amounts, employer PAN, assessment year
- **Cheque** — amount words vs figures, MICR, date validity
- **Aadhaar** — Verhoeff checksum, 12 digits, no letters

---

#### 6.7 My Statistics

3 stat cards: Total Verified · Fraud Rate (%) · Avg Risk Score

Bar chart: Documents by type (horizontal bars, coloured by doc type)

Verdict distribution: 4 cards in 2×2 grid (GENUINE / REVIEW / SUSPICIOUS / FORGED) with count and percentage

---

#### 6.8 Officer Profile

Avatar circle (initials, blue background)
Name + "Bank Officer" label
"Verification Officer" badge

Stats: Total Submitted · Genuine Passed · Fraud Caught

Recent submissions table (last 10, sortable by date)

---

### Admin Screens

#### 6.9 Admin Dashboard

Welcome banner with admin name

Stats row: Total References · Flagged Cases · Cleared Cases · Pending Review

Verdict breakdown: horizontal stacked bar showing GENUINE/REVIEW/SUSPICIOUS/FORGED proportions

Recent submissions table with verdict badges

---

#### 6.10 Reference Library

Upload form:
- File picker (PDF, JPG, PNG)
- Label / description field ("Who is this document for?")
- Document type picker
- Reference ID (auto-generated from label + timestamp — show it as read-only after generation)

Info banner: "How matching works — the system uses visual fingerprinting (pHash). No manual linking needed."

Reference cards grid (2 columns on tablet, 1 column on phone):
- Document type badge (coloured by type)
- Label text
- Date added · uploaded by
- Extracted fields chips (Gross Salary, Net Salary, PAN, etc.)
- Delete button

Filter by document type (chip row at top)

---

#### 6.11 Verification Center

Filter tabs: All · Pending · Flagged · Cleared

Table/list of all verified submissions:
- Applicant ID · Doc Type · Verdict badge · Score bar · Date

Tap → opens detail view with full result (same as officer result view)

---

#### 6.12 Analytics

Detection summary:
- Bar chart by document type (stacked: GENUINE / REVIEW / SUSPICIOUS / FORGED)
- Score histogram (distribution 0–100)

Fraud trend (if enough data): line chart over time

Export button → downloads CSV of all submissions

---

#### 6.13 Applicant Management

List with filter tabs: All · High Risk · Watchlist

Each applicant row:
- Applicant ID · document count · highest risk verdict
- Tap → shows all their documents + cross-doc consistency result

---

#### 6.14 IFSC Registry

Search bar for IFSC code
Result card: bank · branch · city · state · address · valid/invalid badge

Reference table of major Indian bank prefixes (HDFC, ICIC, SBIN, etc.)

---

#### 6.15 Audit Log

Chronological list of all system events:
- Document verifications (with verdict)
- Reference uploads / deletions
- Filter: Last 24h · Last 7d · All

Each entry: timestamp · event type chip · detail text

---

#### 6.16 Admin Profile

Same structure as Officer Profile but with admin stats:
- References uploaded · Cases reviewed · Flagged today

---

## 7. Key Components

### Verdict Banner

```
┌─────────────────────────────────────────────────┐
│  [Icon]  LIKELY FORGED                           │
│          Score: 82/100  ·  Confidence: 91%       │
│          Mode: PDF Text                          │
│                                                  │
│  [● 2 Critical]  [● 1 Warning]  [● 3 Passed]    │
│                                                  │
│  • Math mismatch: gross ≠ deductions + net       │
│  • Invalid IFSC: HDFC0099999                     │
└─────────────────────────────────────────────────┘
```

Background uses the verdict colour tokens (semi-transparent dark or pastel light).

### Flag Row

```
┌ RED ──────────────────────────────────────────┐
│  [MATH_MISMATCH]  [CONTENT]                   │
│  gross_salary (85000) ≠ net + deductions      │
└───────────────────────────────────────────────┘
```

Left border coloured by severity (4px). Background `CHIP_*_BG`. Code in monospace pill.

### Score Bar

```
Risk Score
████████████████░░░░  82 / 100
```

Filled: coloured (green 0–20, amber 21–45, orange 46–70, red 71–100)
Track: `SCORE_TRACK` colour (dark: `rgba(255,255,255,0.08)`, light: `#e5e7eb`)

### Doc Type Badge

Small rounded rectangle, one per document type, consistent colour coding:

| Doc Type | Colour |
|---|---|
| Salary Slip | Blue |
| Bank Statement | Green |
| ITR | Purple |
| Form 16 | Indigo |
| Cheque | Amber |
| Aadhaar | Orange |

---

## 8. Interactions & States

| State | Behaviour |
|---|---|
| Loading (verify) | Full-screen spinner or skeleton + "Analysing…" label |
| Empty list | Centered icon + message + optional CTA |
| Network error | Toast / inline error card with retry button |
| Upload success | Green banner + auto-dismiss after 3s |
| Upload error | Red inline error, stays visible until dismissed |
| Long press on submission row | Context menu: View · Share · Delete |
| Pinch-to-zoom on annotated image | Standard iOS/Android gesture |
| Pull to refresh | Standard on all list screens |

---

## 9. Backend API

The app talks to a local FastAPI server (same network). Base URL is configurable (default: `http://localhost:8000`). No authentication headers needed in the current version.

### All Endpoints

| Method | Path | Used by |
|---|---|---|
| POST | `/verify` | Officer: Verify Document |
| GET | `/history` | Officer: My Submissions; Admin: Verification Center |
| GET | `/applicant/{id}` | Officer: Applicant Lookup |
| POST | `/admin/reference` | Admin: Reference Library (upload) |
| GET | `/admin/references` | Admin: Reference Library (list) |
| DELETE | `/admin/reference/{ref_id}` | Admin: Reference Library (delete) |
| GET | `/tools/ifsc/{code}` | Quick Tools: IFSC Validator |
| GET | `/tools/aadhaar/{uid}` | Quick Tools: Aadhaar Validator |
| GET | `/tools/pan/{pan}` | Quick Tools: PAN Validator |
| GET | `/health` | App startup: check server reachable |

### `POST /verify` — multipart form

```
file:         (binary — PDF, JPG, PNG, WebP)
applicant_id: "APP001"
doc_type:     "SALARY_SLIP"
```

### `POST /admin/reference` — multipart form

```
file:         (binary)
doc_type:     "SALARY_SLIP"
ref_id:       "SAL-ravi_kumar_infosys-1zk4ab"
label:        "Ravi Kumar Infosys salary March 2024"
uploaded_by:  "admin"
```

### `/verify` Response

```json
{
  "verdict": "FORGED",
  "score": 82,
  "confidence": 0.91,
  "intake_mode": "PDF_TEXT",
  "reasons": ["Math mismatch: gross ≠ deductions + net"],
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
    "pan": "ABCDE1234F",
    "ifsc": "HDFC0099999"
  },
  "heatmap_b64": "<base64-encoded JPEG>",
  "fingerprint": "<sha256 hash>"
}
```

`heatmap_b64` is a standard base64 JPEG string. Decode and display as `<Image>` or equivalent. Red rectangles = critical regions. Amber = warnings.

### Submission record (from `/history`)

```json
{
  "id": 42,
  "applicant_id": "APP001",
  "doc_type": "SALARY_SLIP",
  "verdict": "FORGED",
  "score": 82,
  "intake_mode": "PDF_TEXT",
  "fields": { "gross_salary": 85000, "pan": "ABCDE1234F" },
  "flags": [ { "code": "MATH_MISMATCH", "severity": "RED", ... } ],
  "heatmap_b64": "<base64 JPEG>",
  "created_at": "2026-06-30T14:23:11"
}
```

---

## 10. Server Configuration Screen

Add a settings screen where the user can set the backend URL (default `http://localhost:8000`). Show a "Test Connection" button that hits `/health` and displays OK / unreachable.

This is critical for branch deployments where the server IP may differ.

---

## 11. Onboarding / First Launch

Show on first launch only:

1. **Welcome** — TruDeed logo, tagline "Real-time Document Forgery Detection", "100% Offline" badge
2. **How it works** — 3 steps: Upload → Analyse → Verdict (simple illustration or icon sequence)
3. **Configure server** — pre-filled with `http://localhost:8000`, test connection button
4. **Done** → Login screen

---

## 12. Accessibility

- All interactive elements: minimum 44×44pt touch target
- Verdict colours are never the only signal — always pair with text label and icon
- Support Dynamic Type (iOS) and font scaling (Android)
- Dark/light theme must be fully accessible — do not rely on colour contrast ratios below 4.5:1
- Annotated image: add alt text "Document with forgery annotations"

---

## 13. Platform Notes

### iOS
- Use native `UIDocumentPickerViewController` for file selection
- Camera access: `NSCameraUsageDescription` in Info.plist — "To photograph documents for forgery analysis"
- Photo library access for document upload

### Android
- Use `ActivityResultContracts.GetContent` for file picker
- Camera: `android.permission.CAMERA` + `android.hardware.camera` feature
- `FileProvider` for sharing the annotated image

### File size
- Accept PDF, JPG, PNG, WebP up to 20 MB
- Show file size and warn if > 10 MB (OCR will be slower)

---

## 14. Reference: Web App Pages → Mobile Screens

| Web page | Mobile screen |
|---|---|
| App.tsx (login) | Login Screen |
| OfficerDashboard | Officer Dashboard |
| VerifyPage | Verify Document |
| MySubmissions | My Submissions |
| ApplicantLookup | Applicant Lookup |
| QuickTools | Quick Tools |
| DocumentGuide | Document Guide |
| OfficerStats | My Statistics |
| OfficerProfile | Officer Profile |
| AdminDashboard | Admin Dashboard |
| ReferenceLibrary | Reference Library |
| VerificationCenter | Verification Center |
| Analytics | Analytics |
| ApplicantMgmt | Applicant Management |
| IFSCRegistry | IFSC Registry |
| AuditLog | Audit Log |
| AdminProfile | Admin Profile |

---

*TruDeed DESIGN.md — v2.0 — For mobile app design & development reference*

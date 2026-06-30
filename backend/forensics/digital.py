"""
Digital document forensics: ELA, clone detection, PDF metadata analysis.
Only runs on directly uploaded digital files (not photos of physical docs).
"""
import io
import hashlib
from typing import Optional

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "forensic"}

EDITING_SOFTWARE = [
    "adobe acrobat", "adobe illustrator", "photoshop", "canva", "gimp",
    "inkscape", "libreoffice draw", "foxit", "nitro", "pdf-xchange",
    "ilovepdf", "smallpdf", "sejda", "pdfescape", "microsoft word",
]
LEGITIMATE_GENERATORS = [
    "income tax department", "traces", "gstn", "reportlab", "oracle",
    "sap", "finacle", "temenos", "tally", "computax",
]


def analyze_pdf_metadata(pdf_bytes: bytes) -> list[dict]:
    flags: list[dict] = []
    try:
        import pikepdf
        pdf = pikepdf.open(io.BytesIO(pdf_bytes))
        meta = pdf.docinfo

        producer = str(meta.get("/Producer", "")).lower()
        creator = str(meta.get("/Creator", "")).lower()
        creation_date = str(meta.get("/CreationDate", "")).strip()
        mod_date = str(meta.get("/ModDate", "")).strip()

        for sw in EDITING_SOFTWARE:
            if sw in producer or sw in creator:
                flags.append(_FLAG(
                    "EDITING_SOFTWARE_DETECTED", "RED",
                    f"PDF metadata shows editing tool '{sw.title()}' in Producer/Creator field. "
                    f"Legitimate system-generated financial documents are not edited with this software."
                ))
                break

        if creator and not any(g in creator for g in LEGITIMATE_GENERATORS) and not any(e in creator for e in EDITING_SOFTWARE):
            pass  # Unknown generator — not conclusive, skip

        if creation_date and mod_date and creation_date != mod_date:
            flags.append(_FLAG(
                "MODIFICATION_DATE_MISMATCH", "RED",
                f"PDF was modified after creation. CreationDate: {creation_date[:16]} | "
                f"ModDate: {mod_date[:16]}. System-generated statements are never modified post-export."
            ))

        revisions = pdf_bytes.count(b"%%EOF")
        if revisions > 1:
            flags.append(_FLAG(
                "MULTIPLE_PDF_REVISIONS", "RED",
                f"PDF has {revisions} incremental saves (revisions). "
                f"A freshly generated financial document has exactly 1 revision. "
                f"Multiple revisions indicate post-creation editing."
            ))

        has_sig = _check_digital_signature(pdf)
        if has_sig:
            flags.append(_FLAG("DIGITAL_SIGNATURE_PRESENT", "GREEN",
                               "Document carries a digital signature field — positive authenticity signal."))

        pdf.close()
    except ImportError:
        pass
    except Exception as e:
        flags.append(_FLAG("PDF_PARSE_WARNING", "AMBER",
                           f"Could not fully parse PDF structure: {str(e)[:80]}"))
    return flags


def _check_digital_signature(pdf) -> bool:
    try:
        if "/AcroForm" in pdf.Root:
            acroform = pdf.Root.get("/AcroForm", {})
            for field_ref in acroform.get("/Fields", []):
                try:
                    field_obj = pdf.get_object(field_ref)
                    if field_obj.get("/FT") == "/Sig":
                        return True
                except Exception:
                    pass
    except Exception:
        pass
    return False


def run_ela(image_bytes: bytes, quality: int = 90) -> list[dict]:
    """Error Level Analysis on JPEG images."""
    flags: list[dict] = []
    try:
        from PIL import Image
        import numpy as np

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        buf.seek(0)
        recompressed = Image.open(buf).convert("RGB")

        orig = np.array(img, dtype=float)
        recomp = np.array(recompressed, dtype=float)
        ela = np.abs(orig - recomp)

        scale = 10.0
        ela_max = ela.max()
        if ela_max == 0:
            return flags

        ela_norm = ela / ela_max

        # Divide into grid, find high-anomaly regions
        h, w = ela_norm.shape[:2]
        grid_h, grid_w = h // 8, w // 8
        cell_means = []
        for i in range(8):
            for j in range(8):
                cell = ela_norm[i*grid_h:(i+1)*grid_h, j*grid_w:(j+1)*grid_w]
                cell_means.append(float(cell.mean()))

        overall_mean = sum(cell_means) / len(cell_means)
        outlier_cells = [m for m in cell_means if m > overall_mean * 3.0]

        if len(outlier_cells) >= 2:
            flags.append(_FLAG(
                "ELA_ANOMALY_DETECTED", "RED",
                f"Error Level Analysis found {len(outlier_cells)} regions with significantly higher "
                f"re-compression error than the rest of the image. These regions were likely edited "
                f"after the original image was saved — consistent with digital manipulation."
            ))
        elif ela_max < 3:
            flags.append(_FLAG("ELA_UNIFORM", "GREEN",
                               "ELA shows uniform error distribution — no signs of localised editing."))
    except Exception:
        pass
    return flags


def detect_copy_move(image_bytes: bytes) -> list[dict]:
    """Clone/copy-move detection using block hashing."""
    flags: list[dict] = []
    try:
        import cv2
        import numpy as np

        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return flags

        block_size = 32
        h, w = img.shape
        block_hashes: dict[str, list[tuple[int,int]]] = {}

        for y in range(0, h - block_size, block_size // 2):
            for x in range(0, w - block_size, block_size // 2):
                block = img[y:y+block_size, x:x+block_size]
                digest = hashlib.md5(block.tobytes()).hexdigest()
                block_hashes.setdefault(digest, []).append((y, x))

        duplicates = [(h, positions) for h, positions in block_hashes.items()
                      if len(positions) >= 3]
        if len(duplicates) >= 5:
            flags.append(_FLAG(
                "CLONE_REGION_DETECTED", "AMBER",
                f"Copy-move analysis found {len(duplicates)} repeated image blocks. "
                f"This may indicate a section of the document was duplicated or transplanted."
            ))
    except Exception:
        pass
    return flags

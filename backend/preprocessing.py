"""
Image preprocessing pipeline for photographed documents.
Applies deskew → deglare → contrast enhancement → binarization.
Returns a cleaned numpy array suitable for OCR.
"""
import numpy as np
from typing import Optional

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
    if not CV2_AVAILABLE:
        return image

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()
    gray = _deskew(gray)
    gray = _deglare(gray)
    gray = _enhance_contrast(gray)
    binary = _binarize(gray)
    return binary


def _deskew(gray: np.ndarray) -> np.ndarray:
    coords = np.column_stack(np.where(gray < 128))
    if len(coords) < 10:
        return gray
    angle = cv2.minAreaRect(coords.astype(np.float32))[-1]
    if angle < -45:
        angle = 90 + angle
    if abs(angle) < 0.5:
        return gray
    h, w = gray.shape
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)


def _deglare(gray: np.ndarray) -> np.ndarray:
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)
    return cv2.addWeighted(gray, 1.5, blurred, -0.5, 0)


def _enhance_contrast(gray: np.ndarray) -> np.ndarray:
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def _binarize(gray: np.ndarray) -> np.ndarray:
    return cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
    )


def image_bytes_to_array(image_bytes: bytes) -> Optional[np.ndarray]:
    if not CV2_AVAILABLE:
        return None
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


def pdf_page_to_array(pdf_bytes: bytes, page_index: int = 0) -> Optional[np.ndarray]:
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[page_index]
        pix = page.get_pixmap(dpi=150)
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        doc.close()
        if pix.n == 4:
            arr = arr[:, :, :3]
        if CV2_AVAILABLE:
            return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        return arr
    except Exception:
        return None

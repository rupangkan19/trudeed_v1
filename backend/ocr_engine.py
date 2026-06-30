"""
OCR wrapper using Tesseract. Returns extracted text and average confidence.
Gracefully degrades if Tesseract is not installed.
"""
import numpy as np

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


def extract_text(image: np.ndarray) -> tuple[str, float]:
    """Return (text, confidence 0-1). Returns ('', 0.0) if Tesseract unavailable."""
    if not TESSERACT_AVAILABLE or image is None:
        return "", 0.0
    try:
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT,
                                         lang="eng", config="--psm 6")
        words, confidences = [], []
        for i, word in enumerate(data["text"]):
            word = word.strip()
            conf = int(data["conf"][i])
            if word and conf > 0:
                words.append(word)
                confidences.append(conf)
        text = " ".join(words)
        avg_conf = sum(confidences) / len(confidences) / 100.0 if confidences else 0.0
        return text, avg_conf
    except Exception:
        return "", 0.0

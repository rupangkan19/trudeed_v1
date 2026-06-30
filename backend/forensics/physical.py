"""
Physical document forensics for photographed paper documents.
ELA is NOT used here (uniform JPEG compression from camera makes it useless).
We use: screenshot detection, sharpness variance, noise analysis.
"""
import numpy as np
from typing import Optional

_FLAG = lambda code, sev, detail: {"code": code, "severity": sev, "detail": detail, "category": "forensic"}

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


def analyze_photo(image: np.ndarray) -> list[dict]:
    if not CV2_AVAILABLE or image is None:
        return []

    flags: list[dict] = []
    flags += _detect_screenshot(image)
    flags += _sharpness_variance(image)
    flags += _noise_analysis(image)
    return flags


def _detect_screenshot(image: np.ndarray) -> list[dict]:
    """
    Photographs of physical paper have natural sensor noise and perspective.
    Screenshots / digitally composed images have extremely uniform flat regions.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # Compute noise level via difference with median-blurred version
    blurred = cv2.medianBlur(gray, 5)
    noise = np.abs(gray.astype(float) - blurred.astype(float))
    noise_std = float(noise.std())

    # Check histogram flatness in background region (top-left corner)
    h, w = gray.shape
    corner = gray[:h//8, :w//8]
    corner_std = float(corner.std())

    if noise_std < 1.5 and corner_std < 2.0:
        return [_FLAG(
            "SCREENSHOT_DETECTED", "RED",
            f"Image appears to be a digital screenshot or composite (noise_std={noise_std:.2f}), "
            f"not a photograph of a physical document. Real paper photos have natural sensor noise. "
            f"The 'document' may have never existed in physical form."
        )]

    return [_FLAG("PHOTO_NOISE_NATURAL", "GREEN",
                  f"Image noise pattern (std={noise_std:.1f}) is consistent with a genuine camera photograph.")]


def _sharpness_variance(image: np.ndarray) -> list[dict]:
    """
    Uniform documents photographed normally have consistent sharpness.
    Printed patches (replacement text stuck on) often have different focus.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    h, w = gray.shape

    # Compute Laplacian variance in 4×4 grid
    grid_h, grid_w = h // 4, w // 4
    variances = []
    for i in range(4):
        for j in range(4):
            cell = gray[i*grid_h:(i+1)*grid_h, j*grid_w:(j+1)*grid_w]
            lap = cv2.Laplacian(cell, cv2.CV_64F)
            variances.append(float(lap.var()))

    if not variances:
        return []

    mean_var = np.mean(variances)
    std_var = np.std(variances)

    if mean_var == 0:
        return []

    cv_ratio = std_var / mean_var
    outliers = [v for v in variances if abs(v - mean_var) > 3 * std_var]

    if cv_ratio > 2.5 and len(outliers) >= 2:
        return [_FLAG(
            "SHARPNESS_INCONSISTENCY", "AMBER",
            f"Sharpness varies significantly across document regions "
            f"(coefficient of variation: {cv_ratio:.1f}x). "
            f"{len(outliers)} regions show unusual focus characteristics — "
            f"may indicate pasted or printed-over sections."
        )]
    return []


def _noise_analysis(image: np.ndarray) -> list[dict]:
    """
    Check if noise characteristics are consistent across the document.
    Pasted/composite regions have different noise textures.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    h, w = gray.shape

    # Compare noise in left half vs right half
    left = gray[:, :w//2].astype(float)
    right = gray[:, w//2:].astype(float)

    left_blur = cv2.GaussianBlur(gray[:, :w//2], (5, 5), 0).astype(float)
    right_blur = cv2.GaussianBlur(gray[:, w//2:], (5, 5), 0).astype(float)

    left_noise = float(np.std(left - left_blur))
    right_noise = float(np.std(right - right_blur))

    if left_noise == 0 or right_noise == 0:
        return []

    ratio = max(left_noise, right_noise) / max(min(left_noise, right_noise), 0.001)

    if ratio > 4.0:
        return [_FLAG(
            "NOISE_INCONSISTENCY", "AMBER",
            f"Noise texture differs significantly between document halves "
            f"(ratio: {ratio:.1f}x). Different regions may originate from different sources."
        )]
    return []

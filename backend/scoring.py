"""
Flat scoring engine — no category weights.

Per flag:
  RED   : +35 points
  AMBER : +10 points
  GREEN : -5  points (capped at -20 total credit)

Final score capped at 0–100.

Verdict thresholds:
  0–20   → GENUINE
  21–45  → REVIEW
  46–70  → SUSPICIOUS
  71–100 → FORGED

Override: any 3+ RED flags → at least SUSPICIOUS (floor 46).
"""

PTS = {"RED": 35, "AMBER": 10, "GREEN": -5}
GREEN_CAP = -20

VERDICT_MAP = [
    (20, "GENUINE"),
    (45, "REVIEW"),
    (70, "SUSPICIOUS"),
    (100, "FORGED"),
]


def compute_score(
    forensic_flags: list,
    content_flags: list,
    cross_flags: list,
    history_flags: list,
) -> dict:
    all_flags = forensic_flags + content_flags + cross_flags + history_flags

    green_pts = max(GREEN_CAP, sum(PTS["GREEN"] for f in all_flags if f.get("severity") == "GREEN"))
    red_pts = sum(PTS["RED"] for f in all_flags if f.get("severity") == "RED")
    amber_pts = sum(PTS["AMBER"] for f in all_flags if f.get("severity") == "AMBER")

    score = max(0.0, min(100.0, float(red_pts + amber_pts + green_pts)))

    # Override: 3+ RED flags → floor at SUSPICIOUS
    red_count = sum(1 for f in all_flags if f.get("severity") == "RED")
    if red_count >= 3:
        score = max(score, 46.0)

    verdict = "GENUINE"
    for threshold, label in VERDICT_MAP:
        if score <= threshold:
            verdict = label
            break

    confidence = _confidence(score, verdict)
    reasons = _build_reasons(all_flags)

    return {
        "verdict": verdict,
        "score": round(score, 1),
        "confidence": confidence,
        "reasons": reasons,
        "all_flags": all_flags,
    }


def _confidence(score: float, verdict: str) -> float:
    if verdict == "GENUINE":
        return round(min(1.0, 0.5 + (20 - score) / 40), 2)
    if verdict == "FORGED":
        return round(min(1.0, 0.5 + (score - 70) / 60), 2)
    return 0.65


def _build_reasons(flags: list) -> list:
    reds = [f["detail"] for f in flags if f.get("severity") == "RED"]
    ambers = [f["detail"] for f in flags if f.get("severity") == "AMBER"]
    greens = [f["detail"] for f in flags if f.get("severity") == "GREEN"]

    reasons = []
    if not flags:
        reasons.append("No anomalies detected. Document appears consistent and authentic.")
    else:
        reasons.extend(reds[:5])
        if ambers and len(reds) < 3:
            reasons.extend(ambers[:2])
        if greens and not reds:
            reasons.extend(greens[:2])
    return reasons

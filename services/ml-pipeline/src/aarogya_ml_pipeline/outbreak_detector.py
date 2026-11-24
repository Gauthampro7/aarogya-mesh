"""EWMA Spatiotemporal Outbreak Detector for village-level syndromic surveillance.

Implements EWMA (Exponentially Weighted Moving Average) control-chart anomaly
detection per (village_id, syndrome) with pure Python standard library math.
Zero heavy ML or numerical dependencies.
"""

from __future__ import annotations

import math
import statistics

from aarogya_contracts import TriageSeverity
from aarogya_ml_pipeline.interfaces import OutbreakDetector, OutbreakSignal


class EwmaOutbreakDetector:
    """Statistical control-chart surge detector conforming to OutbreakDetector protocol."""

    def __init__(
        self,
        alpha: float = 0.3,
        sigma_multiplier: float = 2.5,
        min_baseline_days: int = 4,
        min_case_floor: int = 3,
    ) -> None:
        """Initialize EWMA outbreak detector with control-chart parameters.

        Args:
            alpha: Smoothing parameter in (0, 1]. Higher values weight recent days.
            sigma_multiplier: Control limit multiplier L (typically 2.0 to 3.0).
            min_baseline_days: Minimum historical days required before monitoring.
            min_case_floor: Minimum absolute count floor to prevent low-count false alerts.
        """
        if not (0.0 < alpha <= 1.0):
            raise ValueError(f"alpha must be in (0, 1], got {alpha}")
        if sigma_multiplier <= 0.0:
            raise ValueError(f"sigma_multiplier must be positive, got {sigma_multiplier}")
        if min_baseline_days < 1:
            raise ValueError(f"min_baseline_days must be >= 1, got {min_baseline_days}")
        if min_case_floor < 1:
            raise ValueError(f"min_case_floor must be >= 1, got {min_case_floor}")

        self.alpha = float(alpha)
        self.sigma_multiplier = float(sigma_multiplier)
        self.min_baseline_days = int(min_baseline_days)
        self.min_case_floor = int(min_case_floor)

    def detect_outbreak(
        self,
        village_id: str,
        syndrome: str,
        daily_counts: list[int],
    ) -> OutbreakSignal:
        """Evaluate daily case counts for an anomalous EWMA surge.

        Args:
            village_id: Identifier of the village/hamlet.
            syndrome: Clinical syndrome category (e.g. acute_diarrhea, dengue_like_fever).
            daily_counts: Chronological daily case counts ending with the current day.

        Returns:
            OutbreakSignal containing alert decision, EWMA value, baseline, and threshold.
        """
        for count in daily_counts:
            if count < 0:
                raise ValueError(f"Daily counts cannot contain negative numbers: {count}")

        # Handle empty series
        if not daily_counts:
            return OutbreakSignal(
                village_id=village_id,
                syndrome=syndrome,
                alert_triggered=False,
                ewma_value=0.0,
                baseline_mean=0.0,
                threshold=float(self.min_case_floor),
                severity=TriageSeverity.YELLOW_PHC,
                rationale="Insufficient daily counts for EWMA outbreak evaluation: series is empty.",
            )

        # Handle short series without sufficient baseline days
        if len(daily_counts) < self.min_baseline_days + 1:
            baseline = daily_counts[:-1]
            mu_0 = float(statistics.fmean(baseline)) if baseline else float(daily_counts[0])
            ewma_val = float(daily_counts[-1])
            return OutbreakSignal(
                village_id=village_id,
                syndrome=syndrome,
                alert_triggered=False,
                ewma_value=round(ewma_val, 4),
                baseline_mean=round(mu_0, 4),
                threshold=float(self.min_case_floor),
                severity=TriageSeverity.YELLOW_PHC,
                rationale=(
                    f"Insufficient baseline history ({len(daily_counts)} days provided, "
                    f"minimum {self.min_baseline_days + 1} days required)."
                ),
            )

        # Compute historical baseline statistics over daily_counts[:-1]
        baseline = daily_counts[:-1]
        mu_0 = float(statistics.fmean(baseline))
        sigma_0 = float(statistics.stdev(baseline)) if len(baseline) > 1 else 0.0

        # Poisson floor: sigma_eff = max(sigma_0, sqrt(max(mu_0, 1.0))) when variance is zero/under-dispersed
        poisson_floor = math.sqrt(max(mu_0, 1.0))
        sigma_eff = max(sigma_0, poisson_floor)

        # Asymptotic Upper Control Limit (UCL) for EWMA control chart
        # UCL = mu_0 + L * sigma_eff * sqrt(alpha / (2 - alpha))
        factor = math.sqrt(self.alpha / (2.0 - self.alpha))
        ucl = mu_0 + self.sigma_multiplier * sigma_eff * factor

        # Compute EWMA recursion z_t = alpha * x_t + (1 - alpha) * z_{t-1} initialized at z_0 = mu_0
        z = mu_0
        for x in daily_counts:
            z = self.alpha * float(x) + (1.0 - self.alpha) * z

        # Effective threshold accounts for min_case_floor noise suppression
        effective_threshold = max(ucl, float(self.min_case_floor))
        latest_count = daily_counts[-1]

        # Trigger alert only when EWMA exceeds threshold and current count meets case floor
        alert_triggered = bool(z >= effective_threshold and latest_count >= self.min_case_floor)

        # Severity triage: RED_EMERGENCY for severe surge (z_t >= 2 * UCL), else YELLOW_PHC
        if alert_triggered:
            severity = (
                TriageSeverity.RED_EMERGENCY
                if z >= 2.0 * ucl
                else TriageSeverity.YELLOW_PHC
            )
            rationale = (
                f"EWMA surge detected for {syndrome} in {village_id}: EWMA {round(z, 2)} "
                f"exceeded threshold {round(effective_threshold, 2)} (UCL={round(ucl, 2)}, "
                f"baseline={round(mu_0, 2)}, today={latest_count})."
            )
        else:
            severity = TriageSeverity.YELLOW_PHC
            rationale = (
                f"EWMA {round(z, 2)} remains within baseline threshold {round(effective_threshold, 2)} "
                f"(baseline={round(mu_0, 2)}, today={latest_count}) for {syndrome} in {village_id}."
            )

        return OutbreakSignal(
            village_id=village_id,
            syndrome=syndrome,
            alert_triggered=alert_triggered,
            ewma_value=round(z, 4),
            baseline_mean=round(mu_0, 4),
            threshold=round(effective_threshold, 4),
            severity=severity,
            rationale=rationale,
        )


def evaluate_village_syndromes(
    counts_by_key: dict[tuple[str, str], list[int]],
    detector: OutbreakDetector | None = None,
) -> list[OutbreakSignal]:
    """Evaluate multiple (village_id, syndrome) daily count series for outbreaks.

    Scans series deterministically in sorted order of (village_id, syndrome).

    Args:
        counts_by_key: Mapping from (village_id, syndrome) tuples to daily case counts.
        detector: Optional custom OutbreakDetector instance (defaults to EwmaOutbreakDetector()).

    Returns:
        List of OutbreakSignal results for all evaluated village-syndrome combinations.
    """
    active_detector = detector or EwmaOutbreakDetector()
    results: list[OutbreakSignal] = []
    for (village_id, syndrome), counts in sorted(counts_by_key.items()):
        signal = active_detector.detect_outbreak(village_id, syndrome, counts)
        results.append(signal)
    return results

#!/usr/bin/env python3
"""Train a deterministic synthetic LightGBM risk scoring model for Aarogya Mesh.

Generates synthetic pediatric and maternal patient records aligned with
``aarogya_clinical_engine.TriageInput`` features and trains a compact,
CPU-optimized LightGBM binary classifier serialized to text format.

Clinical Safety Invariant:
    Risk scores produced by this model are strictly advisory and NEVER
    override or downgrade deterministic triage rules in ``aarogya_clinical_engine``.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Ensure local libs (e.g. /tmp/pylibs) are accessible if present
if os.path.isdir("/tmp/pylibs") and "/tmp/pylibs" not in sys.path:
    sys.path.insert(0, "/tmp/pylibs")

import numpy as np  # noqa: E402

try:
    import lightgbm as lgb
except ImportError as err:
    sys.stderr.write(
        f"ERROR: lightgbm is required to run train_synthetic_risk_model.py: {err}\n"
    )
    sys.exit(1)


RISK_FEATURE_NAMES: list[str] = [
    "age_months",
    "fever_days",
    "temperature_c",
    "respiratory_rate_bpm",
    "spo2_pct",
    "systolic_bp",
    "diastolic_bp",
    "hemoglobin_g_dl",
    "muac_cm",
    "is_pregnant",
    "gestational_weeks",
    "has_danger_sign",
    "symptom_count",
]

# Monotonicity constraints: +1 = increasing risk, -1 = decreasing risk, 0 = unconstrained
# Guaranteed to preserve clinical risk ordering
MONOTONE_CONSTRAINTS: list[int] = [
    0,   # age_months: non-linear across pediatric/maternal
    1,   # fever_days: longer fever -> higher risk
    1,   # temperature_c: higher fever -> higher risk
    1,   # respiratory_rate_bpm: fast breathing -> higher risk
    -1,  # spo2_pct: lower oxygen -> higher risk
    1,   # systolic_bp: hypertension -> higher risk
    1,   # diastolic_bp: hypertension -> higher risk
    -1,  # hemoglobin_g_dl: lower Hb (severe anemia) -> higher risk
    -1,  # muac_cm: lower MUAC (SAM malnutrition) -> higher risk
    0,   # is_pregnant
    0,   # gestational_weeks
    1,   # has_danger_sign: any WHO danger sign -> strongly higher risk
    1,   # symptom_count: more co-occurring symptoms -> higher risk
]


def generate_synthetic_data(
    n_samples: int = 3000,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    """Generate synthetic maternal and pediatric clinical records with ground truth risk labels."""
    rng = np.random.RandomState(seed)
    n_half = n_samples // 2

    # Cohort 1: Pediatric patients (0 - 59 months)
    ped_age = rng.uniform(1.0, 59.0, size=n_half)
    ped_is_pregnant = np.zeros(n_half, dtype=np.float64)
    ped_gest_weeks = np.full(n_half, np.nan, dtype=np.float64)
    ped_muac = rng.normal(14.0, 2.0, size=n_half).clip(9.0, 22.0)
    ped_rr = rng.normal(32.0, 10.0, size=n_half).clip(18.0, 85.0)
    ped_sbp = rng.normal(95.0, 10.0, size=n_half).clip(70.0, 130.0)
    ped_dbp = rng.normal(60.0, 8.0, size=n_half).clip(40.0, 85.0)

    # Cohort 2: Maternal patients (180 - 500 months)
    mat_age = rng.uniform(180.0, 480.0, size=n_half)
    mat_is_pregnant = np.ones(n_half, dtype=np.float64)
    mat_gest_weeks = rng.uniform(6.0, 41.0, size=n_half)
    mat_muac = rng.normal(25.0, 3.5, size=n_half).clip(18.0, 38.0)
    mat_rr = rng.normal(18.0, 4.0, size=n_half).clip(12.0, 45.0)
    mat_sbp = rng.normal(118.0, 14.0, size=n_half).clip(85.0, 185.0)
    mat_dbp = rng.normal(76.0, 10.0, size=n_half).clip(55.0, 120.0)

    # Concatenate demographic features
    age_months = np.concatenate([ped_age, mat_age])
    is_pregnant = np.concatenate([ped_is_pregnant, mat_is_pregnant])
    gestational_weeks = np.concatenate([ped_gest_weeks, mat_gest_weeks])
    muac_cm = np.concatenate([ped_muac, mat_muac])
    respiratory_rate_bpm = np.concatenate([ped_rr, mat_rr])
    systolic_bp = np.concatenate([ped_sbp, mat_sbp])
    diastolic_bp = np.concatenate([ped_dbp, mat_dbp])

    # Shared clinical signs across both cohorts
    fever_days = rng.choice([0, 0, 0, 1, 2, 3, 4, 5, 7, 10], size=n_samples).astype(np.float64)
    temperature_c = rng.normal(37.0, 0.7, size=n_samples).clip(35.5, 41.0)
    spo2_pct = rng.normal(97.0, 3.0, size=n_samples).clip(78.0, 100.0)
    hemoglobin_g_dl = rng.normal(11.8, 1.9, size=n_samples).clip(5.5, 16.5)
    has_danger_sign = rng.binomial(1, 0.14, size=n_samples).astype(np.float64)
    symptom_count = rng.poisson(1.2, size=n_samples).clip(0, 7).astype(np.float64)

    # Calculate ground truth clinical risk logit (clinically grounded)
    logits = -1.8
    # Severe general danger signs dominate risk
    logits = logits + 3.8 * has_danger_sign
    # Prolonged fever & high temperature
    logits = logits + 0.30 * np.maximum(fever_days - 2.0, 0.0)
    logits = logits + 0.65 * np.maximum(temperature_c - 38.0, 0.0)
    # Tachypnea (fast breathing)
    logits = logits + 0.05 * np.maximum(respiratory_rate_bpm - 40.0, 0.0)
    # Hypoxia
    logits = logits + 0.28 * np.maximum(94.0 - spo2_pct, 0.0)
    # Hypertension (gestational pre-eclampsia or general crisis)
    logits = logits + 0.04 * np.maximum(systolic_bp - 135.0, 0.0)
    logits = logits + 0.05 * np.maximum(diastolic_bp - 88.0, 0.0)
    # Severe anemia
    logits = logits + 0.38 * np.maximum(10.5 - hemoglobin_g_dl, 0.0)
    # Severe acute malnutrition in children
    is_child = (age_months < 60.0)
    sam_deficit = np.where(is_child, np.maximum(11.5 - muac_cm, 0.0), 0.0)
    logits = logits + 0.85 * sam_deficit
    # Multi-symptom load
    logits = logits + 0.22 * symptom_count

    probs = 1.0 / (1.0 + np.exp(-logits))
    labels = (rng.uniform(0.0, 1.0, size=n_samples) < probs).astype(int)

    feature_matrix = np.column_stack([
        age_months,
        fever_days,
        temperature_c,
        respiratory_rate_bpm,
        spo2_pct,
        systolic_bp,
        diastolic_bp,
        hemoglobin_g_dl,
        muac_cm,
        is_pregnant,
        gestational_weeks,
        has_danger_sign,
        symptom_count,
    ])

    return feature_matrix, labels


def train_risk_model(
    output_path: Path,
    n_samples: int = 3000,
    seed: int = 42,
) -> Path:
    """Train LightGBM binary classifier and save compact model text file."""
    X, y = generate_synthetic_data(n_samples=n_samples, seed=seed)

    dataset = lgb.Dataset(
        data=X,
        label=y,
        feature_name=RISK_FEATURE_NAMES,
        free_raw_data=False,
    )

    params: dict[str, object] = {
        "objective": "binary",
        "metric": "binary_logloss",
        "boosting_type": "gbdt",
        "num_leaves": 15,
        "max_depth": 4,
        "learning_rate": 0.08,
        "min_data_in_leaf": 15,
        "monotone_constraints": MONOTONE_CONSTRAINTS,
        "verbosity": -1,
        "seed": seed,
        "deterministic": True,
        "force_col_wise": True,
    }

    booster = lgb.train(params, dataset, num_boost_round=40)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(output_path))

    file_size_kib = output_path.stat().st_size / 1024.0
    print(
        f"Saved compact LightGBM risk model to {output_path} "
        f"({file_size_kib:.2f} KiB, {booster.num_trees()} trees)"
    )
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Train synthetic LightGBM risk scorer.")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "models" / "risk_lgbm.txt",
        help="Path for saved LightGBM model text file.",
    )
    parser.add_argument(
        "--samples",
        "-n",
        type=int,
        default=3000,
        help="Number of synthetic clinical records to generate (default: 3000).",
    )
    parser.add_argument(
        "--seed",
        "-s",
        type=int,
        default=42,
        help="Deterministic random seed (default: 42).",
    )
    args = parser.parse_args()

    train_risk_model(output_path=args.output, n_samples=args.samples, seed=args.seed)


if __name__ == "__main__":
    main()

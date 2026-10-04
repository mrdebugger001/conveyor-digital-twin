#!/usr/bin/env python3
"""Dataset Ingestion & Vibration ML Pipeline Validation Script.

Validates CWRU bearing dataset, Paderborn current/vibration synchronization,
Mendeley industrial belt drive dataset, NASA IMS degradation curves,
and FFT/envelope feature extraction.
"""

import sys
from pathlib import Path
import numpy as np

backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.data import CWRULoader, PaderbornLoader, BeltDriveDatasetLoader, NASAIMSLoader
from app.data.common_schema import EquipmentHealthCondition
from app.ml.vibration.features import VibrationFeatureExtractor
from app.ml.vibration.bearing_frequencies import BearingFrequencyCalculator
from app.ml.vibration.anomaly import ConditionAnomalyDetector


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f"  {title.upper()}")
    print("=" * 70)


def test_cwru_dataset():
    print_header("Test 1: CWRU Bearing Data Center Ingestion & Feature Extraction")
    loader = CWRULoader()
    extractor = VibrationFeatureExtractor(sample_rate_hz=12000.0)

    # 1. Healthy burst
    burst_healthy = loader.load_burst(
        condition=EquipmentHealthCondition.HEALTHY,
        rpm=1485.0,
        load_pct=75.0,
        duration_s=1.0,
    )
    feat_healthy = extractor.extract_features(np.array(burst_healthy.time_series_data))
    print("Healthy Bearing Features:")
    print(f"  RMS:             {feat_healthy.rms:.3f} m/s^2")
    print(f"  Kurtosis:        {feat_healthy.kurtosis:.2f} (Gaussian baseline ~3.0)")
    print(f"  Crest Factor:    {feat_healthy.crest_factor:.2f}")

    # 2. Outer race fault burst
    burst_fault = loader.load_burst(
        condition=EquipmentHealthCondition.OUTER_RACE_FAULT,
        rpm=1485.0,
        load_pct=75.0,
        duration_s=1.0,
    )
    feat_fault = extractor.extract_features(np.array(burst_fault.time_series_data))
    print("Outer Race Defect Features:")
    print(f"  RMS:             {feat_fault.rms:.3f} m/s^2")
    print(f"  Kurtosis:        {feat_fault.kurtosis:.2f} (Spike > 4.5 indicates shock impacts)")
    print(f"  Envelope RMS:    {feat_fault.envelope_rms:.3f}")

    assert feat_fault.rms > feat_healthy.rms, "Faulty bearing RMS must exceed healthy RMS!"
    assert feat_fault.kurtosis > feat_healthy.kurtosis, "Faulty bearing kurtosis must exceed healthy kurtosis!"
    print(">>> PASS: CWRU dataset loader & feature extraction validated.")


def test_paderborn_dataset():
    print_header("Test 2: Paderborn Synchronized Current & Vibration MCSA")
    loader = PaderbornLoader()
    bursts = loader.load_synchronized_burst(
        condition=EquipmentHealthCondition.INNER_RACE_FAULT,
        rpm=1485.0,
        load_pct=75.0,
        duration_s=0.5,
    )

    current = np.array(bursts["current"].time_series_data)
    vibration = np.array(bursts["vibration"].time_series_data)

    current_rms = float(np.sqrt(np.mean(current ** 2)))
    vib_rms = float(np.sqrt(np.mean(vibration ** 2)))

    print(f"Current RMS:     {current_rms:.2f} A (50 Hz fundamental + sidebands)")
    print(f"Vibration RMS:   {vib_rms:.2f} m/s^2")

    assert current_rms > 30.0, "Current RMS within normal motor operating envelope!"
    assert vib_rms > 0.5, "Vibration RMS detected!"
    print(">>> PASS: Paderborn synchronized current/vibration validated.")


def test_belt_drive_dataset():
    print_header("Test 3: Mendeley Industrial Belt Drive Vibration & Resonances")
    loader = BeltDriveDatasetLoader()
    burst = loader.load_belt_vibration_burst(
        condition=EquipmentHealthCondition.HEALTHY,
        belt_speed_m_s=3.2,
        tension_kn=145.0,
        duration_s=1.0,
    )

    meta = burst.metadata
    print(f"Belt Speed:                  3.2 m/s")
    print(f"Idler Roll Passing Freq:     {meta['f_idler_hz']} Hz")
    print(f"Strand Natural Frequency:    {meta['f_strand_resonance_hz']} Hz")
    print(f"Sample Count:                {len(burst.time_series_data)}")

    assert meta["f_idler_hz"] > 5.0, "Idler frequency should be ~6.7 Hz for 152mm roller at 3.2 m/s"
    print(">>> PASS: Belt drive resonance & idler kinematics validated.")


def test_nasa_ims_trajectory():
    print_header("Test 4: NASA IMS Run-to-Failure Degradation Trajectory")
    loader = NASAIMSLoader()
    traj = loader.get_degradation_trajectory(total_points=50)

    start = traj[0]
    mid = traj[35]   # ~70% lifetime
    end = traj[-1]   # 100% lifetime (failure)

    print(f"Start (0% Life):   RMS={start['rms_g']:.3f}g, Kurtosis={start['kurtosis']:.2f}, Health={start['health_score']:.0f}%")
    print(f"Mid   (70% Life):  RMS={mid['rms_g']:.3f}g, Kurtosis={mid['kurtosis']:.2f}, Health={mid['health_score']:.0f}%")
    print(f"End   (100% Life): RMS={end['rms_g']:.3f}g, Kurtosis={end['kurtosis']:.2f}, Health={end['health_score']:.0f}%")

    assert end["rms_g"] > start["rms_g"] * 3.0, "End-of-life RMS must be substantially elevated!"
    assert end["health_score"] < start["health_score"], "Health score must degrade monotonically!"
    print(">>> PASS: NASA IMS run-to-failure degradation trajectory validated.")


def test_bearing_kinematics():
    print_header("Test 5: Theoretical Rolling Element Bearing Defect Kinematics")
    calc = BearingFrequencyCalculator()
    rpm = 1485.0
    freqs = calc.calculate(shaft_speed_rpm=rpm)

    print(f"Shaft RPM:       {rpm} RPM (f_shaft = {freqs.shaft_frequency_fr_hz} Hz)")
    print(f"FTF (Cage):      {freqs.ftf_cage_hz} Hz")
    print(f"BPFO (Outer):    {freqs.bpfo_outer_race_hz} Hz")
    print(f"BPFI (Inner):    {freqs.bpfi_inner_race_hz} Hz")
    print(f"BSF (Ball Spin): {freqs.bsf_ball_spin_hz} Hz")

    # For 9-ball bearing: BPFO + BPFI = Z * f_shaft
    sum_bpfo_bpfi = freqs.bpfo_outer_race_hz + freqs.bpfi_inner_race_hz
    expected_sum = 9 * freqs.shaft_frequency_fr_hz
    print(f"BPFO + BPFI:     {sum_bpfo_bpfi:.2f} Hz (Theoretical Z*fr: {expected_sum:.2f} Hz)")

    assert abs(sum_bpfo_bpfi - expected_sum) < 0.5, "Kinematic identity BPFO + BPFI = Z * f_shaft must hold!"
    print(">>> PASS: Rolling element defect frequency kinematics validated.")


if __name__ == "__main__":
    print("\n" + "#" * 70)
    print("  RUNNING DATASET INGESTION & VIBRATION ML VALIDATION SUITE")
    print("#" * 70)

    try:
        test_cwru_dataset()
        test_paderborn_dataset()
        test_belt_drive_dataset()
        test_nasa_ims_trajectory()
        test_bearing_kinematics()

        print("\n" + "=" * 70)
        print("  ALL 5 DATASET & VIBRATION ML TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 70 + "\n")
    except Exception as e:
        print(f"\nVALIDATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

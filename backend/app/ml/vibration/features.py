import math
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional
from scipy import signal, stats


@dataclass
class VibrationFeatures:
    # Time domain features
    rms: float
    peak: float
    peak_to_peak: float
    crest_factor: float
    kurtosis: float
    skewness: float
    shape_factor: float
    impulse_factor: float

    # Frequency domain features
    spectral_centroid_hz: float
    spectral_spread_hz: float
    dominant_frequency_hz: float
    band_energy_low_pct: float   # 0 - 100 Hz (imbalance, misalignment, idler pass)
    band_energy_mid_pct: float   # 100 - 1000 Hz (gear meshing, harmonics)
    band_energy_high_pct: float  # 1000 - 5000 Hz (bearing impact resonance)

    # Demodulation / Envelope features
    envelope_rms: float


class VibrationFeatureExtractor:
    """Extracts high-dimensional statistical and spectral features from vibration windows

    for condition monitoring, fault classification, and anomaly detection.
    """

    def __init__(self, sample_rate_hz: float = 10000.0):
        self.sample_rate_hz = sample_rate_hz

    def extract_features(self, x: np.ndarray) -> VibrationFeatures:
        n = len(x)
        if n == 0:
            return VibrationFeatures(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

        # 1. Time-Domain Metrics
        mean = float(np.mean(x))
        rms = float(np.sqrt(np.mean(x ** 2)))
        peak = float(np.max(np.abs(x)))
        peak_to_peak = float(np.max(x) - np.min(x))
        abs_mean = float(np.mean(np.abs(x)))

        crest_factor = peak / max(1.0e-6, rms)
        shape_factor = rms / max(1.0e-6, abs_mean)
        impulse_factor = peak / max(1.0e-6, abs_mean)

        std = float(np.std(x))
        if std > 1.0e-6:
            kurtosis = float(stats.kurtosis(x, fisher=False))  # Pearson kurtosis (Normal = 3.0)
            skewness = float(stats.skew(x))
        else:
            kurtosis = 3.0
            skewness = 0.0

        # 2. Frequency-Domain (FFT) Metrics
        fft_vals = np.abs(np.fft.rfft(x * np.hanning(n)))
        freqs = np.fft.rfftfreq(n, d=1.0 / self.sample_rate_hz)

        total_energy = float(np.sum(fft_vals))
        if total_energy > 1.0e-6:
            # Spectral Centroid
            spectral_centroid = float(np.sum(freqs * fft_vals) / total_energy)
            # Spectral Spread
            spectral_spread = float(np.sqrt(np.sum(((freqs - spectral_centroid) ** 2) * fft_vals) / total_energy))
            # Dominant Frequency
            dom_idx = int(np.argmax(fft_vals[1:])) + 1  # Ignore 0-Hz DC
            dominant_freq = float(freqs[dom_idx])

            # Sub-band Energy Percentages
            mask_low = freqs <= 100.0
            mask_mid = (freqs > 100.0) & (freqs <= 1000.0)
            mask_high = (freqs > 1000.0) & (freqs <= 5000.0)

            band_low = float(np.sum(fft_vals[mask_low])) / total_energy * 100.0
            band_mid = float(np.sum(fft_vals[mask_mid])) / total_energy * 100.0
            band_high = float(np.sum(fft_vals[mask_high])) / total_energy * 100.0
        else:
            spectral_centroid = 0.0
            spectral_spread = 0.0
            dominant_freq = 0.0
            band_low = 0.0
            band_mid = 0.0
            band_high = 0.0

        # 3. Demodulated Envelope Analysis (Hilbert Transform)
        analytic_signal = signal.hilbert(x)
        envelope = np.abs(analytic_signal)
        envelope_rms = float(np.sqrt(np.mean(envelope ** 2)))

        return VibrationFeatures(
            rms=round(rms, 4),
            peak=round(peak, 4),
            peak_to_peak=round(peak_to_peak, 4),
            crest_factor=round(crest_factor, 3),
            kurtosis=round(kurtosis, 2),
            skewness=round(skewness, 3),
            shape_factor=round(shape_factor, 3),
            impulse_factor=round(impulse_factor, 3),
            spectral_centroid_hz=round(spectral_centroid, 1),
            spectral_spread_hz=round(spectral_spread, 1),
            dominant_frequency_hz=round(dominant_freq, 1),
            band_energy_low_pct=round(band_low, 1),
            band_energy_mid_pct=round(band_mid, 1),
            band_energy_high_pct=round(band_high, 1),
            envelope_rms=round(envelope_rms, 4),
        )

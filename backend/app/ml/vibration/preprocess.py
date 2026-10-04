import numpy as np
from typing import List, Generator, Tuple
from scipy import signal


def apply_bandpass_filter(
    data: np.ndarray,
    sample_rate_hz: float,
    lowcut_hz: float = 10.0,
    highcut_hz: float = 4500.0,
    order: int = 4,
) -> np.ndarray:
    """Applies a Butterworth bandpass filter to isolate machine defect frequency bands."""
    nyquist = 0.5 * sample_rate_hz
    # Guard against invalid filter cutoff
    low = max(0.1, lowcut_hz) / nyquist
    high = min(nyquist * 0.95, highcut_hz) / nyquist

    if low >= high:
        return data

    b, a = signal.butter(order, [low, high], btype="band")
    filtered = signal.filtfilt(b, a, data)
    return filtered


def sliding_windows(
    data: np.ndarray,
    window_size: int,
    overlap_pct: float = 0.5,
) -> Generator[np.ndarray, None, None]:
    """Generates sliding overlapping data windows for feature extraction."""
    step = int(window_size * (1.0 - overlap_pct))
    step = max(1, step)
    n_samples = len(data)

    for start in range(0, n_samples - window_size + 1, step):
        yield data[start : start + window_size]


def apply_hanning_window(window_data: np.ndarray) -> np.ndarray:
    """Applies Hanning window taper to eliminate spectral leakage in FFT."""
    return window_data * np.hanning(len(window_data))

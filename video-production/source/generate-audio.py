import json
import math
import struct
import wave
from pathlib import Path
import numpy as np

# Modern SaaS Product Intro Audio Generator
SAMPLE_RATE = 48000
BPM = 124.0
FPS = 60.0
BEAT_DUR = 60.0 / BPM  # ~0.4838 sec
BAR_DUR = BEAT_DUR * 4.0  # ~1.9355 sec
TOTAL_BARS = 40
TOTAL_DUR = TOTAL_BARS * BAR_DUR  # ~77.42 sec
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_DUR)

t = np.linspace(0, TOTAL_DUR, TOTAL_SAMPLES, endpoint=False)
audio_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
audio_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

print(f"Synthesizing {TOTAL_DUR:.2f}s modern SaaS tech soundtrack ({BPM} BPM)...")

# Clean, punchy modern electronic kick (Stripe/Apple style)
def add_kick(start_time, strength=1.0):
    dur = 0.28
    idx_start = int(start_time * SAMPLE_RATE)
    idx_end = min(TOTAL_SAMPLES, idx_start + int(dur * SAMPLE_RATE))
    if idx_start >= TOTAL_SAMPLES:
        return
    n = idx_end - idx_start
    kt = np.linspace(0, dur, n, endpoint=False)
    freq = 52.0 + 95.0 * np.exp(-kt * 32.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-kt * 12.0) * strength
    kick = np.sin(phase) * env * 0.9
    audio_left[idx_start:idx_end] += kick
    audio_right[idx_start:idx_end] += kick

# Modern crisp clap/snap on beats 2 & 4
def add_clap(start_time, strength=0.75):
    dur = 0.22
    idx_start = int(start_time * SAMPLE_RATE)
    idx_end = min(TOTAL_SAMPLES, idx_start + int(dur * SAMPLE_RATE))
    if idx_start >= TOTAL_SAMPLES:
        return
    n = idx_end - idx_start
    ct = np.linspace(0, dur, n, endpoint=False)
    # Pre-burst for snappy clap feel
    noise = np.random.uniform(-1.0, 1.0, n)
    env = np.exp(-ct * 24.0)
    # Layered body
    tone = np.sin(2.0 * np.pi * 1100.0 * ct) * np.exp(-ct * 35.0) * 0.25
    clap = (noise * 0.75 + tone) * env * strength * 0.55
    audio_left[idx_start:idx_end] += clap * 0.95
    audio_right[idx_start:idx_end] += clap * 1.05

# Smooth high-end hi-hat
def add_hihat(start_time, open_hat=False, vel=0.2):
    dur = 0.12 if open_hat else 0.035
    idx_start = int(start_time * SAMPLE_RATE)
    idx_end = min(TOTAL_SAMPLES, idx_start + int(dur * SAMPLE_RATE))
    if idx_start >= TOTAL_SAMPLES:
        return
    n = idx_end - idx_start
    ht = np.linspace(0, dur, n, endpoint=False)
    noise = np.random.uniform(-1.0, 1.0, n)
    carrier = np.sin(2.0 * np.pi * 9200.0 * ht) + 0.4 * np.sin(2.0 * np.pi * 12500.0 * ht)
    env = np.exp(-ht * (22.0 if open_hat else 80.0))
    hat = noise * carrier * env * vel
    audio_left[idx_start:idx_end] += hat * 0.9
    audio_right[idx_start:idx_end] += hat * 1.1

# Warm polyphonic SaaS chord stab (analog supersaw + warm triangle)
def add_chord_stab(start_time, dur, freqs, brightness=1.0, pan=0.0):
    idx_start = int(start_time * SAMPLE_RATE)
    idx_end = min(TOTAL_SAMPLES, idx_start + int(dur * SAMPLE_RATE))
    if idx_start >= TOTAL_SAMPLES:
        return
    n = idx_end - idx_start
    st = np.linspace(0, dur, n, endpoint=False)
    env = np.exp(-st * (3.5 / dur))
    chord_sig = np.zeros(n, dtype=np.float32)
    for f in freqs:
        # Detuned unison oscillators
        detune = 1.003
        osc1 = np.sin(2.0 * np.pi * f * st)
        osc2 = np.sin(2.0 * np.pi * (f * detune) * st) * 0.6
        osc3 = (2.0 * ((st * f) % 1.0) - 1.0) * 0.25 * brightness
        chord_sig += (osc1 + osc2 + osc3) / len(freqs)

    chord_sig = np.tanh(chord_sig * 1.4) * env * 0.28
    audio_left[idx_start:idx_end] += chord_sig * (1.0 - pan * 0.3)
    audio_right[idx_start:idx_end] += chord_sig * (1.0 + pan * 0.3)

# Deep round analog bassline
def add_bass(start_time, dur, freq, pan=0.0):
    idx_start = int(start_time * SAMPLE_RATE)
    idx_end = min(TOTAL_SAMPLES, idx_start + int(dur * SAMPLE_RATE))
    if idx_start >= TOTAL_SAMPLES:
        return
    n = idx_end - idx_start
    bt = np.linspace(0, dur, n, endpoint=False)
    env = np.ones(n)
    att = int(min(n * 0.05, 0.01 * SAMPLE_RATE))
    rel = int(min(n * 0.15, 0.04 * SAMPLE_RATE))
    if att > 0: env[:att] = np.linspace(0, 1, att)
    if rel > 0: env[-rel:] = np.linspace(1, 0, rel)
    sub = np.sin(2.0 * np.pi * freq * bt) * 0.75
    warm = np.sin(2.0 * np.pi * (freq * 2.0) * bt) * 0.25
    bass = np.tanh(sub + warm) * env * 0.38
    audio_left[idx_start:idx_end] += bass
    audio_right[idx_start:idx_end] += bass

# Melodic arpeggio pluck
def add_pluck(start_time, freq, dur=0.18, pan=0.0):
    idx_start = int(start_time * SAMPLE_RATE)
    idx_end = min(TOTAL_SAMPLES, idx_start + int(dur * SAMPLE_RATE))
    if idx_start >= TOTAL_SAMPLES:
        return
    n = idx_end - idx_start
    pt = np.linspace(0, dur, n, endpoint=False)
    env = np.exp(-pt * 18.0)
    bell = (np.sin(2.0 * np.pi * freq * pt) + 0.35 * np.sin(2.0 * np.pi * (freq * 2.0) * pt)) * env * 0.16
    audio_left[idx_start:idx_end] += bell * (1.0 - pan * 0.5)
    audio_right[idx_start:idx_end] += bell * (1.0 + pan * 0.5)

# Smooth noise riser for transitions
def add_riser(start_time, dur=1.8):
    idx_start = int(start_time * SAMPLE_RATE)
    idx_end = min(TOTAL_SAMPLES, idx_start + int(dur * SAMPLE_RATE))
    if idx_start >= TOTAL_SAMPLES:
        return
    n = idx_end - idx_start
    rt = np.linspace(0, dur, n, endpoint=False)
    noise = np.random.uniform(-1.0, 1.0, n)
    sweep_freq = 300.0 + 4200.0 * (rt / dur) ** 2.5
    carrier = np.sin(2.0 * np.pi * np.cumsum(sweep_freq) / SAMPLE_RATE)
    env = (rt / dur) ** 2.0 * 0.24
    riser = noise * carrier * env
    audio_left[idx_start:idx_end] += riser
    audio_right[idx_start:idx_end] += riser

# Chord progression (Fm - Db - Ab - Eb) in Hz
CHORDS = [
    # Fm7: F3 (174.6), Ab3 (207.6), C4 (261.6), Eb4 (311.1)
    [174.61, 207.65, 261.63, 311.13],
    # Dbmaj7: Db3 (138.6), F3 (174.6), Ab3 (207.6), C4 (261.6)
    [138.59, 174.61, 207.65, 261.63],
    # Abmaj7: Ab2 (103.8), C3 (130.8), Eb3 (155.6), G3 (196.0), C4 (261.6)
    [207.65, 261.63, 311.13, 392.00],
    # Eb7: Eb3 (155.6), G3 (196.0), Bb3 (233.1), Eb4 (311.1)
    [155.56, 196.00, 233.08, 311.13],
]
BASS_ROOTS = [43.65, 34.65, 51.91, 38.89]  # F1, Db1, Ab1, Eb1

# 1. Arrange Chords & Bassline across bars
for bar in range(TOTAL_BARS):
    bar_start = bar * BAR_DUR
    chord_idx = bar % 4
    chord_freqs = CHORDS[chord_idx]
    root = BASS_ROOTS[chord_idx]

    # Warm chord stabs on beat 1 and beat 2.5 (classic syncopated SaaS groove)
    if bar >= 1:
        add_chord_stab(bar_start, BEAT_DUR * 1.5, chord_freqs, brightness=0.8, pan=-0.2)
        add_chord_stab(bar_start + BEAT_DUR * 2.5, BEAT_DUR * 1.2, chord_freqs, brightness=1.0, pan=0.2)

    # Bassline (rolling 8th notes during main body)
    if 2 <= bar < 38:
        for eighth in range(8):
            t_eighth = bar_start + eighth * (BEAT_DUR / 2.0)
            f_bass = root if eighth in (0, 1, 2, 4, 6) else root * 1.5
            add_bass(t_eighth, BEAT_DUR * 0.42, f_bass)

    # Melodic arpeggio plucks
    if 2 <= bar < 38:
        for p_idx, pf in enumerate([chord_freqs[1] * 2, chord_freqs[2] * 2, chord_freqs[3] * 2, chord_freqs[0] * 4]):
            t_p = bar_start + (p_idx * 2 + 1) * (BEAT_DUR / 2.0)
            add_pluck(t_p, pf, dur=0.15, pan=((p_idx % 2) - 0.5) * 0.8)

# 2. Arrange Drums
for bar in range(TOTAL_BARS):
    bar_start = bar * BAR_DUR
    # Four-on-the-floor kick for steady confident drive
    if 2 <= bar < 38:
        for beat in range(4):
            add_kick(bar_start + beat * BEAT_DUR, strength=1.0 if beat % 2 == 0 else 0.85)

    # Snappy modern claps on beats 2 & 4
    if 2 <= bar < 38:
        add_clap(bar_start + 1 * BEAT_DUR)
        add_clap(bar_start + 3 * BEAT_DUR)

    # Shimmering Hi-Hats
    if 2 <= bar < 38:
        for sixteenth in range(16):
            t_hat = bar_start + sixteenth * (BEAT_DUR / 4.0)
            is_open = (sixteenth % 4 == 2)
            add_hihat(t_hat, open_hat=is_open, vel=0.22 if is_open else 0.12)

# Risers into transitions
for riser_bar in [1.5, 7.5, 13.5, 19.5, 25.5, 31.5, 37.0]:
    add_riser(riser_bar * BAR_DUR, dur=BAR_DUR * 0.5)

# Master Limiter & Normalization
max_amp = max(np.max(np.abs(audio_left)), np.max(np.abs(audio_right)))
if max_amp > 0.01:
    audio_left = np.tanh(audio_left / max_amp * 1.25) * 0.94
    audio_right = np.tanh(audio_right / max_amp * 1.25) * 0.94

# Save audio
out_dir = Path(r"D:\sih 2026\conveyor-digital-twin\video-production\assets\music")
out_dir.mkdir(parents=True, exist_ok=True)
wav_path = out_dir / "saas-intro-master.wav"

audio_interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
audio_interleaved[0::2] = (audio_left * 32767).astype(np.int16)
audio_interleaved[1::2] = (audio_right * 32767).astype(np.int16)

with wave.open(str(wav_path), 'wb') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(audio_interleaved.tobytes())

print(f"Master SaaS soundtrack saved to {wav_path} (size: {wav_path.stat().st_size} bytes)")

# Also copy to frontend public directory
public_dest = Path(r"D:\sih 2026\conveyor-digital-twin\frontend\public\video\saas-intro-master.wav")
public_dest.parent.mkdir(parents=True, exist_ok=True)
with open(public_dest, 'wb') as f:
    f.write(wav_path.read_bytes())
print(f"Copied soundtrack to {public_dest}")

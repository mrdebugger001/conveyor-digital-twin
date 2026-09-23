import os
import wave

audio_dir = r"d:\sih 2026\conveyor-digital-twin\frontend\public\audio"
for f in sorted(os.listdir(audio_dir)):
    if f.endswith(".wav"):
        p = os.path.join(audio_dir, f)
        with wave.open(p, 'r') as w:
            frames = w.getnframes()
            rate = w.getframerate()
            duration = frames / float(rate)
            print(f"{f}: {duration:.2f} seconds ({int(duration * 60)} frames @ 60fps)")

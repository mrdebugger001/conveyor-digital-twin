from __future__ import annotations

import math
import shutil
import subprocess
import wave
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(r"D:\sih 2026\conveyor-digital-twin")
SHOTS = ROOT / "video-production" / "screenshots"
RENDER = ROOT / "video-production" / "renders"
OUT = ROOT / "demo-video"
RENDER.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

W, H, FPS = 1920, 1080, 30
FONT = Path(r"C:\Windows\Fonts\segoeuib.ttf")
FONT_B = Path(r"C:\Windows\Fonts\segoeuib.ttf")

SCENES = [
    ("01-live-twin", 12, "IRON ORE CONVEYOR", "DIGITAL TWIN", "Real-time HMI for conveyor C01", 1.00, (0, 0)),
    ("02-running-twin", 20, "LIVE OPERATIONS", "ONE FOCUSED WORKSPACE", "3D twin · telemetry · controls · alarms", 1.00, (0, 0)),
    ("03-simulator", 20, "SAFE SIMULATION", "MODEL THE UNEXPECTED", "Inject conditions without interrupting physical operations", 1.00, (0, 0)),
    ("05-asset-inspector", 17, "ASSET DIAGNOSTICS", "INSPECT J023", "Live health, probability, and contributing factors", 1.02, (140, 0)),
    ("06-analytics", 23, "LIVE ANALYTICS", "TELEMETRY THAT MOVES", "Streaming trends and a 24-joint health matrix", 1.00, (0, 0)),
    ("07-alarms", 15, "ALARM WORKFLOW", "PRIORITIZE THE SIGNAL", "Severity-aware events ready for acknowledgement", 1.01, (0, 0)),
    ("08-maintenance", 15, "MAINTENANCE", "TURN RISK INTO ACTION", "Prioritized recommendations with risk horizons", 1.00, (0, 0)),
    ("09-closing-twin", 18, "ENGINEERED FOR THE FLOOR", "SEE. TEST. RESPOND.", "React · Three.js · FastAPI · WebSockets · SQLite", 1.03, (0, 0)),
]

def font(size: int):
    return ImageFont.truetype(str(FONT_B), size)

def prepare(path: Path) -> np.ndarray:
    img = cv2.imread(str(path))
    if img is None:
        raise RuntimeError(f"Missing capture: {path}")
    return cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)

def camera(img: np.ndarray, p: float, zoom: float, pan: tuple[int, int]) -> np.ndarray:
    z = 1 + (zoom - 1) * p
    sw, sh = int(W * z), int(H * z)
    enlarged = cv2.resize(img, (sw, sh), interpolation=cv2.INTER_CUBIC)
    maxx, maxy = max(0, sw-W), max(0, sh-H)
    x = int(maxx * 0.5 + pan[0] * p)
    y = int(maxy * 0.5 + pan[1] * p)
    x, y = max(0, min(x, maxx)), max(0, min(y, maxy))
    return enlarged[y:y+H, x:x+W].copy()

def overlay(frame: np.ndarray, kicker: str, title: str, sub: str, alpha: float) -> np.ndarray:
    im = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).convert('RGBA')
    layer = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(layer)
    d.rectangle((0, 0, W, 105), fill=(5, 14, 24, 195))
    d.rectangle((0, H-180, W, H), fill=(5, 14, 24, 210))
    d.rectangle((66, H-139, 73, H-49), fill=(42, 202, 190, 255))
    # fade typography in / out so product stays central
    a = int(255 * alpha)
    d.text((100, H-148), kicker, fill=(78, 232, 211, a), font=font(24))
    d.text((100, H-112), title, fill=(245, 252, 255, a), font=font(45))
    d.text((102, H-52), sub, fill=(189, 209, 222, a), font=font(23))
    d.text((66, 35), "C01  /  REAL-TIME DIGITAL TWIN", fill=(171, 202, 217, 220), font=font(21))
    d.text((W-300, 35), "SIH 2026", fill=(78, 232, 211, 230), font=font(21))
    im = Image.alpha_composite(im, layer)
    return cv2.cvtColor(np.asarray(im.convert('RGB')), cv2.COLOR_RGB2BGR)

silent = RENDER / 'product-film-silent.mp4'
writer = cv2.VideoWriter(str(silent), cv2.VideoWriter_fourcc(*'mp4v'), FPS, (W, H))
if not writer.isOpened():
    raise RuntimeError('OpenCV could not create the preview video')

for name, seconds, kicker, title, sub, zoom, pan in SCENES:
    img = prepare(SHOTS / f'{name}.png')
    total = seconds * FPS
    for n in range(total):
        p = n / max(1, total-1)
        fade = min(1, p*5, (1-p)*5)
        frame = camera(img, p, zoom, pan)
        writer.write(overlay(frame, kicker, title, sub, fade))
writer.release()

def write_ambient(path: Path, seconds: float):
    sr = 44100
    t = np.arange(int(sr*seconds))/sr
    # restrained evolving electronic bed: quiet and deliberately non-melodic
    sig = (0.032*np.sin(2*np.pi*110*t) + 0.018*np.sin(2*np.pi*164.81*t) +
           0.012*np.sin(2*np.pi*220*t) + 0.006*np.sin(2*np.pi*(0.08*t*t+440)*t))
    env = np.minimum(1, np.minimum(t/3, (seconds-t)/4))
    data = np.int16(np.clip(sig*env, -1, 1)*32767)
    with wave.open(str(path), 'w') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr); f.writeframes(data.tobytes())

ambient = RENDER / 'ambient.wav'
write_ambient(ambient, sum(s[1] for s in SCENES))

# A brief, factual voice-over is generated locally from the verified narration using Windows SAPI.
narration = RENDER / 'narration.wav'
text = "Iron Ore Conveyor Digital Twin. A real-time operational view of conveyor C01. Live telemetry, a three-dimensional conveyor, operator controls, and alarm status come together in one focused workspace. The simulator safely models conditions such as joint damage, overheat, vibration, belt tear, and conveyor jams. Asset diagnostics surface component health, failure probability, and contributing factors. Streaming analytics tracks operating metrics and a 24-joint health matrix. Alarm and maintenance workflows turn risk signals into practical action. Built with React, TypeScript, Three.js, FastAPI, WebSockets, Zustand, Recharts, and SQLite."
ps = RENDER / 'voice.ps1'
ps.write_text("Add-Type -AssemblyName System.Speech\n$s = New-Object System.Speech.Synthesis.SpeechSynthesizer\n$s.Rate = -1\n$s.Volume = 92\n$s.SetOutputToWaveFile('" + str(narration).replace('\\','\\\\') + "')\n$s.Speak(@'\n" + text + "\n'@)\n$s.Dispose()\n", encoding='utf-8')
subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(ps)], check=True)

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
final = OUT / 'final.mp4'
cmd = [ffmpeg, '-y', '-i', str(silent), '-i', str(narration), '-i', str(ambient), '-filter_complex',
       '[1:a]apad=pad_dur=120[voice];[2:a]volume=0.30[music];[voice][music]amix=inputs=2:duration=first:weights=1 0.25[a]',
       '-map','0:v','-map','[a]','-t',str(sum(s[1] for s in SCENES)), '-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','19','-r','30','-c:a','aac','-b:a','160k',str(final)]
subprocess.run(cmd, check=True)
shutil.copy2(final, OUT / 'preview.mp4')

# Thumbnail from the hero capture, using the exact visual language of the video.
thumb = prepare(SHOTS / '09-closing-twin.png')
thumb = overlay(thumb, 'IRON ORE CONVEYOR', 'DIGITAL TWIN', 'Real-time HMI · Simulation · Predictive maintenance', 1)
cv2.imwrite(str(OUT / 'final-thumbnail.png'), thumb)

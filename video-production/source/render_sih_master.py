"""Video-first, no-voiceover SIH master.

Every application scene in the resulting master is a continuous Playwright
recording found under video-production/raw. Only the black technical cards are
synthetic; the final frame is real moving Digital Twin footage.
"""
from pathlib import Path
import subprocess, wave, math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(r"D:\sih 2026\conveyor-digital-twin")
RAW = ROOT / "video-production" / "raw"
EDITED = ROOT / "video-production" / "edited"
SCENES = ROOT / "video-production" / "scenes"
AUDIO = ROOT / "video-production" / "audio"
OUT = ROOT / "demo-video"
for folder in (EDITED, SCENES, AUDIO, OUT): folder.mkdir(parents=True, exist_ok=True)

W, H, FPS = 1920, 1080, 60
FF = imageio_ffmpeg.get_ffmpeg_exe()
FONT = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"

def f(size, bold=True): return ImageFont.truetype(FONT if bold else FONT_REG, size)

def card(name, seconds, kicker, title, subtitle, nodes=None, proposed=False):
    out = SCENES / f"{name}.mp4"
    writer = cv2.VideoWriter(str(out), cv2.VideoWriter_fourcc(*"avc1"), FPS, (W,H))
    if not writer.isOpened():
        writer = cv2.VideoWriter(str(out), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W,H))
    for frame in range(round(seconds*FPS)):
        t = frame / FPS
        fade = min(1, t/.55, max(0, (seconds-t)/.55))
        base = Image.new("RGB", (W,H), (8,12,20))
        d = ImageDraw.Draw(base)
        # restrained technical grid and cyan data line
        for x in range(0,W,160): d.line((x,0,x,H), fill=(12,24,34), width=1)
        for y in range(0,H,120): d.line((0,y,W,y), fill=(12,24,34), width=1)
        cx = int((t/seconds)*W)
        d.line((0, 240, cx, 240), fill=(0, 190, 205), width=2)
        alpha = int(255*fade)
        d.rectangle((102, 326, 112, 664), fill=(0, 220, 235))
        d.text((145, 330), kicker, fill=(0, 235, 255), font=f(27))
        d.text((145, 390), title, fill=(238, 247, 250), font=f(65))
        d.text((148, 485), subtitle, fill=(172, 196, 207), font=f(30, False))
        if proposed:
            d.rounded_rectangle((145, 585, 450, 635), 12, fill=(31, 22, 54), outline=(138, 43, 226), width=2)
            d.text((166, 595), "PROPOSED / NEXT PHASE", fill=(196, 151, 255), font=f(20))
        if nodes:
            x0, y0, gap = 160, 720, 330
            for i, node in enumerate(nodes):
                x=x0+i*gap
                d.rounded_rectangle((x,y0,x+250,y0+82), 14, fill=(13,27,37), outline=(0,188,208), width=2)
                d.text((x+22,y0+25), node, fill=(213,239,244), font=f(19))
                if i < len(nodes)-1:
                    d.line((x+250,y0+41,x+gap-12,y0+41), fill=(0,190,205), width=2)
                    d.polygon([(x+gap-12,y0+41),(x+gap-24,y0+34),(x+gap-24,y0+48)], fill=(0,190,205))
        writer.write(cv2.cvtColor(np.asarray(base), cv2.COLOR_RGB2BGR))
    writer.release()
    return out

hook = card("01-hook", 5, "SIH 2026", "INDUSTRIAL ASSET INTELLIGENCE", "From monitoring to predictive decision-making")
problem = card("02-problem", 7, "THE CHALLENGE", "DETECT  →  UNDERSTAND  →  RESPOND", "Industrial decisions need system context, not isolated signals.")
architecture = card("03-architecture", 10, "OUR SOLUTION", "ONE LIVE STATE ACROSS THE SYSTEM", "A real-time digital twin for intelligent asset monitoring.", ["TWIN ENGINE", "WEB SOCKET", "3D HMI", "ALARMS + ANALYTICS"])
scale = card("04-scale", 6, "DESIGNED TO SCALE", "FROM ONE ASSET TO PLANT CONTEXT", "A proposed deployment path for centralized decision support.", ["MULTIPLE ASSETS", "PLANT VIEW", "DECISION SUPPORT"], True)

def label_clip(src_name, out_name, top, bottom):
    src=RAW/src_name; out=EDITED/out_name
    # labels are overlays only; no real app pixels, values or state are modified.
    vf=("drawbox=x=70:y=70:w=620:h=92:color=0x080c14@0.82:t=fill,"
        "drawbox=x=70:y=70:w=7:h=92:color=0x00ddeb@1:t=fill,"
        f"drawtext=fontfile='{FONT.replace('\\','/')}':text='{top}':x=102:y=87:fontsize=26:fontcolor=0x00e8f4,"
        f"drawtext=fontfile='{FONT.replace('\\','/')}':text='{bottom}':x=102:y=118:fontsize=22:fontcolor=0xeaf6f8")
    subprocess.run([FF,'-y','-i',str(src),'-vf',vf,'-r','60','-an','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p',str(out)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    return out

clips = [
    hook, problem, architecture,
    label_clip('take1_hero_orbit.mp4','05-hero.mp4','LIVE PROTOTYPE','DIGITAL TWIN // C01'),
    label_clip('take2_low_tracking.mp4','06-normal.mp4','01 — NORMAL','LIVE SYSTEM STATE'),
    label_clip('take3_joint_j023.mp4','07-inspection.mp4','02 — INSPECT','JOINT J023 // HEALTH & RISK ANALYSIS'),
    label_clip('take5_misalignment.mp4','08-fault.mp4','03 — FAULT INJECTION','LIVE DETECTION AND ALARM STATE'),
    label_clip('take6_operator_stop.mp4','09-response.mp4','04 — RESPONSE','VALIDATED OPERATOR CONTROL'),
    label_clip('take4_motor_thermal.mp4','10-condition.mp4','CONDITION MONITORING','MOTOR STATUS IN THE LIVE TWIN'),
    label_clip('take7_analytics.mp4','11-analytics.mp4','ANALYTICS','LIVE TELEMETRY + JOINT HEALTH MATRIX'),
    scale,
    label_clip('take1_hero_orbit.mp4','13-closing.mp4','IRON ORE CONVEYOR DIGITAL TWIN','SMART INDIA HACKATHON 2026'),
]

# Keep the closing hero concise while retaining moving source footage.
closing = clips[-1]
trim_close = EDITED/'14-closing-trim.mp4'
subprocess.run([FF,'-y','-i',str(closing),'-t','6','-c','copy',str(trim_close)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
clips[-1] = trim_close

manifest = EDITED/'concat.txt'
manifest.write_text(''.join("file '"+str(x).replace('\\','/')+"'\n" for x in clips), encoding='utf-8')
silent = EDITED/'sih-master-silent.mp4'
subprocess.run([FF,'-y','-f','concat','-safe','0','-i',str(manifest),'-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-r','60',str(silent)],check=True)

# No voice: an original, non-vocal industrial bed with restrained event pulses.
cap=cv2.VideoCapture(str(silent)); duration=cap.get(cv2.CAP_PROP_FRAME_COUNT)/cap.get(cv2.CAP_PROP_FPS); cap.release()
sr=48000; t=np.arange(int(duration*sr))/sr
bed=.022*np.sin(2*np.pi*55*t)+.012*np.sin(2*np.pi*82.41*t)+.006*np.sin(2*np.pi*(210+.04*t)*t)
env=np.minimum(1,np.minimum(t/2,(duration-t)/3)); audio=bed*env
for event in (5, 22, 48, 60, 71, 91, duration-7):
    idx=int(event*sr); length=min(int(.22*sr),len(audio)-idx); u=np.arange(length)/sr
    audio[idx:idx+length] += .09*np.sin(2*np.pi*(135-80*u)*u)*np.exp(-12*u)
audio=np.int16(np.clip(audio,-.95,.95)*32767)
music=AUDIO/'industrial-bed.wav'
with wave.open(str(music),'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(audio.tobytes())

final=OUT/'final.mp4'; preview=OUT/'preview.mp4'
subprocess.run([FF,'-y','-i',str(silent),'-i',str(music),'-map','0:v','-map','1:a','-c:v','libx264','-preset','slow','-crf','15','-pix_fmt','yuv420p','-r','60','-c:a','aac','-b:a','192k','-movflags','+faststart',str(final)],check=True)
subprocess.run([FF,'-y','-i',str(final),'-c','copy',str(preview)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print(f'FINAL {final}\nDURATION {duration:.2f}')

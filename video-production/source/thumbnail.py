from pathlib import Path
import cv2
from PIL import Image, ImageDraw, ImageFont

root = Path(r"D:\sih 2026\conveyor-digital-twin")
img = cv2.imread(str(root / 'video-production' / 'screenshots' / '09-closing-twin.png'))
img = cv2.resize(img, (1920, 1080))
canvas = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).convert('RGBA')
shade = Image.new('RGBA', canvas.size, (0, 10, 18, 95))
canvas = Image.alpha_composite(canvas, shade)
d = ImageDraw.Draw(canvas)
bold = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 76)
small = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 30)
d.rectangle((76, 735, 94, 975), fill=(42, 202, 190, 255))
d.text((125, 748), 'IRON ORE CONVEYOR', font=small, fill=(78, 232, 211, 255))
d.text((125, 790), 'DIGITAL TWIN', font=bold, fill=(245, 252, 255, 255))
d.text((129, 886), 'Real-time HMI · Simulation · Predictive maintenance', font=small, fill=(205, 223, 232, 255))
canvas.convert('RGB').save(root / 'demo-video' / 'final-thumbnail.png', quality=95)

from pathlib import Path
import cv2
from PIL import Image, ImageDraw, ImageFont

root = Path(r"D:\sih 2026\conveyor-digital-twin")
frame = cv2.imread(str(root / 'video-production' / 'renders' / 'qc-sih-live.png'))
frame = cv2.resize(frame, (1920, 1080))
image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).convert('RGBA')
layer = Image.new('RGBA', image.size, (2, 8, 15, 115))
image = Image.alpha_composite(image, layer)
d = ImageDraw.Draw(image)
bold = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 68)
small = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 27)
d.rectangle((76, 770, 92, 1002), fill=(0, 220, 235, 255))
d.text((122, 776), 'LIVE PROTOTYPE', font=small, fill=(0, 235, 255, 255))
d.text((122, 820), 'CONVEYOR DIGITAL TWIN', font=bold, fill=(244, 250, 252, 255))
d.text((126, 910), 'Smart India Hackathon 2026', font=small, fill=(192, 215, 224, 255))
image.convert('RGB').save(root / 'demo-video' / 'final-thumbnail.png', quality=95)

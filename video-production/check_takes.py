import subprocess, os

video_dir = r"d:\sih 2026\conveyor-digital-twin\frontend\public\video"
for f in sorted(os.listdir(video_dir)):
    if f.endswith(".mp4"):
        p = os.path.join(video_dir, f)
        res = subprocess.run(
            f'npx remotion ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{p}"',
            shell=True,
            capture_output=True,
            text=True,
            cwd=r"d:\sih 2026\conveyor-digital-twin\frontend"
        )
        print(f, "->", res.stdout.strip())

# Selected Toolchain

## Tools and roles

| Tool | Role | Reference |
|---|---|---|
| Playwright Core | Real, high-resolution browser automation and video capture of the running local application | https://playwright.dev/docs/videos |
| Google Chrome | Local Chromium executable for the application capture context | Existing local installation |
| FFmpeg | Video-only assembly, title/callout overlays, music/SFX mix, 30 fps H.264/AAC master | https://ffmpeg.org/ |
| OpenCV/Pillow | QC frame extraction and thumbnail generation | Existing local Python environment |

## Installation / execution

`npm install --no-save playwright-core` was used in `frontend/`. The existing local Chrome executable is passed to Playwright. FFmpeg is supplied by `imageio-ffmpeg`.

## Reproducibility

1. Start FastAPI on port 8000 and Vite on port 3000.
2. Run the scripts under `video-production/source/record-*.mjs` to create real `.webm` application takes.
3. Assemble only those recordings with FFmpeg; no screenshot is used as a product scene.

## Fallback

If browser recording is unavailable, use Chrome DevTools capture or a system-level recorder while the local application is visibly running. Do not substitute screenshots.

## Known limitations

Playwright’s built-in recording uses a WebM/VP8 intermediate. The final master is re-encoded at 1920×1080, 30 fps, H.264/AAC. No cloud service, AI voice, or voiceover is used.

# Toolchain Evaluation

Research completed 2026-09-20. The decisive requirement is video-first demonstration of the real, running 3D application—not a screenshot or mockup pipeline.

| Candidate | Classification | Real-time capture (25%) | Cinematic motion (20%) | HD output (15%) | Codex fit (15%) | Programmatic edit (10%) | Browser automation (5%) | Audio/SFX (5%) | Maintainability (5%) | Decision |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Playwright + FFmpeg | **Video-first** | 25 | 13 | 15 | 15 | 8 | 5 | 4 | 5 | **90 / 100 — selected** |
| Remotion | Hybrid | 4 | 20 | 15 | 14 | 10 | 1 | 5 | 5 | 74 / 100 — optional overlay/editor layer |
| video-shotcraft | Hybrid / capture-dependent | 6 | 20 | 13 | 15 | 10 | 1 | 5 | 4 | 74 / 100 — not installed |
| UltraDemo | Screenshot-first / hybrid | 4 | 11 | 10 | 10 | 5 | 3 | 2 | 3 | 48 / 100 — rejected for product footage |

## Evidence and assessment

- [Playwright’s official video documentation](https://playwright.dev/docs/videos) confirms browser-context video recording, configurable output size, and that captures are finalized when the context closes. It directly supports the required live browser footage.
- [Remotion](https://www.remotion.dev/) is a React-based programmatic video and motion-graphics framework. It is well suited to non-product titles and repeatable graphical overlays, but does not itself prove the source footage is live; therefore it is not the capture source.
- [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) is Apache-2.0 and describes a Codex/Claude-compatible Remotion workflow with cinematic recipe cards. Its bundled product assets and 2.5D treatment make it valuable as a planning reference, but unsuitable as the primary visualizer under this brief’s no-screenshot rule.
- UltraDemo was evaluated as an application-demo candidate and not selected because its common workflow is capture/slide oriented rather than a guaranteed real-time 3D footage pipeline.

## Selection

**Playwright Core + local Chromium + FFmpeg** is the selected production toolchain. Playwright records native 1920×1080 browser video of the real local app; FFmpeg trims, joins, grades, overlays minimal factual labels, creates non-narrated sound design, and encodes the final H.264/AAC master.

This avoids external accounts, API keys, cloud rendering, and screenshot-derived application scenes.

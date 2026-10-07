# Aegis marketing film

A deterministic 30-second, 1920 × 1080 film at 30 fps. The native HTML composition uses real Aegis product captures, Figtree, dimensional camera transforms, restrained particles, and an original synthesized stereo score. No stock footage, licensed music, or image-generation assets are used.

## Storyboard

| Time        | Beat                            | Motion                                                    |
| ----------- | ------------------------------- | --------------------------------------------------------- |
| 0–4.4s      | Built for technical minds       | Masked typography reveal, slow optical push               |
| 3.65–9.65s  | Complexity, under control       | Product plane flies into perspective and settles          |
| 8.95–15.3s  | Every signal, a connected story | Table push, detached alert, layered context chips         |
| 14.6–20.8s  | From evidence to a next step    | Assistant panel and insight card move at different depths |
| 20.05–25.4s | Real components, room to build  | Code and actual component playground orbit into view      |
| 24.7–30s    | Build tools worth working in    | Quiet title lockup and clear call to action               |

## Reproduce

Run the app locally, then from the repository root:

```sh
node tools/marketing-video/capture.mjs
node tools/marketing-video/render.mjs --stills
python3 tools/marketing-video/soundtrack.py
AEGIS_FFMPEG=/absolute/path/to/ffmpeg node tools/marketing-video/render.mjs
```

Requires the project's installed Playwright, a Chromium browser, Python with NumPy, and FFmpeg with `libx264` and AAC support. `AEGIS_URL` can change the capture server. The render needs no running app after capture. Pass `--silent` for an independent silent render.

Captures and intermediate files are deliberately kept in the ignored `test-results/marketing-video` directory. The final film is `artifacts/marketing/aegis-launch.mp4`, alongside `poster.jpg`. The capture directory includes `manifest.json` and an encoder log. Fonts are copied from installed Fontsource packages; their licenses remain in those packages and in the Aegis font attribution.

`timeline.js` is a pure seekable timeline: call `window.renderFrame(seconds)` after `window.filmReady`. Frames do not depend on elapsed wall-clock time. Composition lives in `film.html` and `film.css`; the score is reproducible from its fixed seed in `soundtrack.py`.

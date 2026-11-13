# Marsway presentation video

`marsway-30s.mp4` is the rendered English presentation: 30 seconds, 1920 × 1080, 30 fps, H.264 video and AAC audio. `marsway-30s.srt` supplies optional closed captions; the demonstration also has readable on-screen captions.

The film uses an automated recording of the actual public website at https://zaplexes.github.io/Marsway/, captured November 13, 2026. No mocked network responses, invented interface screens or generated Mars footage were used. External detailed imagery was unavailable during capture; the app displayed its genuine retained MOC imagery and availability states. The recording shows this behavior faithfully.

The user approved the simulated Jezero base at 18.4446° N, 77.4509° E. The comparison shows preference-based scores, an interest adjustment, the Belva evidence workspace, and a 9.01 km minimum round-trip distance. Neither terrain suitability nor a traversable route is established. The website remains the source of scientific provenance and imagery attribution; provider attribution is retained in the footage.

English narration is AI-generated using the `en-US-GuyNeural` voice through edge-tts 7.3.1. The quiet ambient bed is original procedural synthesis from sine tones; it uses no external music recording. Interface magnification, framing and fades are conventional editing effects. The closing card uses the repository's existing AI-generated Marsway logo and discloses both the narration and logo's AI origin. The app demonstration is actual recorded browser footage.

## Reproduce

Run commands from the repository root. Use the repository's installed Playwright dependency and browser. Video editing requires FFmpeg 8 or compatible, Python 3.14, NumPy 2.5.4, Pillow 12.3.0 and the Noto Sans regular/bold fonts at the paths in `production/render.py`. Speech generation additionally requires edge-tts 7.3.1 and internet access. Browser recording requires network and browser-process permissions.

```bash
node artifacts/marsway-video/production/capture.mjs
/tmp/marsway-video-venv/bin/python artifacts/marsway-video/production/narrate.py
python3 artifacts/marsway-video/production/render.py
```

The temporary speech environment was created with `uv venv /tmp/marsway-video-venv`, followed by `uv pip install --python /tmp/marsway-video-venv/bin/python edge-tts==7.3.1`. Existing project dependencies were used without changing the application package manifest. Raw captures and intermediate shots remain in `raw/` and `production/` for review and editing; these are production artifacts, not application assets.

The video is a local deliverable. It has not been uploaded or submitted. A public video-hosting link remains necessary for the competition submission. Current organizer requirements were supplied by the user, not independently reverified during this production.

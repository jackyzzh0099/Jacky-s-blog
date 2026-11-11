---
title: "prism"
summary: "A keyboard-driven culling tool for photographers. Reads RAW sidecars, ranks by sharpness, and never uploads anything."
date: "2026-06-22"
status: "active"
stack:
  - TypeScript
  - Rust
  - Tauri
  - libraw
cover: "/covers/prism.svg"
repo: "https://github.com/jacky/prism"
demo: "https://prism.jacky.dev"
featured: true
order: 3
---

Culling a shoot of twelve hundred frames should take twenty minutes. In most tools it takes two hours, because they optimise for editing rather than deciding.

`prism` does one thing: help you go from 1200 frames to 80 keepers, fast, with your hands on the keyboard.

## How it works

- **Ingest** — reads the folder, parses EXIF, generates a 1600 px preview per frame in parallel.
- **Score** — an FFT-based sharpness metric per frame, normalised within the burst so that a soft but atmospheric shot is not punished for being soft.
- **Group** — frames within two seconds and similar framing collapse into a stack; one keyboard action keeps the sharpest.
- **Decide** — `1` keep, `2` reject, `3` maybe, `space` next. Every action is undoable and written to a sidecar, never to the original file.

```text
 ingest ──► score ──► group ──► decide ──► export list
   │                              │
   └── previews on disk           └── XMP sidecar, non-destructive
```

## Design notes

The previews live in a cache directory keyed by file hash, so re-opening a shoot is instant. Scoring runs on a thread pool sized to physical cores, and the UI never blocks on I/O — a culling session over a slow USB drive still responds at 60 fps.

No cloud, no account, no telemetry. The binary is 9 MB and runs offline.

## Status

Used for every shoot I have edited since March. Burst grouping is good enough; the "similar framing" heuristic still over-groups when the subject moves.

- [x] RAW + JPEG ingest
- [x] Sharpness scoring with per-burst normalisation
- [x] Non-destructive XMP sidecars
- [x] Keyboard-first UI
- [ ] Focus-peaking overlay on preview
- [ ] Contact-sheet PDF export

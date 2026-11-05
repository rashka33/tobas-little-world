# Toba’s Little World

An original, gentle family game for Toba, made with vanilla HTML, CSS, JavaScript and inline SVG. Geri the giraffe hosts the garden; Hippo is the only dentist patient. No build step, dependencies, accounts, ads, tracking, API keys or external game assets. Not offered for sale or distribution.

## Play

- Choose the big tooth doorway to play **Happy Smile Dentist**. The pencil doorway opens the existing [Coloring World](https://rashka33.github.io/tobas-coloring-world/) on the same origin.
- Tap **Let’s play**, then pick up the toothbrush and rub the teeth. Dirt fades only where the touch path reaches it; waiting does not clean anything. Repeated touches also help.
- Tap the grey, sleepy tooth to repair it. The star is an optional visual tool.
- Drag each shape onto its matching faint shape on a tooth. Or tap a shape, then tap its matching tooth. Near misses snap generously; wrong drops float back.
- Celebrate, collect a sticker, and choose **Play again** or **Home**. Five original shape stickers can be collected over repeat visits. Completing a run awards at most one new sticker.
- The speaker repeats the current guidance. Home is always available. After about eight idle seconds, a hand and movement cue offer help.

Hold the lock for **two seconds** to open grown-up settings (keyboard: hold Space or Enter). Sound/voice, music, reduced motion and language settings are saved on this device. Reset stickers requires a second tap. All saved data uses localStorage key `tobas-little-world:v1`; blocked storage falls back to the current session.

English guidance uses the device’s built-in speech synthesis. Every line is in the single `STRINGS` dictionary with an empty `so` field. Somali is explicitly recordings-only and remains silent until a future recording implementation is added. The app never synthesizes Somali. Available English voices, offline speech and mute-switch behavior depend on the device. Sound effects and music use only Web Audio oscillators and generated filtered noise; there are no audio files.

## Run locally

Serve the repository root, for example:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. A local HTTP server or HTTPS is needed for service workers; opening `index.html` as a file does not enable offline caching.

## Review and publish — Muse

The source is ready for GitHub Pages from the repository root. Publishing is intentionally left to Muse.

1. Review and merge the game files into the repository’s publishing branch.
2. In **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, that branch, and **/ (root)**. No workflow or build is needed. `.nojekyll` disables Jekyll processing.
3. Visit `https://rashka33.github.io/tobas-little-world/` online once. Wait for the first page to finish loading before trying an offline reload.
4. On iPad Safari, choose **Share → Add to Home Screen**. The app has standalone display metadata, local PNG icons and an Apple touch icon. Both landscape and portrait layouts are supported.

GitHub Pages is ordinarily publicly reachable even when a game is intended only for family use. This static app contains no family photographs, personal records or access-control system.

The service worker’s scope and cache namespace are limited to this game. It never intercepts or caches the sibling coloring app; that app needs its own offline setup. The worker precaches the entire local app shell, serves cached navigation when offline, and leaves a new worker waiting until existing game tabs close. Increment the cache version in `sw.js` whenever shipping changed assets. Offline support is available after a successful first cache installation, subject to browser storage retention.

## Files

- `index.html`, `styles.css`, `app.js`: game shell, responsive styles, original SVG illustrations, state machine, pointer interactions, localization, synthesis and persistence.
- `sw.js`, `manifest.webmanifest`: offline shell and installation metadata.
- `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`: original Geri installation icon; PNGs rendered from the SVG.

## Validation

See `QA.md` for the actual checks and remaining device checks. No physical iPad testing has been performed.

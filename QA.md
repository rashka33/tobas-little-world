# v1 verification — 5 November 2026

Checked locally in headless Chromium through Playwright, using an HTTP server at the repository root. No physical iPad testing was performed.

## Exercised in the browser

- Full welcome → cleaning → repair → braces → celebration playthrough using pointer events.
- Dirt fades progressively at contact coordinates. A pointer path outside the teeth leaves dirt unchanged. Holding a stationary brush does not keep cleaning. Sweeping the visible dirt completes cleaning.
- Correct grey tooth repair reaches braces.
- Wrong brace drag returns to its tray; correct drag snaps; remaining pieces can be finished by tap-piece / tap-target.
- Two simultaneous touch contacts sent through Chromium’s touch input: the second finger does not interrupt the first finger’s successful brace drag.
- Rapid repeated completion calls award one sticker. Replay clears dirt, placed pieces and the per-run award guard.
- Home during a pending stage transition cancels that transition; no delayed activity appears over home.
- Actual two-second pointer hold opens settings. Music and reduced-motion settings survive a reload.
- Service worker installs, controls the page, and a browser-context offline reload renders the playable home screen from cache.
- Idle hand hint appears after about eight seconds.
- Stopping audio empties the set of active/scheduled oscillator and noise sources.
- Somali selection leaves speech synthesis silent.
- Simulated document visibility events (overriding the visibility property in the test) stop audio and scene timers, pause CSS animation, and recover an interrupted stage transition on resume. This is a simulation, not a physical background/foreground device check.
- Portrait at 390 × 844: all five SVG tooth hit regions measure at least 64 × 64 CSS pixels. Landscape screenshots checked at 1180 × 820, plus a 1024 × 768 touch session.
- Full playthrough and offline-reload run reported zero page JavaScript errors. `node --check` passes for `app.js` and `sw.js`.

## Inspected in source and screenshots

- Original inline SVG characters, tools, doors and shapes; local original installation icons. No emoji artwork, external fonts, media, audio files, analytics or game network dependencies.
- All guidance is selected from the central `STRINGS` dictionary; every entry has an empty `so` field.
- Music, pop, whoosh, stage chime, scrub and sparkle are synthesized with Web Audio.
- Versioned local save key; deduplicated sticker IDs; separate sound/music settings and reduced-motion support.
- Scoped service worker excludes the sibling coloring path and does not delete that app’s caches. Coloring doorway preserves the supplied same-origin absolute URL.
- Landscape home, cleaning, celebration, portrait home and portrait dentist screenshots inspected. Installation icon inspected.

## Still to check on an iPad

- Safari installation / home-screen launch, real offline reload after installation, browser storage eviction behavior.
- Actual voice availability, English voice quality and offline speech, audible music/effect mix, hardware mute switch and first-touch audio unlocking.
- Real app background/foreground behavior, finger comfort, edge gestures and perceived feedback latency.
- Live GitHub Pages deployment and the destination coloring app were not exercised. Muse remains reviewer/publisher; these local changes were not pushed or published.

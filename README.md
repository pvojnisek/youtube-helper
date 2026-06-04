# YouTube Helper

A personal [userscript](https://en.wikipedia.org/wiki/Userscript) that adds
quality-of-life features to YouTube. Built one step at a time.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

### 1. Keyboard-layout-independent playback speed

YouTube's built-in speed shortcuts are bound to the `<` / `>` **characters**
(`Shift`+`,` / `Shift`+`.` on a US keyboard). On non-US layouts — e.g. Hungarian
QWERTZ — those key combos produce *different* characters (`?`, `:`), so the
shortcut silently does nothing. Worse, `Shift`+`,` emits `?`, which is YouTube's
own shortcut for the **help overlay** — so the "slow down" muscle memory pops up
the help dialog instead.

This feature binds to the **physical key** (`event.code`) instead of the
character, so it works regardless of keyboard layout:

| Shortcut         | Action            |
| ---------------- | ----------------- |
| `Shift` + `,`    | Slow down (−0.25×) |
| `Shift` + `.`    | Speed up (+0.25×)  |
| `Shift` + `0`    | Reset to 1×        |
| `Shift` + `S`    | Open/close settings panel |

A small on-screen toast shows the current rate. The handler runs in the capture
phase and swallows the event before YouTube's own handler, so the help overlay no
longer pops up, while the plain (un-shifted) `,` / `.` frame-stepping still works.

### 2. Settings panel

Press `Shift`+`S` (or click the toolbar gear) to open a small in-page settings
panel. Settings apply **live** — there's no Save button. A slider sets the
**maximum playback speed** (range 2–5×); the value updates as you drag and is
saved when you release it. A grouped list of checkboxes toggles **Hide Shorts**
and the end-of-video overlays instantly. Dismiss the panel with the ✕ in its
top-right corner (or `Esc`). All settings are stored
in `localStorage`, so they persist across sessions and work under any userscript
manager — no `GM_*` APIs are used, which keeps the script manager-independent.

### 3. Hide Shorts everywhere

Don't want to see YouTube Shorts? This option (on by default) removes them across
the whole interface — the home and Subscriptions feed shelves, search results,
grid tiles, and the **Shorts** entries in the left sidebar — so no Shorts links or
recommendations remain. Toggle it any time with the **Hide Shorts everywhere**
checkbox in the settings panel.

It works by injecting one stylesheet that hides every Shorts surface (gated on a
root attribute, so flipping the checkbox switches it instantly), targeting
YouTube's component element names rather than fragile CSS classes. Because CSS
can't act on the dedicated `/shorts/<id>` player page, that URL is redirected to
the normal watch page (`/watch?v=<id>`) — so a Short you open from an external
link still plays, just in the standard player.

### 4. Hide end-of-video suggestions

The clickable suggestions a creator adds to the **last few seconds** of a video —
which slide over the picture and push their other videos — can be hidden, along
with the related end-of-video overlays. Three independent toggles in the settings
panel (all on by default) control:

| Toggle | What it removes |
| ------ | --------------- |
| **Hide end-screen cards** | The creator's clickable cards overlaying the last ~5–20 s (`.ytp-ce-element`) |
| **Hide end-screen grid** | The "more videos" grid that fills the player when a video ends (`.ytp-endscreen-content`) |
| **Hide info cards** | The `i` teaser/button that pops up mid-video (`.ytp-cards-teaser`) |

These live in the player's light DOM, so they're hidden with the same
attribute-gated stylesheet as Shorts (one root attribute per toggle) — no polling,
instant on/off.

## Roadmap

- [x] Keyboard-layout-independent playback speed
- [x] In-page settings panel (configurable max speed), Liquid Glass styled
- [x] Toolbar gear button, draggable panel, open animation
- [x] Hide Shorts everywhere (toggle), with `/shorts/` → `/watch` redirect
- [x] Hide end-of-video suggestions (end cards, end-screen grid, info cards)
- [ ] More features — one step at a time

### Deferred / ideas

- Close the settings panel on outside-click (deferred by choice for now; `Esc`
  and the **✕** button already close it).
- SVG-based Liquid Glass refraction layer for the panel (see
  [`ai-knowledge/`](ai-knowledge/)).
- SPA-friendly Shorts redirect. Cold loads of `/shorts/<id>` redirect cleanly,
  but redirecting on in-app `yt-navigate-finish` triggers a full document reload
  instead of a soft SPA transition. A `history.replaceState`-based approach would
  be smoother but is fragile against YouTube internals — deferred until it's worth
  the regression risk.
- Replace the 1s `setInterval` that re-injects the toolbar gear with a debounced
  `MutationObserver` on the masthead (more event-driven, but the masthead mutates
  often, so it needs careful debouncing to not be worse than the cheap poll).

## Installation

> Not published online yet — local development for now.

Recommended userscript manager: **[Violentmonkey](https://violentmonkey.github.io/)**
(MIT, open source). Tampermonkey also works but is proprietary.

### Local (current workflow)

1. Install Violentmonkey in your browser.
2. **Chromium / Brave (Manifest V3):** enable userscripts —
   `brave://extensions` → Violentmonkey → **Details** → turn on
   **Allow user scripts** (Chrome/Brave 138+). On older versions, enable
   **Developer mode** on the extensions page instead.
3. Load the script: open `youtube-helper.user.js` in the browser to get the
   install prompt, or paste its contents into a new script in the Violentmonkey
   dashboard, then save.

### Auto-update (future)

Once the project is published to a Git host, add `@downloadURL` and `@updateURL`
to the metadata block (pointing at the raw `youtube-helper.user.js`) and bump
`@version` on every change — Violentmonkey then auto-updates. GitHub raw URLs give
timely update checks; jsDelivr gives a more robust CDN but caches branch URLs
longer.

## Development

Single-file userscript — no build step. Edit `youtube-helper.user.js` directly.

See [`ai-knowledge/`](ai-knowledge/) for design principles, conventions, and
domain notes (useful for both humans and AI agents).

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):
bump `@version` (`MAJOR.MINOR.PATCH`) on each change and record it in
[`CHANGELOG.md`](CHANGELOG.md). During initial development the version stays in
the `0.y.z` range.

## Credits

The keyboard-driven, layout-independent approach to playback-speed control is
inspired by **[Video Speed Controller](https://github.com/igrigorik/videospeed)**
(MIT) by Ilya Grigorik. This project does not reuse its code — it credits the idea.

## License

[MIT](LICENSE) © 2026 Peter Vojnisek

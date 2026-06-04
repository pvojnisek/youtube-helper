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

Press `Shift`+`S` to open a small in-page settings panel where you can change the
**maximum playback speed** (default 5×, capped at 16×). The value is stored in
`localStorage`, so it persists across sessions and works under any userscript
manager — no `GM_*` APIs are used, which keeps the script manager-independent.

## Roadmap

- [x] Keyboard-layout-independent playback speed
- [x] In-page settings panel (configurable max speed), Liquid Glass styled
- [x] Toolbar gear button, draggable panel, open animation
- [ ] More features — one step at a time

### Deferred / ideas

- Close the settings panel on outside-click (deferred by choice for now; `Esc`
  and the **Cancel** button already close it).
- SVG-based Liquid Glass refraction layer for the panel (see
  [`ai-knowledge/`](ai-knowledge/)).

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

# AI Knowledge — YouTube Helper

Project-scoped knowledge base for AI agents (and humans) working on this
repository. Read this before changing code, so contributions stay consistent
with the project's design.

> ⚠️ **Public repository.** Keep every file in this folder free of secrets and
> personal data: no credentials, tokens, private URLs, machine details, IP
> addresses, or personal information. Only shareable, project-relevant knowledge.

## What this project is

A single-file [userscript](https://en.wikipedia.org/wiki/Userscript) that adds
quality-of-life features to YouTube, built incrementally — one feature at a time.
See [`../README.md`](../README.md) for the user-facing overview and
[`../CHANGELOG.md`](../CHANGELOG.md) for history.

## Core design principles

1. **Bind to physical keys, not characters.** Use `event.code` (physical key
   position, e.g. `Comma`, `Period`, `Digit0`) — never `event.key` (the produced
   character). This is what makes shortcuts work on any keyboard layout. See the
   domain note below for why.
2. **Preempt the page's own handlers.** Register listeners on `window` in the
   **capture phase** (`addEventListener(..., true)`) and call `preventDefault()` +
   `stopImmediatePropagation()` when a shortcut is handled, so YouTube's built-in
   keys (e.g. `?` = help) don't also fire.
3. **No build step.** One `.user.js` file, `@grant none`, vanilla DOM APIs only.
   Anyone can read the shipped source directly — keep it that way unless there's a
   strong reason to add tooling.
4. **One IIFE, clearly delimited feature sections.** Each feature lives under a
   `// === Feature N: <name> ===` banner inside the single IIFE, so features stay
   readable and independent as the script grows.
5. **Be a good keyboard citizen.** Ignore events when typing in inputs
   (`INPUT`/`TEXTAREA`/`SELECT`/`contenteditable`), and bail out when unexpected
   modifiers (`alt`/`ctrl`/`meta`) are held.
6. **Build DOM nodes, never assign `innerHTML`.** YouTube enforces a Trusted
   Types CSP (`require-trusted-types-for 'script'`), so `element.innerHTML = "…"`
   throws *"This document requires 'TrustedHTML' assignment"* and silently breaks
   the feature. Construct UI with `document.createElement` + `textContent` +
   `appendChild` instead (see the settings panel). Reading via `querySelector` is
   fine; only string-to-HTML assignment is blocked. Inline `element.style.cssText`
   is allowed.

## Domain note: why keyboard layout matters

This is the bug the project's first feature fixes, and a reusable lesson.

Many web apps bind keyboard shortcuts to the **character** a key produces
(`event.key`). YouTube's playback-speed shortcuts are bound to the `<` / `>`
characters, which a US layout puts on `Shift`+`,` / `Shift`+`.`. On non-US
layouts (QWERTZ, AZERTY, etc.) those same physical keys produce *different*
characters, so the shortcut silently fails — and the produced character may even
trigger an *unrelated* shortcut (e.g. `?` opens YouTube's help overlay).

**Rule of thumb:** if a shortcut should follow the *key position* (like media
controls), bind to `event.code`. Only bind to `event.key` when you genuinely mean
"the character the user typed". When diagnosing a "shortcut doesn't work on my
keyboard" report, first check whether the app is character-bound.

## UI: Liquid Glass styling

The settings panel and toast approximate Apple's **Liquid Glass** material
(introduced at WWDC 2025; iOS/macOS 26) with pure CSS — no images, no SVG:

- **Frosted translucency:** `backdrop-filter: blur(24px) saturate(180%)` (with the
  `-webkit-` prefix) over a translucent fill, so the video behind shows through,
  blurred and colour-boosted.
- **Dark-tinted glass** (`linear-gradient(135deg, rgba(70,70,80,.5),
  rgba(30,30,38,.55))`) rather than light glass: keeps white text legible over
  bright video frames — the known weak spot of glass UIs (variable contrast).
- **Rim highlight + depth:** `inset 0 1px 0 rgba(255,255,255,.5)` for the lit top
  edge, a soft outer `box-shadow` for separation, large `border-radius` (24px
  panel, 999px pill buttons), and `text-shadow` for legibility.
- **Hover** uses JS inline-style toggling (`hoverable()`), not a stylesheet, to
  avoid injecting a `<style>` (stays within YouTube's CSP / Trusted Types — see
  principle 6). All nodes are built with `createElement` + `style.cssText`.

**Future (optional): SVG refraction.** The signature *liquid* distortion and
specular ripple of real Liquid Glass needs an SVG filter layer (`feTurbulence` +
`feDisplacementMap` + `feSpecularLighting`) composited over the `backdrop-filter`.
More authentic but heavier and trickier; the current backdrop-blur version is the
clean, performant approximation. Add it behind a flag if/when desired.

Sources: [CSS-Tricks — Getting clarity on Apple's Liquid Glass](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/),
[Liquid Glass with CSS + SVG (dev.to)](https://dev.to/fabiosleal/how-to-create-the-apple-liquid-glass-effect-with-css-and-svg-2o06).

## Conventions

- **Versioning:** [Semantic Versioning](https://semver.org/spec/v2.0.0.html);
  stays in `0.y.z` during initial development. Bump the userscript's `@version` on
  every change — userscript managers only auto-update when `@version` increases.
- **Changelog:** [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
  in `CHANGELOG.md`; add an entry for every user-visible change.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/),
  English, imperative, lowercase subject.

## Adding a feature (recipe)

1. Add a new `// === Feature N: <name> ===` section in `youtube-helper.user.js`.
2. Follow the core principles above (physical keys, capture phase, input guard).
3. Update `README.md` (feature table / roadmap) and `CHANGELOG.md`.
4. Bump `@version`.

## Local development (live reload)

No build step — edit `youtube-helper.user.js` and see changes in the browser
without re-installing each time:

1. **Serve the repo over localhost** (Python stdlib — nothing to install), run
   from the project directory:
   `python3 -m http.server 8080 --bind 127.0.0.1`
2. **Install [Violentmonkey](https://violentmonkey.github.io/)** (MIT). On
   Chromium / Brave 138+, enable it: `<browser>://extensions` → Violentmonkey →
   *Details* → **Allow user scripts** (an MV3 requirement; Developer mode alone is
   often not enough).
3. **Track the file:** open `http://127.0.0.1:8080/youtube-helper.user.js` in the
   browser; on Violentmonkey's install page click **Track external edits** and
   keep that tab open. Every save then reinstalls the script automatically (no
   `@version` bump needed for tracking).
4. **Test:** reload the YouTube tab — an already-open page keeps the old version.

Notes:
- Don't drag-and-drop the `.user.js` onto a Violentmonkey page: in Chromium that
  tends to trigger a *download* prompt instead of installing. The localhost route
  is the reliable one (and avoids the risky "Allow access to file URLs").
- Quick sanity check before reloading: `node --check youtube-helper.user.js`.
- The file is served from disk, so editing in any editor works.

## Testing

Manual, since there's no build/test harness:

1. Load the script in a userscript manager (Violentmonkey recommended — MIT).
2. Open a YouTube video and exercise the shortcuts.
3. Confirm the script does **not** interfere with plain (un-shifted) keys or with
   typing in inputs (search box, comments).

**Diagnosing key events.** To see exactly what the browser reports for a key,
paste this in the DevTools console and press the keys:

```js
addEventListener('keydown', e => console.log(
  'key=' + JSON.stringify(e.key), 'code=' + e.code,
  'shift=' + e.shiftKey, 'alt=' + e.altKey, 'ctrl=' + e.ctrlKey), true);
```

Compare `code` (physical, layout-independent) with `key` (character,
layout-dependent) — the gap between them is the whole reason this project exists.

## Future: auto-update

When published, add `@downloadURL` and `@updateURL` (pointing at the raw
`youtube-helper.user.js`) to the metadata block. Managers periodically re-fetch
`@updateURL`, compare `@version`, and pull `@downloadURL` when it's newer. A
`.meta.js` (metadata block only) can serve as a lightweight `@updateURL`.

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

## Reusable implementation patterns

Several features now share the same shapes — prefer these for new work instead of
re-deriving:

1. **Attribute-gated stylesheet (declarative hiding).** Inject one `<style>` whose
   rules are gated on a root attribute —
   `html[data-ythelper-…] <selector> { display:none !important }` — then
   `toggleAttribute` to switch the whole rule set on/off at once. `display:none`
   auto-covers nodes YouTube's SPA adds later, so no polling / MutationObserver.
   Used by **hide Shorts**, **end-of-video overlays**, and **hover preview**. (A
   `<style>` built with `createElement` + `textContent` is Trusted-Types-safe — see
   the Shorts note.)
2. **Live-applying settings toggles.** Each panel toggle flips `config` and calls an
   `apply*()` that sets the attribute(s); it saves to `localStorage` and shows a
   toast — no Save/Cancel. Toggles are built from a data list and re-synced from
   config on open (`refreshToggles`), rendered as a Liquid-Glass grouped list.
3. **Behaviour CSS can't express** (auto-start suppression, the `/shorts/`→`/watch`
   redirect) → a **capture-phase listener at `document`/`window` level**, re-armed on
   `yt-navigate-finish` (YouTube's SPA "navigation done" event) and at load.

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

## Domain note: hiding Shorts across YouTube's surfaces

Shorts are not one thing — they surface as many *different* custom elements, so a
single selector never covers them. The durable approach (used by Feature 3):

- **Target component element names, not CSS classes.** `ytd-reel-shelf-renderer`,
  `ytd-rich-section-renderer`, `ytd-guide-entry-renderer`, etc. are far more stable
  across YouTube updates than generated class names. Add `:has(a[href^="/shorts"])`
  to also catch the *wrapper* row around a shelf/tile so the whole block disappears,
  not just the inner link.
- **Hidden via the attribute-gated stylesheet** (see *Reusable implementation
  patterns* above) — like uBlock's cosmetic filters, and far better than the common
  `setInterval(removeShorts, 1000)` scripts that flicker and waste cycles.
- **CSS can't reach the `/shorts/<id>` player page.** Handle it in JS: redirect to
  `/watch?v=<id>` on load *and* on `yt-navigate-finish` (YouTube's SPA "navigation
  done" event), so a Short opened from an external link plays in the normal player.
- **Surfaces to cover:** left sidebar (full + mini guide), home/Subscriptions
  shelves and their section wrappers, individual grid/search/related tiles, the
  newer lit `*-view-model` elements, and the channel-page "Shorts" tab (text-based,
  so its attribute selector is the brittle one — verify it in-browser).

**On injecting a `<style>` (re: principle 6):** building a `<style>` element with
`createElement` + `textContent` is **not** a Trusted Types violation — Trusted Types
(`require-trusted-types-for 'script'`) only governs *script* sinks like `innerHTML`,
not stylesheet text. Earlier features avoided a stylesheet by *stylistic choice*
(hover via inline styles), not because one is blocked. A `<style>` is the right tool
when you must hide many dynamic nodes declaratively.

## Domain note: end-of-video overlays live in the player's light DOM

The HTML5 player's overlays — creator **end-screen cards** (`.ytp-ce-element`,
the suggestions that cover the last seconds), the **end-screen grid**
(`.ytp-endscreen-content`), and **info cards** (`.ytp-cards-teaser` /
`.ytp-cards-button`) — are plain **light-DOM** nodes inside `#movie_player`, **not**
shadow DOM. *That* is why the attribute-gated stylesheet (see *Reusable
implementation patterns*) can hide them — no per-frame JS, no timing against the
"last 20 seconds." `.ytp-ce-element` is the parent card container, so hiding it
removes the whole card (image, shadows, title) without the sub-classes.

Keep these distinct (each got its own toggle): end **cards** overlay mid-playback;
the end **grid** only fills the player once the video ends; **info cards** are the
`i` teaser. Class names prefixed `ytp-` are the player's own and have been stable
for years — more reliable than the `ytd-*` feed renderers.

## Domain note: "autoplay" is two things; suppressing the current video

YouTube's player **Autoplay** switch only controls **auto-advance** (whether the
*next* video plays). Stopping the **current** video from auto-starting when you
open a watch page is a separate, unexposed problem: you must pause the `<video>`
yourself. The robust way (Feature 5) is a **capture-phase `play` listener on
`document`** — media events like `play` don't bubble, but the capture phase still
delivers them — which calls `pause()` while suppression is armed. Arm it on
`yt-navigate-finish` + initial load for `/watch`; **disarm on a genuine user
gesture** (pointerdown on `#movie_player`, or Space/K) so manual play still works.
Don't pause from the settings toggle itself — only change config, so you never
yank the video the user is already watching (it applies to the next one opened).

## Domain note: the hover-preview is one shared element

The muted preview that plays when you hover a thumbnail in a list comes from a
**single shared `ytd-video-preview` element** that YouTube reparents into the
hovered thumbnail — not a per-tile player. So hiding that one element (Feature 6,
attribute-gated CSS) stops the preview everywhere with one rule. The video may
still load muted behind the hidden element, but it's invisible and silent;
blocking it at the network level would need JS, which isn't worth it here.

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
2. **Track the file:** with Violentmonkey installed (see
   [Installation](../README.md#installation) for the manager + the *Allow user
   scripts* step), open `http://127.0.0.1:8080/youtube-helper.user.js` and — on its
   install page — click **Track external edits** (not the normal install). Keep that
   tab open: every save then reinstalls the script automatically, no `@version` bump
   needed.
3. **Test:** reload the YouTube tab — an already-open page keeps the old version.

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

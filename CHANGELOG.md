# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] - 2026-06-05

### Added
- Block the hover-preview that auto-plays when you point at a thumbnail in a list
  (toggle in the settings panel, on by default). YouTube's shared inline preview
  player (`ytd-video-preview`) is hidden via the same attribute-gated stylesheet as
  the other options, so no muted preview plays over thumbnails on hover.

## [0.6.0] - 2026-06-05

### Added
- Option to stop opened videos from auto-starting (toggle in the settings panel,
  on by default = videos still auto-play). When off, a watch-page video loads
  **paused**: a capture-phase `play` listener pauses it until you start playback
  with a click or `Space`/`K`. Takes effect on the next video opened, so it never
  pauses the video you're already watching. Note this is the *current* video —
  distinct from the player's "Autoplay" switch (which only auto-advances to the
  *next* video).

## [0.5.1] - 2026-06-05

### Fixed
- Opening the settings panel no longer focuses the slider, which drew an unwanted
  focus ring around it. The panel now opens with no active control (Esc still
  closes it, via the window listener).

## [0.5.0] - 2026-06-05

### Added
- Hide the end-of-video suggestion overlays, each with its own toggle in the
  settings panel (all on by default): end-screen **cards** (the creator's
  clickable suggestions that cover the last seconds, `.ytp-ce-element`), the
  end-screen **grid** shown when a video ends (`.ytp-endscreen-content`), and
  **info cards** (the "i" teaser, `.ytp-cards-teaser` / `.ytp-cards-button`).
  Hidden via the same attribute-gated stylesheet as Shorts — one independent root
  attribute per toggle.

### Changed
- The settings panel's on/off options are now grouped into one Liquid-Glass inset
  list (translucent fill, rim highlight, hairline-separated rows; label on the
  left, checkbox on the right).

## [0.4.1] - 2026-06-04

### Fixed
- `Esc` now closes the settings panel regardless of where focus is (previously it
  only worked while a panel control was focused). Handled on the window listener.

### Changed
- `Enter` no longer closes the settings panel (it was a surprising accidental
  close); use `Esc`, the ✕, or the gear.

## [0.4.0] - 2026-06-04

### Changed
- Reworked the settings panel to apply changes live — no more Save/Cancel.
  The maximum playback rate is now a slider (range 2–5×); its value updates in
  the panel while dragging and is persisted when you release it. The panel is
  dismissed with an ✕ in the top-right corner (Esc and the gear still close it).

## [0.3.0] - 2026-06-04

### Added
- Hide Shorts everywhere on YouTube (on by default), toggleable with a checkbox
  in the settings panel. A single injected stylesheet — gated on a root attribute
  (`html[data-ythelper-hideshorts]`) — hides Shorts shelves, sections, grid/search
  tiles, and the sidebar Shorts entries; `display:none` automatically covers nodes
  added later by YouTube's SPA, so no polling is needed. The `/shorts/<id>` player
  page (which CSS can't touch) is redirected to the normal watch page
  (`/watch?v=<id>`) on load and after every in-app navigation, so a Short opened
  from outside plays in the standard player.

## [0.2.1] - 2026-06-04

### Fixed
- Toolbar gear icon was invisible against the masthead (it relied on
  `color: inherit` / a YouTube CSS variable that didn't resolve). It now reads
  YouTube's `dark` attribute on `<html>` and sets an explicit colour, updating
  live when the theme is toggled.

## [0.2.0] - 2026-06-04

### Added
- In-page settings panel (toggle with `Shift`+`S`) to configure the maximum
  playback rate; stored in `localStorage`, so it works under any userscript
  manager (no `GM_*` APIs).
- Toolbar gear button injected into the YouTube masthead (between the
  notifications bell and the avatar) that opens the settings panel.
- Liquid Glass styling for the panel and toast (translucent `backdrop-filter`,
  rim highlight, pill buttons), a shortcut cheat-sheet table, a draggable panel
  header, and a scale + fade open animation.

## [0.1.1] - 2026-06-04

### Changed
- Cap the maximum playback rate at 5× (previously 16×).

## [0.1.0] - 2026-06-04

### Added
- Keyboard-layout-independent playback-speed control for YouTube
  (`Shift`+`,` slower, `Shift`+`.` faster, `Shift`+`0` reset), bound to physical
  keys via `event.code` so it works on non-US layouts (e.g. Hungarian QWERTZ).
- On-screen toast showing the current playback rate.
- Project scaffolding: README, MIT license, changelog, `.gitignore`.
- `ai-knowledge/` documenting design principles, conventions, and domain notes.

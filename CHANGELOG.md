# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

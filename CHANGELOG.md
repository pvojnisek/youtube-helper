# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-04

### Added
- Keyboard-layout-independent playback-speed control for YouTube
  (`Shift`+`,` slower, `Shift`+`.` faster, `Shift`+`0` reset), bound to physical
  keys via `event.code` so it works on non-US layouts (e.g. Hungarian QWERTZ).
- On-screen toast showing the current playback rate.
- Project scaffolding: README, MIT license, changelog, `.gitignore`.
- `ai-knowledge/` documenting design principles, conventions, and domain notes.

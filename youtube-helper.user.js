// ==UserScript==
// @name         YouTube Helper
// @namespace    https://github.com/pvojnisek/youtube-helper
// @version      0.1.0
// @description  Quality-of-life helpers for YouTube. First feature: keyboard-layout-independent playback-speed control (works on non-US layouts such as Hungarian QWERTZ).
// @author       Peter Vojnisek
// @license      MIT
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// @homepageURL  https://github.com/pvojnisek/youtube-helper
// @supportURL   https://github.com/pvojnisek/youtube-helper/issues
// ==/UserScript==

/*
 * YouTube Helper — a personal, multi-feature userscript (built one step at a time).
 *
 * Credit: the keyboard-driven, keyboard-layout-independent approach to playback-speed
 * control is inspired by Video Speed Controller (https://github.com/igrigorik/videospeed,
 * MIT, by Ilya Grigorik). No code is reused from it — only the idea is credited.
 */

(function () {
  'use strict';

  // === Feature 1: keyboard-layout-independent playback speed =================
  // YouTube binds its speed shortcuts to the `<` / `>` *characters* (Shift+, / Shift+.
  // on a US keyboard). On non-US layouts those combos emit other characters, so the
  // shortcut silently fails. We bind to the physical key (`event.code`) instead, so it
  // works regardless of layout, and we swallow the event before YouTube's own handler.
  const STEP = 0.25, MIN = 0.1, MAX = 16;

  function activeVideo() {
    const v = Array.from(document.querySelectorAll('video'));
    return v.find(x => !x.paused && x.readyState > 0)
        || v.find(x => x.offsetParent !== null) || v[0] || null;
  }
  function setRate(delta) {
    const v = activeVideo(); if (!v) return false;
    let r = Math.min(MAX, Math.max(MIN, Math.round((v.playbackRate + delta) * 100) / 100));
    v.playbackRate = r; toast(r.toFixed(2) + '×'); return true;
  }
  function resetRate() {
    const v = activeVideo(); if (!v) return false;
    v.playbackRate = 1; toast('1.00×'); return true;
  }
  function inField(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }

  let el, timer;
  function toast(text) {
    if (!el) {
      el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);' +
        'z-index:2147483647;background:rgba(0,0,0,.8);color:#fff;font:600 14px/1 system-ui,sans-serif;' +
        'padding:8px 12px;border-radius:6px;pointer-events:none;transition:opacity .2s;opacity:0';
      document.documentElement.appendChild(el);
    }
    el.textContent = text; el.style.opacity = '1';
    clearTimeout(timer); timer = setTimeout(() => { el.style.opacity = '0'; }, 800);
  }

  window.addEventListener('keydown', function (e) {
    if (inField(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.shiftKey) return; // Shift only
    let handled = false;
    switch (e.code) {
      case 'Comma':   handled = setRate(-STEP); break; // Shift + comma  → slower
      case 'Period':  handled = setRate(+STEP); break; // Shift + period → faster
      case 'Digit0':
      case 'Numpad0': handled = resetRate();    break; // Shift + 0      → reset
    }
    if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
})();

// ==UserScript==
// @name         YouTube Helper
// @namespace    https://github.com/pvojnisek/youtube-helper
// @version      0.2.1
// @description  Quality-of-life helpers for YouTube: keyboard-layout-independent playback-speed control with a configurable maximum (in-page settings panel).
// @author       Peter Vojnisek
// @license      MIT
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// @homepageURL  https://github.com/pvojnisek/youtube-helper
// @supportURL   https://github.com/pvojnisek/youtube-helper/issues
// ==/UserScript==

/*
 * YouTube Helper — a personal, multi-feature userscript (built one step at a time)
 *
 * Credit: the keyboard-driven, keyboard-layout-independent approach to playback-speed
 * control is inspired by Video Speed Controller (https://github.com/igrigorik/videospeed,
 * MIT, by Ilya Grigorik). No code is reused from it — only the idea is credited.
 */

(function () {
  "use strict";

  // === Config: persisted in localStorage (userscript-manager independent) ====
  // Stored on the youtube.com origin; no GM_* APIs, so it behaves the same under
  // any userscript manager (Violentmonkey, Tampermonkey, Greasemonkey, ...).
  const LS_KEY = "ythelper:config";
  const HARD_MAX = 16; // browsers cap HTMLMediaElement.playbackRate around here
  const DEFAULTS = { maxRate: 5, minRate: 0.1, step: 0.25 };

  function loadConfig() {
    try {
      return {
        ...DEFAULTS,
        ...JSON.parse(localStorage.getItem(LS_KEY) || "{}"),
      };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }
  function saveConfig() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(config));
    } catch (_) {
      /* storage may be unavailable; ignore */
    }
  }
  const config = loadConfig();

  // === Feature 1: keyboard-layout-independent playback speed =================
  // YouTube binds its speed shortcuts to the `<` / `>` *characters* (Shift+, / Shift+.
  // on a US keyboard). On non-US layouts those combos emit other characters, so the
  // shortcut silently fails. We bind to the physical key (`event.code`) instead, so it
  // works regardless of layout, and we swallow the event before YouTube's own handler.
  function activeVideo() {
    const v = Array.from(document.querySelectorAll("video"));
    return (
      v.find((x) => !x.paused && x.readyState > 0) ||
      v.find((x) => x.offsetParent !== null) ||
      v[0] ||
      null
    );
  }
  function setRate(delta) {
    const v = activeVideo();
    if (!v) return false;
    const r = Math.min(
      config.maxRate,
      Math.max(config.minRate, Math.round((v.playbackRate + delta) * 100) / 100),
    );
    v.playbackRate = r;
    toast(r.toFixed(2) + "×");
    return true;
  }
  function resetRate() {
    const v = activeVideo();
    if (!v) return false;
    v.playbackRate = 1;
    toast("1.00×");
    return true;
  }
  function inField(t) {
    return (
      t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    );
  }

  let el, timer;
  function toast(text) {
    if (!el) {
      el = document.createElement("div");
      el.style.cssText =
        "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
        "color:#fff;font:600 14px/1 -apple-system,system-ui,sans-serif;padding:9px 14px;border-radius:14px;" +
        "background:linear-gradient(135deg,rgba(70,70,80,.5),rgba(30,30,38,.55));" +
        "backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);" +
        "border:1px solid rgba(255,255,255,.22);" +
        "box-shadow:0 8px 24px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.4);" +
        "text-shadow:0 1px 2px rgba(0,0,0,.4);pointer-events:none;transition:opacity .2s;opacity:0";
      document.documentElement.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = "1";
    clearTimeout(timer);
    timer = setTimeout(() => {
      el.style.opacity = "0";
    }, 800);
  }

  // === Feature 2: in-page settings panel (toggle with Shift+S) ===============
  // Plain DOM + localStorage, no GM_* APIs → manager-independent and CSP-safe
  // (no inline event handlers; listeners are attached programmatically).
  let panel;
  // Built with createElement/textContent (no innerHTML): YouTube enforces
  // Trusted Types, which blocks string-to-HTML assignment.
  function make(tag, style, text) {
    const n = document.createElement(tag);
    if (style) n.style.cssText = style;
    if (text != null) n.textContent = text;
    return n;
  }
  // Hover feedback without a stylesheet (CSP-safe): toggle inline style.
  function hoverable(node, base, hover) {
    node.style.cssText = base;
    node.addEventListener("mouseenter", () => (node.style.cssText = base + hover));
    node.addEventListener("mouseleave", () => (node.style.cssText = base));
  }
  // A small key-cap chip for the shortcut table.
  function kbd(text) {
    return make(
      "span",
      "display:inline-block;min-width:16px;text-align:center;padding:2px 7px;" +
        "border-radius:7px;background:rgba(255,255,255,.14);" +
        "border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.3);" +
        "font:600 11px ui-monospace,SFMono-Regular,monospace",
      text,
    );
  }
  // The shortcut cheat-sheet as a 2-column grid: key chips → description.
  function shortcutRows() {
    const grid = make(
      "div",
      "display:grid;grid-template-columns:auto 1fr;gap:9px 14px;align-items:center;" +
        "margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.15);font-size:12px",
    );
    const rows = [
      [["Shift", ","], "Slow down"],
      [["Shift", "."], "Speed up"],
      [["Shift", "0"], "Reset to 1×"],
      [["Shift", "S"], "Settings"],
    ];
    rows.forEach(([keys, desc]) => {
      const cell = make("div", "display:flex;gap:5px;align-items:center");
      keys.forEach((k, i) => {
        if (i) cell.appendChild(make("span", "opacity:.45;font-size:11px", "+"));
        cell.appendChild(kbd(k));
      });
      grid.appendChild(cell);
      grid.appendChild(make("div", "opacity:.85", desc));
    });
    return grid;
  }
  // Drag `target` by `handle`. Position is not persisted (resets on reload);
  // within a session the panel reopens wherever it was last dragged.
  function makeDraggable(handle, target) {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      const offX = e.clientX - rect.left;
      const offY = e.clientY - rect.top;
      target.style.left = rect.left + "px";
      target.style.top = rect.top + "px";
      target.style.transform = "none";
      const move = (ev) => {
        target.style.left = ev.clientX - offX + "px";
        target.style.top = ev.clientY - offY + "px";
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
  }
  function buildPanel() {
    // Liquid-glass approximation: translucent fill + backdrop blur/saturate,
    // bright rim highlight (inset top), soft depth shadow, big rounded corners.
    // Dark-tinted glass keeps white text legible over bright video frames.
    panel = make(
      "div",
      "position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
        "color:#fff;font:13px/1.4 -apple-system,system-ui,sans-serif;" +
        "padding:18px 20px;min-width:260px;border-radius:24px;display:none;" +
        "background:linear-gradient(135deg,rgba(70,70,80,.5),rgba(30,30,38,.55));" +
        "backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);" +
        "border:1px solid rgba(255,255,255,.25);" +
        "box-shadow:0 12px 40px rgba(0,0,0,.45)," +
        "inset 0 1px 0 rgba(255,255,255,.5),inset 0 -1px 0 rgba(0,0,0,.15);" +
        "text-shadow:0 1px 2px rgba(0,0,0,.4)",
    );

    const label = make("label", "display:block;margin-bottom:14px;opacity:.95");
    label.appendChild(document.createTextNode("Max speed (×)"));
    const input = make(
      "input",
      "display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:8px 10px;" +
        "border-radius:12px;border:1px solid rgba(255,255,255,.25);" +
        "background:rgba(255,255,255,.1);color:#fff;font:600 14px system-ui;" +
        "outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)",
    );
    input.type = "number";
    input.min = "1";
    input.max = String(HARD_MAX);
    input.step = "0.25";
    label.appendChild(input);

    // Glass pill buttons with hover brighten.
    const pill =
      "padding:7px 18px;border-radius:999px;cursor:pointer;color:#fff;" +
      "font:600 13px system-ui;border:1px solid rgba(255,255,255,.25);" +
      "backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.4);transition:filter .15s;";
    const cancel = make("button", null, "Cancel");
    hoverable(
      cancel,
      pill + "background:rgba(255,255,255,.12);",
      "filter:brightness(1.4);",
    );
    const saveBtn = make("button", null, "Save");
    hoverable(
      saveBtn,
      pill + "background:rgba(48,209,88,.55);border-color:rgba(255,255,255,.35);",
      "filter:brightness(1.15);",
    );
    const actions = make(
      "div",
      "display:flex;gap:10px;justify-content:flex-end",
    );
    actions.appendChild(cancel);
    actions.appendChild(saveBtn);

    const header = make(
      "div",
      "font-weight:600;font-size:15px;margin-bottom:12px;cursor:move;" +
        "user-select:none;-webkit-user-select:none",
      "YouTube Helper — settings",
    );
    makeDraggable(header, panel);

    panel.appendChild(header);
    panel.appendChild(label);
    panel.appendChild(actions);
    panel.appendChild(shortcutRows());

    const save = () => {
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        config.maxRate = Math.min(HARD_MAX, Math.max(1, val));
        saveConfig();
        toast("Max: " + config.maxRate + "×");
      }
      closePanel();
    };
    saveBtn.addEventListener("click", save);
    cancel.addEventListener("click", closePanel);
    panel.addEventListener("keydown", (e) => {
      e.stopPropagation(); // keep typing out of the page's shortcut handlers
      if (e.key === "Escape") closePanel();
      else if (e.key === "Enter") save();
    });
    document.documentElement.appendChild(panel);
  }
  function openPanel() {
    if (!panel) buildPanel();
    const input = panel.querySelector("input");
    input.value = config.maxRate;
    panel.style.display = "block";
    // Scale + fade entrance via the Web Animations API (no stylesheet needed).
    // Preserve any existing transform (centering, or "none" after a drag).
    const base =
      panel.style.transform && panel.style.transform !== "none"
        ? panel.style.transform + " "
        : "";
    panel.animate(
      [
        { opacity: 0, transform: base + "scale(.95)" },
        { opacity: 1, transform: base + "scale(1)" },
      ],
      { duration: 140, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    input.focus();
    input.select();
  }
  function closePanel() {
    if (panel) panel.style.display = "none";
  }
  function togglePanel() {
    if (!panel || panel.style.display === "none") openPanel();
    else closePanel();
  }

  // === Toolbar gear button (opens the settings panel) ========================
  // Injected into YouTube's masthead, between the notifications bell and the
  // avatar. YouTube is an SPA that re-renders the masthead, so we re-insert the
  // button whenever it goes missing (cheap id check on an interval).
  //
  // Icon colour is themed explicitly: YouTube marks its dark theme with a `dark`
  // attribute on <html> (and <ytd-app>). `color: inherit` / CSS vars proved
  // unreliable here, so we read that attribute and react to theme switches.
  function isDark() {
    return (
      document.documentElement.hasAttribute("dark") ||
      !!document.querySelector("ytd-app[dark]")
    );
  }
  function svgGear() {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute(
      "d",
      "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
    );
    svg.appendChild(path);
    return svg;
  }
  function ensureGear() {
    if (document.getElementById("ythelper-gear")) return;
    const buttons = document.querySelector("ytd-masthead #buttons");
    if (!buttons) return;
    const avatar = buttons.querySelector("#avatar-btn");
    const anchor =
      (avatar &&
        (avatar.closest("ytd-topbar-menu-button-renderer") || avatar)) ||
      buttons.querySelector("ytd-notification-topbar-button-renderer");
    const gear = make(
      "button",
      "width:40px;height:40px;display:inline-flex;align-items:center;" +
        "justify-content:center;padding:0;border:0;border-radius:50%;cursor:pointer;" +
        "background:transparent;" +
        "opacity:.9;transition:background .15s,opacity .15s,color .15s",
    );
    gear.id = "ythelper-gear";
    gear.title = "YouTube Helper settings (Shift+S)";
    gear.setAttribute("aria-label", "YouTube Helper settings");
    gear.style.color = isDark() ? "#f1f1f1" : "#0f0f0f";
    gear.addEventListener("mouseenter", () => {
      gear.style.background = "rgba(128,128,128,.25)";
      gear.style.opacity = "1";
    });
    gear.addEventListener("mouseleave", () => {
      gear.style.background = "transparent";
      gear.style.opacity = ".9";
    });
    gear.addEventListener("click", togglePanel);
    gear.appendChild(svgGear());
    if (anchor) buttons.insertBefore(gear, anchor);
    else buttons.appendChild(gear);
  }
  ensureGear();
  setInterval(ensureGear, 1000);
  // Re-theme the gear when YouTube's theme toggles (the `dark` attr on <html>).
  new MutationObserver(() => {
    const gear = document.getElementById("ythelper-gear");
    if (gear) gear.style.color = isDark() ? "#f1f1f1" : "#0f0f0f";
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["dark"],
  });

  // === Key bindings ==========================================================
  window.addEventListener(
    "keydown",
    function (e) {
      if (inField(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || !e.shiftKey) return; // Shift only
      let handled = false;
      switch (e.code) {
        case "Comma":
          handled = setRate(-config.step);
          break; // Shift + comma  → slower
        case "Period":
          handled = setRate(+config.step);
          break; // Shift + period → faster
        case "Digit0":
        case "Numpad0":
          handled = resetRate();
          break; // Shift + 0      → reset
        case "KeyS":
          togglePanel();
          handled = true;
          break; // Shift + s      → settings panel
      }
      if (handled) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
})();

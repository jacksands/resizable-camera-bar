// ============================================================
// Resizable Camera Bar — bar initialisation & observer management
// ============================================================

import { debounce, MAX_INIT_RETRIES } from "./constants.js";
import { get } from "./settings.js";
import {
  getPosition, isFoundryMinimized, clearInlineSize, applySize, loadSize, isAVEnabled,
} from "./bar-utils.js";
import { createHandle, positionHandle, _handles } from "./handle.js";
import { createBarIcons, positionBarIcons } from "./icons.js";
import { applyNoVideoVisibility, attachVideoListeners } from "./camera-visibility.js";
import { applyGridLayout } from "./grid-layout.js";

/** @type {WeakMap<HTMLElement, ResizeObserver>} */
const _resizeObservers   = new WeakMap();
/** @type {WeakMap<HTMLElement, {disconnect: Function}>} */
const _mutationObservers = new WeakMap();
/** @type {WeakMap<HTMLElement, Function>} */
const _windowHandlers    = new WeakMap();

/**
 * Disconnects all observers and removes the window resize listener for a bar.
 * @param {HTMLElement} bar
 */
function cleanupObservers(bar) {
  _resizeObservers.get(bar)?.disconnect();
  _mutationObservers.get(bar)?.disconnect();
  const wh = _windowHandlers.get(bar);
  if (wh) window.removeEventListener("resize", wh);
}

/**
 * Initialises a single camera bar: applies saved size, creates handle and icons,
 * applies grid layout, and attaches observers.
 * @param {HTMLElement} bar - The #camera-views element.
 * @param {number} [_retries=0]
 */
export function initBar(bar, _retries = 0) {
  if (!bar || bar.id !== "camera-views") return;

  if (!isAVEnabled()) {
    cleanupObservers(bar);
    return;
  }

  const pos = getPosition(bar);
  if (!pos) {
    if (_retries >= MAX_INIT_RETRIES) {
      console.warn("resizable-camera-bar | initBar: position class never appeared, giving up.");
      return;
    }
    setTimeout(() => initBar(bar, _retries + 1), 150);
    return;
  }

  cleanupObservers(bar);

  if (!isFoundryMinimized(bar)) {
    applySize(bar, pos, loadSize(pos));
    // Grid layout must run AFTER applySize so it can override --av-width/--av-height.
    applyGridLayout(bar);
  }

  createHandle(bar);
  createBarIcons(bar);
  applyNoVideoVisibility(bar);
  attachVideoListeners(bar);

  const onWinResize = debounce(() => {
    const h = _handles.get(bar);
    if (h) positionHandle(bar, h);
    positionBarIcons(bar);
  }, 60);
  window.addEventListener("resize", onWinResize);
  _windowHandlers.set(bar, onWinResize);

  // MutationObserver 1: class changes on the bar itself (minimize, dock position).
  const moClass = new MutationObserver(debounce((mutations) => {
    const barClassChanged = mutations.some(
      m => m.target === bar && m.attributeName === "class"
    );
    if (!barClassChanged) return;

    if (isFoundryMinimized(bar)) {
      clearInlineSize(bar);
      const h = _handles.get(bar);
      if (h) positionHandle(bar, h);
      positionBarIcons(bar);
    } else {
      const newPos = getPosition(bar);
      if (!newPos) return;
      createHandle(bar);
      createBarIcons(bar);
      applySize(bar, newPos, loadSize(newPos));
      // Re-apply grid after position change (H/V grid may differ).
      applyGridLayout(bar);
    }
  }, 80));
  moClass.observe(bar, { attributes: true, attributeFilter: ["class"] });

  // MutationObserver 2: changes inside the bar (cameras joining/leaving, class changes).
  // Filter out mutations caused exclusively by our own classes to prevent loops.
  const _ownClasses = new Set(["rcb-dynamic-hide", "rcb-grid-active"]);
  const moVideo = new MutationObserver(debounce((mutations) => {
    const onlyOwnClass = mutations.every(m =>
      m.type === "attributes" &&
      m.attributeName === "class" &&
      m.target instanceof Element &&
      (() => {
        const prev = m.oldValue ?? "";
        const curr = m.target.className ?? "";
        const normalize = s => {
          let r = s;
          for (const cls of _ownClasses) r = r.replace(new RegExp(`\\b${cls}\\b`, "g"), "");
          return r.replace(/\s+/g, " ").trim();
        };
        return normalize(prev) === normalize(curr);
      })()
    );
    if (onlyOwnClass) return;
    applyNoVideoVisibility(bar);
    // Recalculate grid when the visible frame count changes.
    applyGridLayout(bar);
  }, 80));
  moVideo.observe(bar, {
    subtree:           true,
    attributes:        true,
    attributeFilter:   ["class", "hidden"],
    attributeOldValue: true,
    childList:         true,
  });

  _mutationObservers.set(bar, {
    disconnect: () => { moClass.disconnect(); moVideo.disconnect(); },
  });

  const ro = new ResizeObserver(debounce(() => {
    const h = _handles.get(bar);
    if (h) positionHandle(bar, h);
    positionBarIcons(bar);
    // Recalculate grid on bar resize (column/row count may change).
    applyGridLayout(bar);
  }, 60));
  ro.observe(bar);
  _resizeObservers.set(bar, ro);
}

/**
 * Locates the #camera-views element and initialises it.
 * Called from Hooks.once("ready") and from the closeSettingsConfig hook.
 */
export function initAllBars() {
  if (!isAVEnabled()) return;
  const bar = document.querySelector("#camera-views");
  if (bar) initBar(bar);
}

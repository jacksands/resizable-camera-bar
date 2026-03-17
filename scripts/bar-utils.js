// ============================================================
// Resizable Camera Bar — bar geometry helpers & size persistence
// ============================================================

import { MODULE_ID, debounce } from "./constants.js";
import { get } from "./settings.js";

/**
 * Returns the dock position of the camera bar based on its CSS class.
 * @param {HTMLElement} bar - The #camera-views element.
 * @returns {"left"|"right"|"top"|"bottom"|null}
 */
export function getPosition(bar) {
  if (bar.classList.contains("left"))   return "left";
  if (bar.classList.contains("right"))  return "right";
  if (bar.classList.contains("top"))    return "top";
  if (bar.classList.contains("bottom")) return "bottom";
  return null;
}

/**
 * Returns true for bars docked on the left or right (width-resizable).
 * @param {"left"|"right"|"top"|"bottom"} pos
 * @returns {boolean}
 */
export function isVertical(pos) { return pos === "left" || pos === "right"; }

/**
 * Returns the inner edge of the bar — the side facing the canvas where the handle lives.
 * @param {"left"|"right"|"top"|"bottom"} pos
 * @returns {"right"|"left"|"bottom"|"top"}
 */
export function innerEdge(pos) {
  return { left: "right", right: "left", top: "bottom", bottom: "top" }[pos];
}

/**
 * Returns true when Foundry has minimized/collapsed the camera bar.
 * We must skip resize logic while the bar is in this state.
 * @param {HTMLElement} bar
 * @returns {boolean}
 */
export function isFoundryMinimized(bar) {
  return bar.classList.contains("minimized");
}

/**
 * Returns the default size in pixels for a given position.
 * @param {"left"|"right"|"top"|"bottom"} pos
 * @returns {number}
 */
export function defaultSize(pos) { return isVertical(pos) ? 200 : 180; }

/**
 * Loads the persisted size for a given position from the savedSizes client setting.
 * Falls back to defaultSize if the value is missing or the setting is unreadable.
 * @param {"left"|"right"|"top"|"bottom"} pos
 * @returns {number}
 */
export function loadSize(pos) {
  try {
    const sizes = get("savedSizes") ?? {};
    return typeof sizes[pos] === "number" ? sizes[pos] : defaultSize(pos);
  } catch (_) { return defaultSize(pos); }
}

/**
 * Debounced function that persists the new bar size to the savedSizes client setting.
 * Debounced at 400 ms to avoid excessive localStorage writes during drag.
 * scope: "client" (localStorage) is intentional — avoids a server round-trip per rAF frame.
 * @type {Function}
 */
export const _saveSize = debounce((pos, size) => {
  try {
    // game.settings.get retorna o objeto diretamente (type: Object).
    // Copia rasa para não mutar o objeto retornado pelo Foundry.
    const sizes = Object.assign({}, get("savedSizes"));
    sizes[pos] = size;
    game.settings.set(MODULE_ID, "savedSizes", sizes);
  } catch (e) { console.warn(`${MODULE_ID} | save size error:`, e); }
}, 400);

/**
 * Applies aspect-ratio CSS variables to the bar based on the current setting.
 * Skips when ratio is "free". Calculates the dependent dimension from the active one.
 * @param {HTMLElement} bar
 * @param {number} size - The active dimension (width for vertical, height for horizontal).
 * @returns {void}
 */
export function applyAspectRatio(bar, size) {
  const ratio = get("aspectRatio");
  if (ratio === "free") return;
  const pos    = getPosition(bar);
  if (!pos) return;
  const [w, h] = ratio === "16:9" ? [16, 9] : [4, 3];
  if (isVertical(pos)) {
    bar.style.setProperty("--av-width",  `${size}px`);
    bar.style.setProperty("--av-height", `${Math.round((size * h) / w)}px`);
  } else {
    bar.style.setProperty("--av-height", `${size}px`);
    bar.style.setProperty("--av-width",  `${Math.round((size * w) / h)}px`);
  }
}

/**
 * Sets the bar's inline width or height and updates aspect-ratio variables.
 * No-ops when the bar is in Foundry's minimized state.
 * @param {HTMLElement} bar
 * @param {"left"|"right"|"top"|"bottom"} pos
 * @param {number} size - Size in pixels.
 * @returns {void}
 */
export function applySize(bar, pos, size) {
  if (isFoundryMinimized(bar)) return;
  if (isVertical(pos)) bar.style.width  = `${size}px`;
  else                  bar.style.height = `${size}px`;
  applyAspectRatio(bar, size);
}

/**
 * Removes inline width and height from the bar.
 * Called when the bar enters minimized state so Foundry can control its dimensions.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function clearInlineSize(bar) {
  bar.style.width  = "";
  bar.style.height = "";
}

/**
 * Returns the computed z-index of the bar, defaulting to 60 if not set.
 * Used to layer the handle and icons just above the bar without overriding dialogs.
 * @param {HTMLElement} bar
 * @returns {number}
 */
export function getBarZIndex(bar) {
  const z = parseInt(window.getComputedStyle(bar).zIndex);
  return isNaN(z) ? 60 : z;
}

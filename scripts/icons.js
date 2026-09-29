// ============================================================
// Resizable Camera Bar — bar icons (eye + warning + grid toggle)
// ============================================================

import { MODULE_ID } from "./constants.js";
import { get } from "./settings.js";
import { getPosition, isVertical, isFoundryMinimized, getBarZIndex, isAVEnabled } from "./bar-utils.js";
import { openModuleSettings } from "./readme.js";
import { isGridActive } from "./grid-layout.js";

/** @type {WeakMap<HTMLElement, {eye?: HTMLElement, warn?: HTMLElement, grid?: HTMLElement}>} */
const _barIcons = new WeakMap();

/**
 * Returns (or initialises) the icon state object for a bar.
 * @param {HTMLElement} bar
 * @returns {{eye?: HTMLElement, warn?: HTMLElement, grid?: HTMLElement}}
 */
export function getBarIcons(bar) {
  if (!_barIcons.has(bar)) _barIcons.set(bar, {});
  return _barIcons.get(bar);
}

/**
 * Removes all icon elements from the DOM and resets the bar's icon state.
 * @param {HTMLElement} bar
 */
export function removeBarIcons(bar) {
  const icons = getBarIcons(bar);
  icons.eye?.remove();
  icons.warn?.remove();
  icons.grid?.remove();
  _barIcons.set(bar, {});
}

/**
 * Updates the grid toggle button's visual state to match the current setting value.
 * @param {HTMLElement} bar
 * @param {HTMLElement} gridBtn
 */
function _updateGridBtnState(bar, gridBtn) {
  if (!gridBtn) return;
  const pos    = getPosition(bar);
  const active = pos ? isGridActive(pos) : false;
  gridBtn.style.opacity = active ? "1" : "0.5";
  const icon = gridBtn.querySelector("i");
  if (icon) {
    icon.style.filter = active
      ? "drop-shadow(0 0 3px rgba(200,160,96,0.9))"
      : "none";
  }
}

/**
 * Repositions all icons to the correct corner of the bar using fixed coordinates.
 * Icon stack order (eye, warn, grid) grows away from the bar edge:
 *   left/right/bottom: downward from the top corner.
 *   top: upward from the bottom corner.
 * Also updates the grid toggle's visual active state.
 * @param {HTMLElement} bar
 */
export function positionBarIcons(bar) {
  const pos   = getPosition(bar);
  if (!pos) return;
  const rect  = bar.getBoundingClientRect();
  const icons = getBarIcons(bar);
  const sz    = 22;
  const gap   = 2;
  const step  = sz + gap;

  if (isFoundryMinimized(bar)) {
    if (icons.eye)  icons.eye.style.display  = "none";
    if (icons.warn) icons.warn.style.display = "none";
    if (icons.grid) icons.grid.style.display = "none";
    return;
  }

  if (icons.eye)  icons.eye.style.display  = "flex";
  if (icons.grid) icons.grid.style.display = "flex";
  // warn display is managed by updateWarningIcon.

  let x, y1, y2, y3;
  switch (pos) {
    case "bottom":
      x  = rect.left + 4;
      y1 = rect.top + 4;
      y2 = y1 + step;
      y3 = y1 + step * 2;
      break;
    case "top":
      x  = rect.left + 4;
      y1 = rect.bottom - sz - 4;
      y2 = y1 - step;
      y3 = y1 - step * 2;
      break;
    case "left":
      x  = rect.left + 4;
      y1 = rect.top + 4;
      y2 = y1 + step;
      y3 = y1 + step * 2;
      break;
    case "right":
      x  = rect.right - sz - 4;
      y1 = rect.top + 4;
      y2 = y1 + step;
      y3 = y1 + step * 2;
      break;
    default:
      return;
  }

  const _place = (el, y) => {
    if (!el) return;
    el.style.left   = `${x}px`;
    el.style.top    = `${y}px`;
    el.style.width  = `${sz}px`;
    el.style.height = `${sz}px`;
  };

  _place(icons.eye,  y1);
  _place(icons.warn, y2); // always positioned at y2; display is managed by updateWarningIcon

  // Grid icon collapses into the warn slot when warn is hidden, eliminating the gap.
  const warnVisible = !!(icons.warn && icons.warn.style.display !== "none");
  _place(icons.grid, warnVisible ? y3 : y2);

  // Keep grid icon visual state in sync with the current setting value.
  _updateGridBtnState(bar, icons.grid);
}

/**
 * Creates the eye, warning, and grid toggle icon buttons for a bar.
 * All three are appended to document.body with position:fixed to avoid clipping.
 * @param {HTMLElement} bar
 */
export function createBarIcons(bar) {
  removeBarIcons(bar);
  const pos = getPosition(bar);
  if (!pos) return;

  const color = get("handleColor");
  const zIdx  = String(getBarZIndex(bar) + 1);
  const vert  = isVertical(pos);

  // ── Eye (settings shortcut) ──────────────────────────────
  const eye = document.createElement("button");
  eye.className = "rcb-eye-btn";
  eye.title     = "Resizable Camera Bar — Open Module Settings";
  eye.innerHTML = '<i class="fa-regular fa-eye"></i>';
  eye.style.cssText = `position:fixed; z-index:${zIdx}; color:${color}; opacity:0.5;`;
  eye.addEventListener("mouseenter", () => { eye.style.opacity = "1"; });
  eye.addEventListener("mouseleave", () => { eye.style.opacity = "0.5"; });
  eye.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    openModuleSettings();
  });

  // ── Warning (hidden users) ────────────────────────────────
  const warn = document.createElement("button");
  warn.className = "rcb-warn-btn";
  warn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
  warn.style.cssText = `position:fixed; z-index:${zIdx}; color:${color}; opacity:0.7; display:none;`;
  warn.addEventListener("mouseenter", () => { warn.style.opacity = "1"; _showWarnTooltip(warn, bar); });
  warn.addEventListener("mouseleave", () => { warn.style.opacity = "0.7"; _hideWarnTooltip(); });
  warn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    openModuleSettings();
  });

  // ── Grid toggle ───────────────────────────────────────────
  const grid = document.createElement("button");
  grid.className = "rcb-grid-btn";
  grid.title     = vert
    ? "Toggle Multi-Column Grid (vertical bar)"
    : "Toggle Multi-Row Grid (horizontal bar)";
  grid.innerHTML = '<i class="fas fa-border-all"></i>';
  grid.style.cssText = `position:fixed; z-index:${zIdx}; color:${color}; opacity:0.5;`;

  grid.addEventListener("mouseenter", () => { grid.style.opacity = "1"; });
  grid.addEventListener("mouseleave", () => {
    // Restore to active/inactive opacity based on current setting.
    const active = isGridActive(getPosition(bar));
    grid.style.opacity = active ? "1" : "0.5";
  });
  grid.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    const p = getPosition(bar);
    if (!p) return;
    const key     = isVertical(p) ? "gridVerticalActive" : "gridHorizontalActive";
    const current = game.settings.get(MODULE_ID, key);
    // onChange wired in hooks.js handles applyGridLayout + positionBarIcons.
    game.settings.set(MODULE_ID, key, !current);
  });

  document.body.appendChild(eye);
  document.body.appendChild(warn);
  document.body.appendChild(grid);
  _barIcons.set(bar, { eye, warn, grid });
  positionBarIcons(bar);
}

// ─── Warning tooltip ──────────────────────────────────────────

/** @type {HTMLElement|null} Active tooltip element, if any. */
let _warnTooltip = null;

function _hideWarnTooltip() {
  _warnTooltip?.remove();
  _warnTooltip = null;
}

function _buildWarnData(bar) {
  const byModule = [];
  const manually = [];

  const slotsInDOM = new Map();
  bar.querySelectorAll(".camera-view[data-user]").forEach(view => {
    if (view.dataset.user) slotsInDOM.set(view.dataset.user, view);
  });

  slotsInDOM.forEach((view, userId) => {
    if (view.classList.contains("rcb-dynamic-hide")) {
      byModule.push(game.users.get(userId)?.name ?? userId);
    }
  });

  game.users.forEach(user => {
    if (!user.active) return;
    if (!slotsInDOM.has(user.id)) manually.push(user.name);
  });

  return { byModule, manually };
}

function _showWarnTooltip(warnBtn, bar) {
  _hideWarnTooltip();

  const { byModule, manually } = _buildWarnData(bar);
  if (byModule.length === 0 && manually.length === 0) return;

  const tip = document.createElement("div");
  tip.className = "rcb-warn-tooltip";

  let html = "";
  if (byModule.length > 0) {
    html += `<div class="rcb-wt-section">`;
    html += `<div class="rcb-wt-heading"><i class="fas fa-video-slash"></i> Hidden by module (${byModule.length})</div>`;
    byModule.forEach(n => { html += `<div class="rcb-wt-row">${n}</div>`; });
    html += `</div>`;
  }
  if (manually.length > 0) {
    if (byModule.length > 0) html += `<div class="rcb-wt-divider"></div>`;
    html += `<div class="rcb-wt-section">`;
    html += `<div class="rcb-wt-heading"><i class="fas fa-eye-slash"></i> Hidden manually (${manually.length})</div>`;
    manually.forEach(n => { html += `<div class="rcb-wt-row">${n}</div>`; });
    html += `</div>`;
  }

  tip.innerHTML = html;
  tip.style.zIndex = warnBtn.style.zIndex;
  document.body.appendChild(tip);
  _warnTooltip = tip;

  const btnRect = warnBtn.getBoundingClientRect();
  const tipW    = 220;
  const tipH    = tip.offsetHeight || 120;
  let left = btnRect.right + 6;
  let top  = btnRect.top;

  if (left + tipW > window.innerWidth)  left = btnRect.left - tipW - 6;
  if (top  + tipH > window.innerHeight) top  = window.innerHeight - tipH - 8;

  tip.style.left = `${left}px`;
  tip.style.top  = `${top}px`;
}

/**
 * Shows or hides the warning icon based on how many users are currently hidden.
 * @param {HTMLElement} bar
 */
export function updateWarningIcon(bar) {
  const icons = getBarIcons(bar);
  if (!icons.warn) return;

  if (!isAVEnabled()) {
    icons.warn.style.display = "none";
    _hideWarnTooltip();
    positionBarIcons(bar);
    return;
  }

  const { byModule, manually } = _buildWarnData(bar);
  const showByModule = get("hideNoVideo") && byModule.length > 0;
  const showManually = manually.length > 0;

  if (showByModule || showManually) {
    icons.warn.style.display = "flex";
    if (_warnTooltip) _showWarnTooltip(icons.warn, bar);
  } else {
    icons.warn.style.display = "none";
    _hideWarnTooltip();
  }
  positionBarIcons(bar);
}

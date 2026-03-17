// ============================================================
// Resizable Camera Bar — resize handle creation & drag logic
// ============================================================

import { get } from "./settings.js";
import {
  getPosition, isVertical, innerEdge, isFoundryMinimized,
  defaultSize, applySize, applyAspectRatio, getBarZIndex, _saveSize,
} from "./bar-utils.js";

/** @type {WeakMap<HTMLElement, HTMLElement>} Maps each bar to its handle element. */
export const _handles = new WeakMap();

/**
 * Positions the handle element along the inner edge of the bar using fixed coordinates.
 * Hides the handle while the bar is in Foundry's minimized state.
 * Called after every bar resize, window resize, or bar position change.
 * @param {HTMLElement} bar
 * @param {HTMLElement} handle
 * @returns {void}
 */
export function positionHandle(bar, handle) {
  const pos  = getPosition(bar);
  if (!pos) return;

  if (isFoundryMinimized(bar)) {
    handle.style.display = "none";
    return;
  }
  handle.style.display = "";

  const edge = innerEdge(pos);
  const rect = bar.getBoundingClientRect();

  handle.style.zIndex = String(getBarZIndex(bar) + 1);

  if (edge === "right") {
    const len = Math.round(rect.height * 0.6);
    handle.style.left   = `${rect.right - 4}px`;
    handle.style.top    = `${rect.top + rect.height / 2 - len / 2}px`;
    handle.style.width  = "4px";
    handle.style.height = `${len}px`;
    handle.style.cursor = "ew-resize";
  } else if (edge === "left") {
    const len = Math.round(rect.height * 0.6);
    handle.style.left   = `${rect.left}px`;
    handle.style.top    = `${rect.top + rect.height / 2 - len / 2}px`;
    handle.style.width  = "4px";
    handle.style.height = `${len}px`;
    handle.style.cursor = "ew-resize";
  } else if (edge === "bottom") {
    const len = Math.round(rect.width * 0.6);
    handle.style.left   = `${rect.left + rect.width / 2 - len / 2}px`;
    handle.style.top    = `${rect.bottom - 4}px`;
    handle.style.width  = `${len}px`;
    handle.style.height = "4px";
    handle.style.cursor = "ns-resize";
  } else { // top
    const len = Math.round(rect.width * 0.6);
    handle.style.left   = `${rect.left + rect.width / 2 - len / 2}px`;
    handle.style.top    = `${rect.top}px`;
    handle.style.width  = `${len}px`;
    handle.style.height = "4px";
    handle.style.cursor = "ns-resize";
  }
}

/**
 * Creates the resize handle for a bar, removing any previous handle first.
 * Attaches hover, double-click, and drag (mousedown) listeners.
 * Appended to document.body so it is never clipped by the bar's overflow.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function createHandle(bar) {
  _handles.get(bar)?.remove();

  const pos = getPosition(bar);
  if (!pos) return;

  const color   = get("handleColor");
  const opacity = get("handleOpacity");
  const always  = get("handleAlwaysVisible");

  const handle = document.createElement("div");
  handle.className             = "rcb-handle";
  handle.title                 = "Drag to resize · Double-click to reset";
  handle.style.backgroundColor = color;
  handle.dataset.hoverOpacity  = String(opacity);
  handle.style.opacity         = always ? String(opacity) : "0";

  handle.addEventListener("mouseenter", () => {
    handle.style.opacity = handle.dataset.hoverOpacity;
  });
  handle.addEventListener("mouseleave", () => {
    if (!get("handleAlwaysVisible")) handle.style.opacity = "0";
  });

  handle.addEventListener("dblclick", (e) => {
    e.preventDefault();
    const p   = getPosition(bar);
    const def = defaultSize(p);
    applySize(bar, p, def);
    _saveSize(p, def);
    positionHandle(bar, handle);
  });

  handle.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const p       = getPosition(bar);
    const vert    = isVertical(p);
    const startX  = e.clientX;
    const startY  = e.clientY;
    const startW  = bar.offsetWidth;
    const startH  = bar.offsetHeight;
    const minSize = get("minSize");
    const maxW    = get("maxWidth");
    const maxH    = get("maxHeight");
    let raf = false;

    const onMove = (ev) => {
      if (raf) return;
      raf = true;
      requestAnimationFrame(() => {
        raf = false;
        let newSize;
        if (vert) {
          const dx = p === "left" ? ev.clientX - startX : startX - ev.clientX;
          newSize  = Math.min(maxW, Math.max(minSize, startW + dx));
          bar.style.width = `${newSize}px`;
        } else {
          const dy = p === "top" ? ev.clientY - startY : startY - ev.clientY;
          newSize  = Math.min(maxH, Math.max(minSize, startH + dy));
          bar.style.height = `${newSize}px`;
        }
        applyAspectRatio(bar, newSize);
        _saveSize(p, newSize);
        positionHandle(bar, handle);
      });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  });

  document.body.appendChild(handle);
  positionHandle(bar, handle);
  _handles.set(bar, handle);
}

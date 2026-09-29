// ============================================================
// Resizable Camera Bar — grid layout engine
// ============================================================
// Strategy: CSS grid on the REAL parent of the .camera-view frames, with explicit
// column tracks. The number of columns/rows decides distribution; frame size is
// the largest aspect-ratio-correct frame that fits its cell.
// Everything is applied as inline !important so it beats Foundry's own CSS.

import { get } from "./settings.js";
import { getPosition, isVertical, isFoundryMinimized, applyAspectRatio } from "./bar-utils.js";

// Set to true to print debug output to the console.
const DEBUG = false;
const _log = (...a) => { if (DEBUG) console.log("[RCB grid]", ...a); };

const GAP = 4; // px between frames

// ─── Public API ──────────────────────────────────────────────

/**
 * Returns true if grid mode is active for the given bar position.
 * @param {"left"|"right"|"top"|"bottom"} pos
 * @returns {boolean}
 */
export function isGridActive(pos) {
  if (!pos) return false;
  try {
    return Boolean(isVertical(pos) ? get("gridVerticalActive") : get("gridHorizontalActive"));
  } catch (_) { return false; }
}

/**
 * Applies or clears grid layout for the given bar.
 * @param {HTMLElement} bar - The #camera-views element.
 */
export function applyGridLayout(bar) {
  if (!bar || bar.id !== "camera-views") return;
  const pos = getPosition(bar);
  if (!pos || isFoundryMinimized(bar)) return;

  const active = isGridActive(pos);
  bar.classList.toggle("rcb-grid-active", active);

  if (!active) {
    _clearGrid(bar);
    const size = isVertical(pos) ? bar.offsetWidth : bar.offsetHeight;
    applyAspectRatio(bar, size);
    return;
  }

  _layout(bar, isVertical(pos));
}

// ─── Helpers ─────────────────────────────────────────────────

/** @returns {{w:number, h:number}|null} null = "free" ratio */
function _ar() {
  const r = get("aspectRatio");
  if (r === "16:9") return { w: 16, h: 9 };
  if (r === "4:3")  return { w: 4,  h: 3 };
  return null;
}

function _minSize() {
  try { return get("minSize"); } catch (_) { return 80; }
}

/** Largest w x h with the given aspect ratio that fits inside the cell. */
function _fit(cellW, cellH, ar) {
  const h = Math.min(cellH, cellW * ar.h / ar.w);
  return { w: Math.floor(h * ar.w / ar.h), h: Math.floor(h) };
}

/**
 * Finds the frames, their real parent container, and the drawable area.
 * The parent is taken from the frames themselves (not assumed to be .scrollable).
 * The area is measured on .scrollable (falls back to the parent) with overflow
 * hidden so a scrollbar never skews the measurement.
 */
function _measure(bar) {
  const frames     = [...bar.querySelectorAll(".camera-view:not(.rcb-dynamic-hide)")];
  const scrollable = bar.querySelector(".scrollable");
  const container  = frames[0]?.parentElement ?? scrollable;
  const ref        = scrollable ?? container;
  if (!ref) return null;

  ref.style.setProperty("overflow", "hidden", "important");
  const cs = getComputedStyle(ref);
  const availW = ref.clientWidth  - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight)  || 0);
  const availH = ref.clientHeight - (parseFloat(cs.paddingTop)  || 0) - (parseFloat(cs.paddingBottom) || 0);
  return { frames, scrollable, container, ref, availW, availH };
}

// ─── Layout ──────────────────────────────────────────────────

function _layout(bar, vert) {
  const m = _measure(bar);
  if (!m) return;
  const { frames, scrollable, container, ref, availW, availH } = m;
  const total = frames.length;
  if (total === 0 || availW <= 0 || availH <= 0) return;

  const minSize = _minSize();
  const ar      = _ar();
  const arCalc  = ar ?? { w: 4, h: 3 }; // "free" still needs a ratio to DECIDE the split
  const max     = vert ? get("verticalMaxFrameWidth") : get("horizontalMaxFrameHeight");
  const auto    = vert ? get("verticalAutoWrap")      : get("horizontalAutoWrap");

  /**
   * Builds the layout for n = columns (vertical) or rows (horizontal).
   * The other axis count is derived so frames are DISTRIBUTED evenly:
   *   horizontal: perRow = ceil(total / rows), vertical: rows = ceil(total / cols).
   * @param {number} n
   * @param {boolean} cap - apply the "max frame" limit (only when autoWrap is off).
   */
  const build = (n, cap) => {
    let cols, rows;
    if (vert) { cols = n; rows = Math.ceil(total / cols); }
    else      { rows = n; cols = Math.ceil(total / rows); rows = Math.ceil(total / cols); }

    let cellW = (availW - GAP * (cols - 1)) / cols;
    let cellH = (availH - GAP * (rows - 1)) / rows;
    if (cap) { if (vert) cellW = Math.min(cellW, max); else cellH = Math.min(cellH, max); }

    const calc = _fit(cellW, cellH, arCalc);
    let w, h;
    if (ar) { const f = _fit(cellW, cellH, ar); w = f.w; h = f.h; }
    else    { w = Math.floor(cellW); h = Math.floor(cellH); }

    // Never go below the module's minimum frame size.
    if (w < minSize) { w = minSize; h = ar ? Math.round(w * ar.h / ar.w) : Math.max(h, minSize); }
    if (h < minSize) { h = minSize; w = ar ? Math.round(h * ar.w / ar.h) : Math.max(w, minSize); }

    return { cols, rows, w, h, area: calc.w * calc.h };
  };

  // Highest n that still respects minSize on the split axis.
  const span = vert ? availW : availH;
  const maxN = Math.max(1, Math.min(total, Math.floor((span + GAP) / (minSize + GAP))));

  let best;
  if (auto) {
    // AutoWrap: ignore max. Pick the n that yields the LARGEST frames. With one
    // column/row the frames are biggest until they stop fitting, so a new
    // column/row appears exactly when the current ones no longer fit.
    for (let n = 1; n <= maxN; n++) {
      const cand = build(n, false);
      if (!best || cand.area > best.area * 1.001) best = cand;
    }
  } else {
    // Max-frame mode: as many columns/rows as needed to keep frames <= max.
    const n = Math.min(maxN, Math.max(1, Math.ceil(span / max)));
    best = build(n, true);
  }

  const { cols, rows, w, h } = best;
  _log(`${vert ? "vertical" : "horizontal"}: ${cols}c x ${rows}r, frame ${w}x${h}, avail ${availW}x${availH}, total ${total}`);

  // Grid on the frames' real parent.
  const cs = container.style;
  cs.setProperty("display",               "grid",                    "important");
  cs.setProperty("grid-template-columns", `repeat(${cols}, ${w}px)`, "important");
  cs.setProperty("grid-auto-rows",        `${h}px`,                  "important");
  cs.setProperty("gap",                   `${GAP}px`,                "important");
  // Vertical bar: centered on both axes. Horizontal bar: centered on X, top-aligned on Y.
  // "safe" falls back to start when content overflows, so nothing becomes unreachable.
  cs.setProperty("justify-content",       "safe center",                    "important");
  cs.setProperty("align-content",         vert ? "safe center" : "start",   "important");
  cs.setProperty("align-items",           "start",                   "important");
  if (container !== scrollable) {
    cs.setProperty("width",      "100%",       "important");
    cs.setProperty("box-sizing", "border-box", "important");
  }

  frames.forEach(f => {
    f.style.setProperty("width",  `${w}px`, "important");
    f.style.setProperty("height", `${h}px`, "important");
  });

  // Hide overflow when it fits; allow scrolling only if minSize forces overflow.
  const needW = cols * w + GAP * (cols - 1);
  const needH = rows * h + GAP * (rows - 1);
  const overflows = needW > availW + 1 || needH > availH + 1;
  ref.style.setProperty("overflow", overflows ? "auto" : "hidden", "important");

  bar.style.setProperty("--av-width",  `${w}px`);
  bar.style.setProperty("--av-height", `${h}px`);
}

// ─── Clear ───────────────────────────────────────────────────

function _clearGrid(bar) {
  bar.style.removeProperty("--rcb-cols");
  bar.style.removeProperty("--rcb-rows");

  const props = ["display", "grid-template-columns", "grid-auto-rows", "gap",
                 "justify-content", "align-content", "align-items",
                 "flex-direction", "flex-wrap", "width", "box-sizing", "overflow"];

  const scrollable = bar.querySelector(".scrollable");
  const first      = bar.querySelector(".camera-view");
  [scrollable, first?.parentElement].forEach(el => {
    if (el) props.forEach(p => el.style.removeProperty(p));
  });

  // ALL frames, including currently hidden ones.
  bar.querySelectorAll(".camera-view").forEach(f => {
    f.style.removeProperty("width");
    f.style.removeProperty("height");
  });
}

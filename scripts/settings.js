// ============================================================
// Resizable Camera Bar — settings registration
// ============================================================

import { MODULE_ID } from "./constants.js";
import { RCBReadmeMenu } from "./readme.js";

/**
 * Shorthand to read a module setting by key.
 * @param {string} key
 * @returns {*}
 */
export function get(key) { return game.settings.get(MODULE_ID, key); }

/**
 * Registers all module settings and the README menu entry.
 * @param {Function} [onGridChange] - Called whenever any grid-related setting changes.
 *   Wired from hooks.js to call applyGridLayout + positionBarIcons on the live bar.
 */
export function registerSettings(onGridChange = () => {}) {
  game.settings.registerMenu(MODULE_ID, "readme", {
    name:       "Resizable Camera Bar — README",
    label:      "Open README",
    hint:       "View usage instructions and a list of all available settings.",
    icon:       "fas fa-book",
    type:       RCBReadmeMenu,
    restricted: false,
  });

  // ─── Core settings (unchanged) ───────────────────────────

  game.settings.register(MODULE_ID, "savedSizes", {
    // scope: "client" (localStorage) is intentional: written on every rAF frame during drag,
    // which would be unacceptable with scope "user" (server round-trip per frame).
    scope: "client", config: false, type: Object,
    default: { left: 200, right: 200, top: 180, bottom: 180 },
  });

  game.settings.register(MODULE_ID, "maxWidth", {
    name:    "Maximum Width (vertical bars)",
    hint:    "Maximum width in pixels for left/right camera bars. Default: 500.",
    scope:   "user", config: true, type: Number, default: 500,
    range:   { min: 100, max: 1000, step: 10 },
  });

  game.settings.register(MODULE_ID, "maxHeight", {
    name:    "Maximum Height (horizontal bars)",
    hint:    "Maximum height in pixels for top/bottom camera bars. Default: 400.",
    scope:   "user", config: true, type: Number, default: 400,
    range:   { min: 60, max: 800, step: 10 },
  });

  game.settings.register(MODULE_ID, "minSize", {
    name:    "Minimum Size",
    hint:    "Minimum width/height in pixels. Prevents the bar from becoming too small. Default: 80.",
    scope:   "user", config: true, type: Number, default: 80,
    range:   { min: 40, max: 200, step: 5 },
  });

  game.settings.register(MODULE_ID, "aspectRatio", {
    name:    "Camera Aspect Ratio",
    hint:    "Controls the --av-width/--av-height CSS variables. 16:9 may crop images if your webcam does not natively stream in widescreen.",
    scope:   "user", config: true, type: String, default: "4:3",
    choices: {
      "4:3":  "4:3 (Default)",
      "16:9": "16:9 (Widescreen — crops unless source is native 16:9)",
      "free": "Free (no ratio lock)",
    },
  });

  game.settings.register(MODULE_ID, "hideNoVideo", {
    name:    "Hide Cameras Without Video",
    hint:    "Automatically hide the slot of any user who is connected but has their camera disabled. Reacts in real time — no reload needed. Default: off.",
    scope:   "user", config: true, type: Boolean, default: false,
  });

  game.settings.register(MODULE_ID, "handleAlwaysVisible", {
    name:    "Handle Always Visible",
    hint:    "Show the resize handle at all times instead of only on hover. Default: off.",
    scope:   "user", config: true, type: Boolean, default: false,
  });

  game.settings.register(MODULE_ID, "handleColor", {
    name:    "Handle & Icon Color",
    hint:    "Color for the resize handle and the eye/warning icons. Enter a hex code or click the swatch to pick. Default: amber (#c8a060).",
    scope:   "user", config: true, type: String, default: "#c8a060",
  });

  game.settings.register(MODULE_ID, "handleOpacity", {
    name:    "Handle Opacity",
    hint:    "Opacity of the handle when visible. 0.1 = very faint, 1.0 = fully opaque. Default: 0.7.",
    scope:   "user", config: true, type: Number, default: 0.7,
    range:   { min: 0.1, max: 1.0, step: 0.05 },
  });

  // ─── Grid Options — Horizontal Bar (top / bottom) ────────
  // All grid settings use scope "user": per-user, per-world.
  // onChange is wired from hooks.js and immediately re-applies layout + updates the toggle icon.

  game.settings.register(MODULE_ID, "gridHorizontalActive", {
    name:     "Horizontal Grid: Enable",
    hint:     "Activates grid layout for top/bottom camera bars. Also toggled via the grid icon on the bar.",
    scope:    "user", config: true, type: Boolean, default: false,
    onChange: onGridChange,
  });

  game.settings.register(MODULE_ID, "horizontalMaxFrameHeight", {
    name:     "Horizontal Grid: Max Frame Height (px)",
    hint:     "Maximum height of a camera frame in grid mode. A bar taller than this gets extra rows. Ignored while Auto-Wrap Rows is on. Default: 150.",
    scope:    "user", config: true, type: Number, default: 150,
    range:    { min: 60, max: 400, step: 10 },
    onChange: onGridChange,
  });

  game.settings.register(MODULE_ID, "horizontalAutoWrap", {
    name:     "Horizontal Grid: Auto-Wrap Rows",
    hint:     "Ignores the max frame height. Keeps frames as large as possible and adds a new row only when they no longer fit in fewer rows.",
    scope:    "user", config: true, type: Boolean, default: false,
    onChange: onGridChange,
  });

  // ─── Grid Options — Vertical Bar (left / right) ──────────

  game.settings.register(MODULE_ID, "gridVerticalActive", {
    name:     "Vertical Grid: Enable",
    hint:     "Activates grid layout for left/right camera bars. Also toggled via the grid icon on the bar.",
    scope:    "user", config: true, type: Boolean, default: false,
    onChange: onGridChange,
  });

  game.settings.register(MODULE_ID, "verticalMaxFrameWidth", {
    name:     "Vertical Grid: Max Frame Width (px)",
    hint:     "Maximum width of a camera frame in grid mode. A bar wider than this gets extra columns. Ignored while Auto-Wrap Columns is on. Default: 170.",
    scope:    "user", config: true, type: Number, default: 170,
    range:    { min: 60, max: 500, step: 10 },
    onChange: onGridChange,
  });

  game.settings.register(MODULE_ID, "verticalAutoWrap", {
    name:     "Vertical Grid: Auto-Wrap Columns",
    hint:     "Ignores the max frame width. Keeps frames as large as possible and adds a new column only when they no longer fit in fewer columns.",
    scope:    "user", config: true, type: Boolean, default: false,
    onChange: onGridChange,
  });
}

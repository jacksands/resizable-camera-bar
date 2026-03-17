// ============================================================
// Resizable Camera Bar — settings registration
// ============================================================

import { MODULE_ID } from "./constants.js";
import { RCBReadmeMenu } from "./readme.js";

/**
 * Shorthand to read a module setting by key.
 * Avoids repeating MODULE_ID at every call site.
 * @param {string} key - Setting key.
 * @returns {*}
 */
export function get(key) { return game.settings.get(MODULE_ID, key); }

/**
 * Registers all module settings and the README menu entry.
 * Called from the Hooks.once("init") handler in hooks.js.
 * @returns {void}
 */
export function registerSettings() {
  game.settings.registerMenu(MODULE_ID, "readme", {
    name:       "Resizable Camera Bar — README",
    label:      "Open README",
    hint:       "View usage instructions and a list of all available settings.",
    icon:       "fas fa-book",
    type:       RCBReadmeMenu,
    restricted: false,
  });

  game.settings.register(MODULE_ID, "savedSizes", {
    // type: Object — o Foundry faz parse/validação internamente.
    // scope: "client" (localStorage) é intencional: escrito em cada frame do drag via rAF,
    // o que seria inaceitável com scope "user" (round-trip ao servidor por frame).
    scope: "client", config: false, type: Object,
    default: { left: 200, right: 200, top: 180, bottom: 180 },
  });

  game.settings.register(MODULE_ID, "maxWidth", {
    name:    "Maximum Width (vertical bars)",
    hint:    "Maximum width in pixels for left/right camera bars. Default: 500.",
    // scope "user": salvo no documento do usuário no servidor — sincroniza entre dispositivos.
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
}

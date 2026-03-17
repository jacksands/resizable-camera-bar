// ============================================================
// Resizable Camera Bar — Foundry hook registrations
// ============================================================

import { MODULE_ID } from "./constants.js";
import { registerSettings } from "./settings.js";
import { initBar, initAllBars } from "./bar-init.js";
import { updateWarningIcon } from "./icons.js";
import { applyNoVideoVisibility, attachVideoListeners } from "./camera-visibility.js";

// ─── Settings change tracker ─────────────────────────────────

/** Tracks whether any setting in our panel was changed since it was opened. */
let _settingsChanged = false;

/** Tracks <section> elements that already have the settings change listener. */
const _listenedSections = new WeakSet();
/** Tracks <input> elements that already have the color picker injected. */
const _injectedPickers = new WeakSet();

// ─── Color picker injection ──────────────────────────────────

/**
 * Injects a native color swatch (<input type="color">) beside the handleColor text input.
 * Both controls stay in sync: swatch updates the text field and vice versa.
 * Called eagerly from renderSettingsConfig; a MutationObserver retries if the
 * tab section hasn't rendered yet.
 * @param {HTMLElement} root - The settings config application element.
 * @returns {boolean} True if the picker was successfully injected or already present.
 */
function _injectColorPicker(root) {
  const section = root?.querySelector(`section[data-tab="${MODULE_ID}"]`)
                ?? root?.querySelector(`[data-tab="${MODULE_ID}"]`);
  if (!section) return false;

  if (!_listenedSections.has(section)) {
    section.addEventListener("change", () => { _settingsChanged = true; }, { passive: true });
    _listenedSections.add(section);
  }

  const textInput = section.querySelector(`input[name="${MODULE_ID}.handleColor"]`);
  if (!textInput || _injectedPickers.has(textInput)) return true;
  _injectedPickers.add(textInput);

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex; align-items:center; gap:6px;";
  textInput.parentNode.insertBefore(wrapper, textInput);
  wrapper.appendChild(textInput);

  textInput.style.cssText = "flex:1; min-width:0; font-family:monospace; font-size:12px;";

  const swatch = document.createElement("input");
  swatch.type  = "color";
  swatch.value = textInput.value || "#c8a060";
  swatch.style.cssText = [
    "width:2.8rem",
    "height:2.2rem",
    "padding:2px 3px",
    "cursor:pointer",
    "border:1px solid #3a3020",
    "border-radius:4px",
    "background:#1a1a1a",
    "flex-shrink:0",
  ].join(";");

  swatch.addEventListener("input", () => {
    textInput.value = swatch.value;
    textInput.dispatchEvent(new Event("change", { bubbles: true }));
  });

  textInput.addEventListener("input", () => {
    const v = textInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) swatch.value = v;
  });

  wrapper.appendChild(swatch);
  return true;
}

// ─── Hooks ───────────────────────────────────────────────────

Hooks.once("init", () => registerSettings());

Hooks.once("ready", () => {
  // A abordagem CSS (rcb-dynamic-hide) funciona independentemente de estado persistente.
  // Limpeza de API nativa removida pois game.webrtc.settings.setUser não existe em todas as versões.
  initAllBars();
});

Hooks.on("renderSettingsConfig", (_app, html) => {
  _settingsChanged = false;

  // Em ApplicationV2 (v13), html é sempre HTMLElement — sem jQuery.
  const root = html instanceof HTMLElement ? html : html?.[0] ?? html;

  if (!_injectColorPicker(root)) {
    const mo = new MutationObserver(() => {
      if (_injectColorPicker(root)) mo.disconnect();
    });
    mo.observe(root, { childList: true, subtree: true });
    // Safety timeout: disconnect after 5 s to avoid a zombie observer.
    setTimeout(() => mo.disconnect(), 5000);
  }
});

Hooks.on("closeSettingsConfig", () => {
  initAllBars();

  if (!_settingsChanged) return;
  _settingsChanged = false;

  foundry.applications.api.DialogV2.wait({
    window:  { title: "Resizable Camera Bar — Settings Saved" },
    classes: ["rcb-dialog"],
    content: `<p style="padding:8px 0; color:#b8a080; font-size:13px; line-height:1.6">
      Changes have been applied where possible.<br>
      A full <strong style="color:#c8a060">page reload</strong> ensures all settings take effect correctly.
    </p>`,
    buttons: [
      {
        action:   "reload",
        label:    "Reload Now",
        icon:     "fas fa-rotate-right",
        callback: () => window.location.reload(),
      },
      {
        action:  "continue",
        label:   "Continue Without Reloading",
        icon:    "fas fa-times",
        default: true,
      },
    ],
  });
});

Hooks.on("renderCameraViews", (_app, html) => {
  // Em ApplicationV2, html é sempre HTMLElement — sem jQuery.
  // Não usamos document.querySelector como fallback: o elemento correto é o recebido pelo hook.
  const el  = html instanceof HTMLElement ? html : html?.[0] ?? html;
  const bar = el?.id === "camera-views"
    ? el
    : el?.querySelector?.("#camera-views");
  if (bar) initBar(bar);
});

Hooks.on("userConnected", (_user, connected) => {
  // Só interessa quando um usuário conecta: ao desconectar, o Foundry remove o slot sozinho.
  if (!connected) return;
  const bar = document.querySelector("#camera-views");
  if (!bar) return;
  // Run once immediately; video event listeners handle stream readiness reactively.
  applyNoVideoVisibility(bar);
  attachVideoListeners(bar);
});

// Quando o GM usa "Hide User" / "Show User", o Foundry re-renderiza a camera bar
// disparando renderCameraViews → initBar → updateWarningIcon automaticamente.
// Adicionamos clientSettingChanged como fallback para capturar o momento exato
// em que a setting é salva, antes do re-render.
Hooks.on("clientSettingChanged", (namespace, key) => {
  if (namespace !== "core" || key !== "avSettings") return;
  const bar = document.querySelector("#camera-views");
  if (!bar) return;
  setTimeout(() => updateWarningIcon(bar), 100);
});

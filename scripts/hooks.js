// ============================================================
// Resizable Camera Bar — Foundry hook registrations
// ============================================================

import { MODULE_ID } from "./constants.js";
import { registerSettings } from "./settings.js";
import { initBar, initAllBars } from "./bar-init.js";
import { updateWarningIcon, positionBarIcons } from "./icons.js";
import { applyNoVideoVisibility, attachVideoListeners } from "./camera-visibility.js";
import { applyGridLayout } from "./grid-layout.js";

// ─── Grid change handler ──────────────────────────────────────

/**
 * Called by onChange for every grid setting.
 * Re-applies grid layout and syncs the toggle icon visual state.
 */
function _onGridChange() {
  const bar = document.querySelector("#camera-views");
  if (!bar) return;
  applyGridLayout(bar);
  positionBarIcons(bar);
}

// ─── Settings change tracker ──────────────────────────────────

let _settingsChanged = false;
const _listenedSections = new WeakSet();
const _injectedPickers  = new WeakSet();

// ─── Color picker injection ───────────────────────────────────

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
    "width:2.8rem", "height:2.2rem", "padding:2px 3px", "cursor:pointer",
    "border:1px solid #3a3020", "border-radius:4px", "background:#1a1a1a", "flex-shrink:0",
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

// ─── Grid section header injection ───────────────────────────

/**
 * Injects visual section headers before the Horizontal and Vertical grid setting groups.
 * Runs inside renderSettingsConfig with a MutationObserver retry.
 * @param {HTMLElement} root
 * @returns {boolean} True when both headers were injected.
 */
function _injectGridHeaders(root) {
  const section = root?.querySelector(`section[data-tab="${MODULE_ID}"]`)
                ?? root?.querySelector(`[data-tab="${MODULE_ID}"]`);
  if (!section) return false;

  const groups = [
    { key: "gridHorizontalActive", label: "Grid Options — Horizontal Bar (top / bottom)" },
    { key: "gridVerticalActive",   label: "Grid Options — Vertical Bar (left / right)"  },
  ];

  let injected = 0;
  for (const { key, label } of groups) {
    const input = section.querySelector(`[name="${MODULE_ID}.${key}"]`);
    const group = input?.closest(".form-group");
    if (!group) continue;
    if (group.previousElementSibling?.classList.contains("rcb-section-header")) {
      injected++;
      continue;
    }
    group.insertAdjacentHTML("beforebegin",
      `<div class="rcb-section-header"><i class="fas fa-border-all"></i> ${label}</div>`
    );
    injected++;
  }

  return injected === groups.length;
}

// ─── Hooks ───────────────────────────────────────────────────

Hooks.once("init", () => registerSettings(_onGridChange));

Hooks.once("ready", () => {
  initAllBars();
});

Hooks.on("renderSettingsConfig", (_app, html) => {
  _settingsChanged = false;
  const root = html instanceof HTMLElement ? html : html?.[0] ?? html;

  // Color picker
  if (!_injectColorPicker(root)) {
    const mo = new MutationObserver(() => {
      if (_injectColorPicker(root)) mo.disconnect();
    });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 5000);
  }

  // Grid section headers
  if (!_injectGridHeaders(root)) {
    const mo = new MutationObserver(() => {
      if (_injectGridHeaders(root)) mo.disconnect();
    });
    mo.observe(root, { childList: true, subtree: true });
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
  const el  = html instanceof HTMLElement ? html : html?.[0] ?? html;
  const bar = el?.id === "camera-views"
    ? el
    : el?.querySelector?.("#camera-views");
  if (bar) initBar(bar);
});

Hooks.on("userConnected", (_user, connected) => {
  if (!connected) return;
  const bar = document.querySelector("#camera-views");
  if (!bar) return;
  applyNoVideoVisibility(bar);
  attachVideoListeners(bar);
  // Recalculate grid because the visible frame count changed.
  applyGridLayout(bar);
});

Hooks.on("clientSettingChanged", (namespace, key) => {
  if (namespace !== "core" || key !== "avSettings") return;
  const bar = document.querySelector("#camera-views");
  if (!bar) return;
  setTimeout(() => updateWarningIcon(bar), 100);
});

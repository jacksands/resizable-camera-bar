// ============================================================
// Resizable Camera Bar — README dialog & menu entry-point
// ============================================================

import { MODULE_ID } from "./constants.js";

/**
 * Opens the native Foundry SettingsConfig and navigates to this module's tab.
 * Uses ApplicationV2 render({ force: true }) — the boolean overload is deprecated in v13.
 * Polls for the tab button because the DOM may not yet contain it at the moment
 * SettingsConfig.render() resolves.
 * @returns {void}
 */
export function openModuleSettings() {
  // Em ApplicationV2 (v13), render() não aceita booleano — usa { force: true }
  new foundry.applications.settings.SettingsConfig().render({ force: true });
  const tryClick = (attempts = 0) => {
    if (attempts > 20) return;
    const tabBtn = document.querySelector(
      `button[data-action="tab"][data-group="categories"][data-tab="${MODULE_ID}"]`
    );
    if (tabBtn) tabBtn.click();
    else setTimeout(() => tryClick(attempts + 1), 50);
  };
  setTimeout(() => tryClick(), 100);
}

/**
 * Returns the inner HTML string for the README dialog content.
 * @returns {string}
 */
function readmeHTML() {
  return `
  <div class="rcb-readme">
    <div class="rcb-readme-section">
      <p>
        Resize the camera bar by dragging the handle on its <strong>inner edge</strong>
        — the side facing the canvas. An
        <i class="fa-regular fa-eye" style="color:#c8a060; opacity:0.8"></i>
        icon lives inside the bar's own controls area, always visible and never covered
        by other UI elements.
      </p>
    </div>
    <div class="rcb-readme-section">
      <div class="rcb-readme-heading"><i class="fas fa-mouse-pointer"></i> How to use</div>
      <ul>
        <li><strong>Hover</strong> over the inner edge of the bar to reveal the handle.</li>
        <li><strong>Drag</strong> the handle to resize the bar.</li>
        <li><strong>Double-click</strong> the handle to reset to the default size.</li>
        <li>Your size is <strong>saved per client</strong> and restored on reload.</li>
        <li>Click the <i class="fa-regular fa-eye"></i> icon inside the bar controls to open Module Settings directly.</li>
      </ul>
    </div>
    <div class="rcb-readme-section">
      <div class="rcb-readme-heading"><i class="fas fa-sliders-h"></i> Available Settings</div>
      <ul>
        <li><strong>Max Width / Max Height:</strong> Size cap for vertical and horizontal bars.</li>
        <li><strong>Min Size:</strong> Prevents the bar from shrinking too small to use.</li>
        <li><strong>Aspect Ratio:</strong> 4:3, 16:9, or Free.
            <em>Note: 16:9 crops images unless your webcam actually streams in widescreen.</em></li>
        <li><strong>Hide Cameras Without Video:</strong> Hides the slot of any user who is connected but not transmitting video. Reacts in real time — no reload needed. Default: off.</li>
        <li><strong>Warning icon ⚠:</strong> Appears when cameras are hidden — by the module or manually by the GM. Hover over it to see exactly who is hidden and why. Manually hidden users can be shown via the Players list (right-click → Show User).</li>
        <li><strong>Handle Always Visible:</strong> Show the handle without needing to hover.</li>
        <li><strong>Handle & Icon Color:</strong> Hex code field + color swatch — edit the code or click the swatch to open the system color picker.</li>
        <li><strong>Handle Opacity:</strong> Opacity when the handle is visible (0.1 – 1.0).</li>
      </ul>
    </div>
    <div class="rcb-readme-footer">
      <button type="button" id="rcb-open-settings-btn" class="rcb-settings-link">
        <i class="fas fa-cog"></i> Open Module Settings
      </button>
      <p class="rcb-readme-note">You can reopen this README anytime via the button in Module Settings.</p>
    </div>
  </div>`;
}

/**
 * Opens the README as a resizable DialogV2 window.
 * Invoked from RCBReadmeMenu._onRender and from the settings button inside the dialog.
 * Applies scroll-wrapper height via ResizeObserver (learn-002 pattern) because
 * DialogV2 does not expose a native scroll container for custom content.
 * @returns {Promise<void>}
 */
export async function showReadme() {
  const { DialogV2 } = foundry.applications.api;

  await DialogV2.wait({
    window:  { title: "Resizable Camera Bar — README", resizable: true },
    classes: ["rcb-dialog"],
    content: readmeHTML(),
    position: { width: 560, height: 520 },
    buttons: [
      { action: "close", label: "Close", icon: "fas fa-times", default: true },
    ],
    render: (arg1, arg2) => {
      // arg2 é a instância do DialogV2 em v13; arg1 pode ser o event
      const dialog = arg2 ?? arg1;
      const appEl  = dialog?.element ?? document.querySelector(".rcb-dialog");
      if (!appEl) return;

      // Conecta botão de settings
      appEl.querySelector("#rcb-open-settings-btn")
        ?.addEventListener("click", () => openModuleSettings());

      // Remove padding do window-content para controle total do layout
      const wc = appEl.querySelector(".window-content");
      if (wc) {
        wc.style.setProperty("padding",  "0",      "important");
        wc.style.setProperty("overflow", "hidden", "important");
      }

      // Aplica altura real ao scroll wrapper (padrão learn-002)
      function recalc() {
        const wcEl  = appEl.querySelector(".window-content");
        const btnEl = appEl.querySelector(".dialog-buttons");
        const scrEl = appEl.querySelector(".rcb-readme");
        if (!wcEl || !scrEl) return;
        const h = wcEl.clientHeight - (btnEl?.offsetHeight ?? 0);
        scrEl.style.setProperty("height",     Math.max(h, 100) + "px", "important");
        scrEl.style.setProperty("max-height", Math.max(h, 100) + "px", "important");
        scrEl.style.setProperty("overflow-y", "scroll",  "important");
        scrEl.style.setProperty("overflow-x", "hidden",  "important");
        scrEl.style.setProperty("flex",       "none",    "important");
      }
      requestAnimationFrame(() => recalc());
      new ResizeObserver(recalc).observe(appEl);
    },
  });
}

/**
 * Minimal ApplicationV2 subclass required by game.settings.registerMenu in v13.
 * Does not render any UI — immediately closes itself and delegates to showReadme().
 * ApplicationV2 requires _renderHTML and _replaceHTML to be implemented even when
 * we intentionally render nothing.
 */
export class RCBReadmeMenu extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id:     "rcb-readme-menu",
    window: { title: "Resizable Camera Bar" },
  };

  /** @returns {null} */
  async _renderHTML()           { return null; }

  /** No DOM to replace — stub satisfies ApplicationV2 contract. */
  async _replaceHTML()          {}

  /**
   * Triggered by AppV2 lifecycle after render. Closes the blank window immediately
   * and opens the actual README dialog.
   * @param {object} _ctx - Render context (unused).
   * @param {object} _opts - Render options (unused).
   * @returns {void}
   */
  async _onRender(_ctx, _opts) {
    // Fecha a janela vazia antes que o Foundry tente mostrá-la,
    // depois abre o README via DialogV2.
    this.close({ animate: false });
    showReadme();
  }
}

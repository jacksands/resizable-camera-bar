// ============================================================
// Resizable Camera Bar — bar icons (eye + warning) & tooltip
// ============================================================

import { get } from "./settings.js";
import { getPosition, isFoundryMinimized, getBarZIndex } from "./bar-utils.js";
import { openModuleSettings } from "./readme.js";

/** @type {WeakMap<HTMLElement, {eye?: HTMLElement, warn?: HTMLElement}>} */
const _barIcons = new WeakMap();

/**
 * Returns (or initialises) the icon state object for a bar.
 * @param {HTMLElement} bar
 * @returns {{eye?: HTMLElement, warn?: HTMLElement}}
 */
export function getBarIcons(bar) {
  if (!_barIcons.has(bar)) _barIcons.set(bar, {});
  return _barIcons.get(bar);
}

/**
 * Removes both icon elements from the DOM and resets the bar's icon state.
 * Called before recreating icons to avoid duplicates on re-init.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function removeBarIcons(bar) {
  const icons = getBarIcons(bar);
  icons.eye?.remove();
  icons.warn?.remove();
  _barIcons.set(bar, {});
}

/**
 * Repositions both icons to the correct corner of the bar using fixed coordinates.
 * Hides icons while the bar is minimized; shows them otherwise.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function positionBarIcons(bar) {
  const pos   = getPosition(bar);
  if (!pos) return;
  const rect  = bar.getBoundingClientRect();
  const icons = getBarIcons(bar);
  const sz    = 22;
  const gap   = 2;

  if (isFoundryMinimized(bar)) {
    if (icons.eye)  icons.eye.style.display  = "none";
    if (icons.warn) icons.warn.style.display = "none";
    return;
  }
  if (icons.eye)  icons.eye.style.display  = "flex";

  let x, y1, y2;
  switch (pos) {
    case "bottom":
      x  = rect.left + 4;
      y1 = rect.top + 4;
      y2 = rect.top + 4 + sz + gap;
      break;
    case "top":
      x  = rect.left + 4;
      y1 = rect.bottom - sz - 4;
      y2 = rect.bottom - sz * 2 - gap - 4;
      break;
    case "left":
      x  = rect.left + 4;
      y1 = rect.top + 4;
      y2 = rect.top + 4 + sz + gap;
      break;
    case "right":
      x  = rect.right - sz - 4;
      y1 = rect.top + 4;
      y2 = rect.top + 4 + sz + gap;
      break;
  }

  if (icons.eye) {
    icons.eye.style.left   = `${x}px`;
    icons.eye.style.top    = `${y1}px`;
    icons.eye.style.width  = `${sz}px`;
    icons.eye.style.height = `${sz}px`;
  }
  if (icons.warn) {
    icons.warn.style.left   = `${x}px`;
    icons.warn.style.top    = `${y2}px`;
    icons.warn.style.width  = `${sz}px`;
    icons.warn.style.height = `${sz}px`;
  }
}

/**
 * Creates eye and warning icon buttons for a bar, removing previous ones first.
 * Both are appended to document.body with position:fixed to avoid clipping.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function createBarIcons(bar) {
  removeBarIcons(bar);
  const pos = getPosition(bar);
  if (!pos) return;

  const color = get("handleColor");
  const zIdx  = String(getBarZIndex(bar) + 1);

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

  document.body.appendChild(eye);
  document.body.appendChild(warn);
  _barIcons.set(bar, { eye, warn });
  positionBarIcons(bar);
}

// ─── Warning tooltip ─────────────────────────────────────────

/** @type {HTMLElement|null} Active tooltip element, if any. */
let _warnTooltip = null;

/**
 * Removes the active warning tooltip from the DOM.
 * @returns {void}
 */
function _hideWarnTooltip() {
  _warnTooltip?.remove();
  _warnTooltip = null;
}

/**
 * Inspects the bar's camera slots to build lists of users hidden by the module
 * and users hidden manually by the GM (whose slots are fully removed from the DOM).
 * @param {HTMLElement} bar
 * @returns {{byModule: string[], manually: string[]}}
 */
function _buildWarnData(bar) {
  // Escondidos pelo módulo: slot existe no DOM com rcb-dynamic-hide
  const byModule = [];
  // Escondidos manualmente pelo Foundry ("Hide User" no menu de contexto):
  //   o Foundry REMOVE o slot do DOM completamente — ao contrário do módulo que preserva o nó.
  //   Detecção: usuário conectado cujo slot NÃO existe no DOM
  //   (e não está listado como escondido pelo módulo).
  //   Não usamos game.webrtc.settings.getUser().hidden — essa flag reflete o estado
  //   de vídeo nas AVSettings do próprio usuário, não o "Hide User" do GM.
  const manually = [];

  // Mapa dos slots presentes no DOM: userId → elemento
  const slotsInDOM = new Map();
  bar.querySelectorAll(".camera-view[data-user]").forEach(view => {
    if (view.dataset.user) slotsInDOM.set(view.dataset.user, view);
  });

  // Classificar: módulo vs manual
  slotsInDOM.forEach((view, userId) => {
    if (view.classList.contains("rcb-dynamic-hide")) {
      byModule.push(game.users.get(userId)?.name ?? userId);
    }
  });

  // Usuários conectados sem slot no DOM → escondidos manualmente pelo Foundry
  game.users.forEach(user => {
    if (!user.active) return;
    if (!slotsInDOM.has(user.id)) {
      manually.push(user.name);
    }
  });

  return { byModule, manually };
}

/**
 * Builds and positions a custom tooltip beside the warning button.
 * Lists users hidden by the module and users hidden manually by the GM.
 * @param {HTMLElement} warnBtn
 * @param {HTMLElement} bar
 * @returns {void}
 */
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

  // Posiciona à direita do botão, ajustando se sair da tela
  const btnRect  = warnBtn.getBoundingClientRect();
  const tipW     = 220;
  const tipH     = tip.offsetHeight || 120;
  let left = btnRect.right + 6;
  let top  = btnRect.top;

  if (left + tipW > window.innerWidth)  left = btnRect.left - tipW - 6;
  if (top  + tipH > window.innerHeight) top  = window.innerHeight - tipH - 8;

  tip.style.left = `${left}px`;
  tip.style.top  = `${top}px`;
}

/**
 * Shows or hides the warning icon based on how many users are currently hidden.
 * Also refreshes the floating tooltip if it is already open.
 * Called by applyNoVideoVisibility and the clientSettingChanged hook.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function updateWarningIcon(bar) {
  const icons = getBarIcons(bar);
  if (!icons.warn) return;

  const { byModule, manually } = _buildWarnData(bar);

  // Mostra o ícone se há escondidos pelo módulo (quando hideNoVideo está ativo)
  // OU se há escondidos manualmente (independente da setting)
  const showByModule = get("hideNoVideo") && byModule.length > 0;
  const showManually = manually.length > 0;

  if (showByModule || showManually) {
    icons.warn.style.display = "flex";
    // Atualiza o painel flutuante se já estiver visível
    if (_warnTooltip) _showWarnTooltip(icons.warn, bar);
  } else {
    icons.warn.style.display = "none";
    _hideWarnTooltip();
  }
  positionBarIcons(bar);
}

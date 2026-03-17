// ============================================================
// Resizable Camera Bar — bar initialisation & observer management
// ============================================================

import { debounce, MAX_INIT_RETRIES } from "./constants.js";
import { get } from "./settings.js";
import {
  getPosition, isFoundryMinimized, clearInlineSize, applySize, loadSize,
} from "./bar-utils.js";
import { createHandle, positionHandle, _handles } from "./handle.js";
import { createBarIcons, positionBarIcons } from "./icons.js";
import { applyNoVideoVisibility, attachVideoListeners } from "./camera-visibility.js";

/** @type {WeakMap<HTMLElement, ResizeObserver>} */
const _resizeObservers   = new WeakMap();
/** @type {WeakMap<HTMLElement, {disconnect: Function}>} */
const _mutationObservers = new WeakMap();
/** @type {WeakMap<HTMLElement, Function>} */
const _windowHandlers    = new WeakMap();

/**
 * Disconnects all observers and removes the window resize listener for a bar.
 * Must be called before re-initialising a bar to prevent duplicate observers.
 * @param {HTMLElement} bar
 * @returns {void}
 */
function cleanupObservers(bar) {
  _resizeObservers.get(bar)?.disconnect();
  _mutationObservers.get(bar)?.disconnect();
  const wh = _windowHandlers.get(bar);
  if (wh) window.removeEventListener("resize", wh);
}

/**
 * Initialises a single camera bar: applies saved size, creates handle and icons,
 * attaches observers, and schedules deferred visibility checks.
 * Guards against bars that haven't yet received a dock-position class.
 * Called by renderCameraViews hook and by closeSettingsConfig hook.
 * @param {HTMLElement} bar - The #camera-views element.
 * @returns {void}
 */
export function initBar(bar, _retries = 0) {
  if (!bar || bar.id !== "camera-views") return;

  const pos = getPosition(bar);
  if (!pos) {
    if (_retries >= MAX_INIT_RETRIES) {
      console.warn("resizable-camera-bar | initBar: position class never appeared, giving up.");
      return;
    }
    setTimeout(() => initBar(bar, _retries + 1), 150);
    return;
  }

  // Limpar observers e handlers ANTES de criar os novos elementos.
  // Se initBar for chamado duas vezes (ex: renderCameraViews + closeSettingsConfig),
  // evita observers duplicados rodando em paralelo.
  cleanupObservers(bar);

  if (!isFoundryMinimized(bar)) {
    applySize(bar, pos, loadSize(pos));
  }

  createHandle(bar);
  createBarIcons(bar);
  applyNoVideoVisibility(bar);
  attachVideoListeners(bar);

  const onWinResize = debounce(() => {
    const h = _handles.get(bar);
    if (h) positionHandle(bar, h);
    positionBarIcons(bar);
  }, 60);
  window.addEventListener("resize", onWinResize);
  _windowHandlers.set(bar, onWinResize);

  // MutationObserver 1: mudanças de classe no próprio bar (minimize/dock/posição).
  const moClass = new MutationObserver(debounce((mutations) => {
    const barClassChanged = mutations.some(
      m => m.target === bar && m.attributeName === "class"
    );

    if (barClassChanged) {
      if (isFoundryMinimized(bar)) {
        clearInlineSize(bar);
        const h = _handles.get(bar);
        if (h) positionHandle(bar, h);
        positionBarIcons(bar);
      } else {
        const newPos = getPosition(bar);
        if (!newPos) return;
        createHandle(bar);
        createBarIcons(bar);
        applySize(bar, newPos, loadSize(newPos));
      }
    }
  }, 80));
  moClass.observe(bar, { attributes: true, attributeFilter: ["class"] });

  // MutationObserver 2: mudanças internas (câmeras entrando/saindo, classes av/no-video).
  // IMPORTANTE: filtra mutações causadas pelo próprio módulo (rcb-dynamic-hide),
  // evitando o loop: applyNoVideoVisibility adiciona classe → observer dispara → applyNoVideoVisibility...
  const moVideo = new MutationObserver(debounce((mutations) => {
    const onlyOwnClass = mutations.every(m =>
      m.type === "attributes" &&
      m.attributeName === "class" &&
      m.target instanceof Element &&
      // Ignora se a única mudança foi adicionar/remover nossa própria classe
      (() => {
        const prev = m.oldValue ?? "";
        const curr = m.target.className ?? "";
        const normalize = s => s.replace(/\brcb-dynamic-hide\b/g, "").replace(/\s+/g, " ").trim();
        return normalize(prev) === normalize(curr);
      })()
    );
    if (onlyOwnClass) return;
    applyNoVideoVisibility(bar);
  }, 80));
  moVideo.observe(bar, {
    subtree:          true,
    attributes:       true,
    attributeFilter:  ["class", "hidden"],
    attributeOldValue: true,
    childList:        true,
  });

  // Armazena os dois observers juntos num único wrapper para cleanup uniforme.
  _mutationObservers.set(bar, {
    disconnect: () => { moClass.disconnect(); moVideo.disconnect(); }
  });

  const ro = new ResizeObserver(debounce(() => {
    const h = _handles.get(bar);
    if (h) positionHandle(bar, h);
    positionBarIcons(bar);
  }, 60));
  ro.observe(bar);
  _resizeObservers.set(bar, ro);
}

/**
 * Locates the #camera-views element in the current document and initialises it.
 * Called from Hooks.once("ready") and from the closeSettingsConfig hook.
 * @returns {void}
 */
export function initAllBars() {
  const bar = document.querySelector("#camera-views");
  if (bar) initBar(bar);
}

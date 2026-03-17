// ============================================================
// Resizable Camera Bar — hide-no-video camera visibility logic
// ============================================================

import { debounce } from "./constants.js";
import { get } from "./settings.js";
import { updateWarningIcon } from "./icons.js";

/** Tracks video elements that already have RCB listeners attached. */
const _listenedVideos = new WeakSet();

/**
 * Returns true when a camera view slot has no active video stream.
 * Checks the no-video class, video element visibility, srcObject, and track state.
 * @param {HTMLElement} view - A .camera-view element.
 * @returns {boolean}
 */
export function isCameraOff(view) {
  if (view.classList.contains("no-video")) return true;
  const video = view.querySelector("video.user-camera");
  if (!video) return true;
  if (video.hidden) return true;

  const src = video.srcObject;
  if (!src) return true;

  const tracks = typeof src.getVideoTracks === "function" ? src.getVideoTracks() : [];
  if (tracks.length === 0) return true;
  return tracks.every(t => !t.enabled || t.readyState === "ended");
}

/**
 * Attaches play/pause/emptied/loadedmetadata listeners to all video elements
 * inside the bar that have not yet been instrumented.
 * A WeakSet prevents duplicate listeners on re-init; entries are
 * garbage-collected when the element is removed from the DOM.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function attachVideoListeners(bar) {
  bar.querySelectorAll("video.user-camera").forEach(video => {
    if (_listenedVideos.has(video)) return;
    _listenedVideos.add(video);
    const update = debounce(() => applyNoVideoVisibility(bar), 80);
    video.addEventListener("play",            update);
    video.addEventListener("pause",           update);
    video.addEventListener("emptied",         update);
    video.addEventListener("loadedmetadata",  update);
  });
}

/**
 * Adds or removes the rcb-dynamic-hide class on each camera slot based on video state.
 * Using a CSS class (display:none) instead of DOM removal preserves the video element
 * in memory so its Play/Pause events remain active for real-time re-detection.
 * @param {HTMLElement} bar
 * @returns {void}
 */
export function applyNoVideoVisibility(bar) {
  const hide = get("hideNoVideo");
  bar.querySelectorAll(".camera-view[data-user]").forEach(view => {
    if (!view.dataset.user) return;

    // A implementação via "display: none" acionada por essa classe anula o gap flexbox,
    // garantindo colapso total (idêntico à UI de hide nativa) SEM destruir o nó DOM,
    // o que preserva os eventos Play/Pause intactos na memória.
    if (hide && isCameraOff(view)) {
      view.classList.add("rcb-dynamic-hide");
    } else {
      view.classList.remove("rcb-dynamic-hide");
    }
  });

  attachVideoListeners(bar);
  updateWarningIcon(bar);
}

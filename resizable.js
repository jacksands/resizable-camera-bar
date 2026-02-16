// ============================================================
// Resizable Camera Bar — v2.5.2
// ============================================================

const MODULE_ID = "resizable-camera-bar";

// ─── Debounce ────────────────────────────────────────────────

function debounce(fn, delay = 100) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ─── Bar helpers ─────────────────────────────────────────────

function getPosition(bar) {
  if (bar.classList.contains("left"))   return "left";
  if (bar.classList.contains("right"))  return "right";
  if (bar.classList.contains("top"))    return "top";
  if (bar.classList.contains("bottom")) return "bottom";
  return null;
}

function isVertical(pos) { return pos === "left" || pos === "right"; }

function innerEdge(pos) {
  return { left: "right", right: "left", top: "bottom", bottom: "top" }[pos];
}

function isFoundryMinimized(bar) {
  return bar.classList.contains("minimized");
}

// ─── Settings shorthand ──────────────────────────────────────

function get(key) { return game.settings.get(MODULE_ID, key); }

// ─── Open Module Settings — navigate directly to our tab ─────

function openModuleSettings() {
  new foundry.applications.settings.SettingsConfig().render(true);
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

// ─── README ──────────────────────────────────────────────────

async function loadInstructionsHTML() {
  try {
    const response = await fetch(`modules/${MODULE_ID}/INSTRUCTIONS.md`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    
    // Convert markdown to styled HTML for the dialog
    let html = markdown
      // Headers - reduced sizes for compact dialog
      .replace(/^### (.+)$/gm, '<h3 style="color:#c8a060; margin:10px 0 6px; font-size:12px; font-weight:600">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color:#c8a060; margin:12px 0 8px; font-size:13px; font-weight:600; border-bottom:1px solid #3a3020; padding-bottom:3px">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color:#c8a060; margin:0 0 10px; font-size:14px; font-weight:600">$1</h1>')
      // Bold, italic, code, emoji
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#c8a060">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#2a2010; padding:1px 3px; border-radius:2px; font-size:11px">$1</code>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr style="border:none; border-top:1px solid #3a3020; margin:10px 0">')
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin:6px 0; color:#b8a080">');

    // Wrap in styled container with more compact spacing
    html = `<div class="rcb-readme" style="padding:8px 12px; line-height:1.5; font-size:12px">
      <p style="margin:6px 0; color:#b8a080">${html}</p>
      <div style="border-top:1px solid #2a2010; padding-top:8px; margin-top:8px; text-align:center">
        <button type="button" id="rcb-open-settings-btn" class="rcb-settings-link">
          <i class="fas fa-cog"></i> Open Module Settings
        </button>
        <p style="margin-top:6px; font-size:10px; color:#5a4a30">
          You can reopen these instructions anytime via the button in Module Settings.
        </p>
      </div>
    </div>`;

    return html;
  } catch (err) {
    console.error(`${MODULE_ID} | Failed to load INSTRUCTIONS.md:`, err);
    return `<div style="padding:20px; color:#c8a060">
      <p>Failed to load instructions.</p>
      <p style="margin-top:10px; font-size:11px; color:#8a7055">Error: ${err.message}</p>
    </div>`;
  }
}

async function showReadme() {
  const { DialogV2 } = foundry.applications.api;
  const content = await loadInstructionsHTML();

  // Wrap content in a scrollable container
  const scrollable = `<div style="max-height:65vh; overflow-y:auto; overflow-x:hidden; padding-right:8px">${content}</div>`;

  await DialogV2.wait({
    window:  { 
      title: "Resizable Camera Bar — Instructions",
      positioned: true 
    },
    position: { width: 520, height: "auto" },
    classes: ["rcb-dialog"],
    content: scrollable,
    buttons: [
      { action: "close", label: "Close", icon: "fas fa-times", default: true },
    ],
    render: (arg1, arg2) => {
      const root = arg2?.element ?? arg1?.element ?? document.querySelector(".rcb-dialog");
      root?.querySelector("#rcb-open-settings-btn")
        ?.addEventListener("click", () => openModuleSettings());
    },
  });
}

// registerMenu type must be an Application subclass.
// ApplicationV2 is the correct V2 base — no deprecation warning.
class RCBReadmeMenu extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id:     "rcb-readme-menu",
    window: { title: "Resizable Camera Bar" },
  };
  // _renderHTML is required by ApplicationV2 but we never actually render this app —
  // render() is overridden to open the README dialog directly.
  async _renderHTML() { return ""; }
  async render() { showReadme(); }
}

// ─── Saved sizes ─────────────────────────────────────────────

const _saveSize = debounce((pos, size) => {
  try {
    const sizes = JSON.parse(get("savedSizes")) || {};
    sizes[pos] = size;
    game.settings.set(MODULE_ID, "savedSizes", JSON.stringify(sizes));
  } catch (e) { console.warn(`${MODULE_ID} | save size error:`, e); }
}, 400);

function loadSize(pos) {
  try {
    const sizes = JSON.parse(get("savedSizes")) || {};
    return typeof sizes[pos] === "number" ? sizes[pos] : defaultSize(pos);
  } catch (_) { return defaultSize(pos); }
}

function defaultSize(pos) { return isVertical(pos) ? 200 : 180; }

// ─── Apply size ──────────────────────────────────────────────

function applySize(bar, pos, size) {
  if (isFoundryMinimized(bar)) return;
  if (isVertical(pos)) bar.style.width  = `${size}px`;
  else                  bar.style.height = `${size}px`;
  applyAspectRatio(bar, size);
}

function clearInlineSize(bar) {
  bar.style.width  = "";
  bar.style.height = "";
}

// ─── Aspect ratio ────────────────────────────────────────────

function applyAspectRatio(bar, size) {
  const ratio = get("aspectRatio");
  if (ratio === "free") return;
  const pos    = getPosition(bar);
  if (!pos) return;
  const [w, h] = ratio === "16:9" ? [16, 9] : [4, 3];
  if (isVertical(pos)) {
    bar.style.setProperty("--av-width",  `${size}px`);
    bar.style.setProperty("--av-height", `${Math.round((size * h) / w)}px`);
  } else {
    bar.style.setProperty("--av-height", `${size}px`);
    bar.style.setProperty("--av-width",  `${Math.round((size * w) / h)}px`);
  }
}



// ─── Fixed bar icons (eye + warning) ─────────────────────────
//
// Both icons live on document.body as position:fixed, positioned
// at the outer corner of the bar — same approach as the handle.
// This is reliable regardless of how many camera slots are visible.

const _barIcons = new WeakMap(); // bar → { eye, warn }

function getBarIcons(bar) {
  if (!_barIcons.has(bar)) _barIcons.set(bar, {});
  return _barIcons.get(bar);
}

function removeBarIcons(bar) {
  const icons = getBarIcons(bar);
  icons.eye?.remove();
  icons.warn?.remove();
  _barIcons.set(bar, {});
}

// Position both icons at the outer corner of the bar (away from canvas),
// stacked vertically: eye on top, warning below.
function positionBarIcons(bar) {
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
  // warn visibility is controlled by updateWarningIcon

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

function createBarIcons(bar) {
  removeBarIcons(bar);
  const pos = getPosition(bar);
  if (!pos) return;

  const color = get("handleColor");
  const zIdx  = String(getBarZIndex(bar) + 1);

  // ── Eye icon ──
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

  // ── Warning icon ──
  const warn = document.createElement("button");
  warn.className = "rcb-warn-btn";
  warn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
  warn.style.cssText = `position:fixed; z-index:${zIdx}; color:${color}; opacity:0.7; display:none;`;
  warn.addEventListener("mouseenter", () => { warn.style.opacity = "1"; });
  warn.addEventListener("mouseleave", () => { warn.style.opacity = "0.7"; });
  warn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    openModuleSettings();
  });

  document.body.appendChild(eye);
  document.body.appendChild(warn);
  _barIcons.set(bar, { eye, warn });
  positionBarIcons(bar);
}

// Update warning icon visibility and tooltip text.
function updateWarningIcon(bar) {
  const icons = getBarIcons(bar);
  if (!icons.warn) return;

  // Count slots hidden: hideNoVideo on + camera is off
  let count = 0;
  if (get("hideNoVideo")) {
    bar.querySelectorAll(".camera-view[data-user]").forEach(view => {
      if (!view.dataset.user) return;
      if (isCameraOff(view)) count++;
    });
  }

  if (count > 0) {
    const plural = count === 1 ? "camera" : "cameras";
    icons.warn.title = `${count} ${plural} hidden — connected but not transmitting video. Click to change in Settings.`;
    icons.warn.style.display = "flex";
  } else {
    icons.warn.style.display = "none";
  }
  positionBarIcons(bar);
}


// ─── Handle (position: fixed on body, z-index = bar's z-index + 1) ───
//
// The handle MUST live outside the bar DOM (fixed on body) so it can
// visually overlap the inner edge without being clipped by the bar's
// overflow. Its z-index is set to match the bar's own stacking level
// so it doesn't float above dialogs, notifications, or other UI.

const _handles = new WeakMap(); // bar → handle element

function getBarZIndex(bar) {
  const z = parseInt(window.getComputedStyle(bar).zIndex);
  return isNaN(z) ? 60 : z;
}

function positionHandle(bar, handle) {
  const pos  = getPosition(bar);
  if (!pos) return;

  if (isFoundryMinimized(bar)) {
    handle.style.display = "none";
    return;
  }
  handle.style.display = "";

  const edge = innerEdge(pos);
  const rect = bar.getBoundingClientRect();

  // z-index: match the bar, not the whole page
  handle.style.zIndex = String(getBarZIndex(bar) + 1);

  // 4px thick (visually thin) × 60% of the bar's relevant dimension (long, easy to find).
  // Long length means the cursor change zone is large even when the handle is invisible.
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

function createHandle(bar) {
  // Remove old handle
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

// ─── Observer cleanup ────────────────────────────────────────

const _resizeObservers   = new WeakMap();
const _mutationObservers = new WeakMap();
const _windowHandlers    = new WeakMap();

function cleanupObservers(bar) {
  _resizeObservers.get(bar)?.disconnect();
  _mutationObservers.get(bar)?.disconnect();
  const wh = _windowHandlers.get(bar);
  if (wh) window.removeEventListener("resize", wh);
}

// ─── Hide no-video cameras ───────────────────────────────────
//
// Detection strategy (all checked, any one is enough to hide):
//   1. .camera-view.no-video        — Foundry class (settles after AV init)
//   2. video[hidden]                — Foundry attribute (set in some versions)
//   3. video.srcObject === null     — most reliable at load time: stream not attached yet
//   4. srcObject has no active video tracks — stream attached but video track disabled/ended
//
// This covers: users who load with camera off, users who join mid-session without camera,
// and users who turn camera off during a session.

function isCameraOff(view) {
  if (view.classList.contains("no-video")) return true;
  const video = view.querySelector("video.user-camera");
  if (!video) return true;        // no video element at all
  if (video.hidden) return true;  // Foundry hid the element

  // srcObject is the most direct signal — null means no stream attached
  const src = video.srcObject;
  if (!src) return true;

  // Stream exists but may have no active video tracks
  const tracks = typeof src.getVideoTracks === "function" ? src.getVideoTracks() : [];
  if (tracks.length === 0) return true;
  return tracks.every(t => !t.enabled || t.readyState === "ended");
}

// Attach play/emptied/loadedmetadata listeners to video elements so we react
// immediately when a stream starts or stops — without relying on DOM mutations.
function attachVideoListeners(bar) {
  bar.querySelectorAll("video.user-camera").forEach(video => {
    if (video._rcbListened) return;
    video._rcbListened = true;
    const update = debounce(() => applyNoVideoVisibility(bar), 80);
    video.addEventListener("play",            update);
    video.addEventListener("pause",           update);
    video.addEventListener("emptied",         update);
    video.addEventListener("loadedmetadata",  update);
  });
}

function applyNoVideoVisibility(bar) {
  const hide = get("hideNoVideo");
  bar.querySelectorAll(".camera-view[data-user]").forEach(view => {
    if (!view.dataset.user) return;
    view.style.visibility = (hide && isCameraOff(view)) ? "hidden" : "";
  });
  attachVideoListeners(bar); // wire up any new video elements
  updateWarningIcon(bar);
}

// ─── Main init ───────────────────────────────────────────────

function initBar(bar) {
  if (!bar || bar.id !== "camera-views") return;

  const pos = getPosition(bar);
  if (!pos) {
    setTimeout(() => initBar(bar), 150);
    return;
  }

  if (!isFoundryMinimized(bar)) {
    applySize(bar, pos, loadSize(pos));
  }

  createHandle(bar);
  createBarIcons(bar);
  applyNoVideoVisibility(bar); // also calls attachVideoListeners
  attachVideoListeners(bar);   // explicit call for elements already in DOM at init

  // Foundry applies AV classes asynchronously after the bar renders.
  // Users who join with camera already off will have no-video set AFTER initBar runs.
  // Re-check at 500ms and 1500ms to catch the settled state.
  setTimeout(() => applyNoVideoVisibility(bar), 500);
  setTimeout(() => applyNoVideoVisibility(bar), 1500);

  cleanupObservers(bar);

  const onWinResize = debounce(() => {
    const h = _handles.get(bar);
    if (h) positionHandle(bar, h);
    positionBarIcons(bar);
  }, 60);
  window.addEventListener("resize", onWinResize);
  _windowHandlers.set(bar, onWinResize);

  // Observer 1: watches only the bar element for class changes
  // (orientation change, Foundry minimize/expand)
  const mo = new MutationObserver(debounce((mutations) => {
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
  mo.observe(bar, { attributes: true, attributeFilter: ["class"] });
  _mutationObservers.set(bar, mo);

  // Observer 2: watches subtree for class/attribute/DOM changes.
  // childList:true catches new .camera-view slots added when a user joins mid-session.
  // attributeFilter catches class="no-video" and video[hidden] changes.
  const moVideo = new MutationObserver(debounce(() => {
    applyNoVideoVisibility(bar); // also calls attachVideoListeners internally
  }, 80));
  moVideo.observe(bar, {
    subtree:         true,
    attributes:      true,
    attributeFilter: ["class", "hidden"],
    childList:       true,
  });
  // Store second observer alongside the first (reuse same WeakMap with a wrapper)
  const existingMo = _mutationObservers.get(bar);
  _mutationObservers.set(bar, {
    disconnect: () => { existingMo.disconnect(); moVideo.disconnect(); }
  });

  const ro = new ResizeObserver(debounce(() => {
    const h = _handles.get(bar);
    if (h) positionHandle(bar, h);
    positionBarIcons(bar);
  }, 60));
  ro.observe(bar);
  _resizeObservers.set(bar, ro);
}

function initAllBars() {
  const bar = document.querySelector("#camera-views");
  if (bar) initBar(bar);
}

// ─── Settings registration ───────────────────────────────────

Hooks.once("init", () => {

  game.settings.registerMenu(MODULE_ID, "readme", {
    name:       "Resizable Camera Bar — Instructions",
    label:      "Open Instructions",
    hint:       "View usage instructions and a list of all available settings.",
    icon:       "fas fa-book",
    type:       RCBReadmeMenu,
    restricted: false,
  });

  game.settings.register(MODULE_ID, "savedSizes", {
    scope: "client", config: false, type: String,
    default: JSON.stringify({ left: 200, right: 200, top: 180, bottom: 180 }),
  });

  game.settings.register(MODULE_ID, "maxWidth", {
    name:    "Maximum Width (vertical bars)",
    hint:    "Maximum width in pixels for left/right camera bars. Default: 500.",
    scope:   "client", config: true, type: Number, default: 500,
    range:   { min: 100, max: 1000, step: 10 },
  });

  game.settings.register(MODULE_ID, "maxHeight", {
    name:    "Maximum Height (horizontal bars)",
    hint:    "Maximum height in pixels for top/bottom camera bars. Default: 400.",
    scope:   "client", config: true, type: Number, default: 400,
    range:   { min: 60, max: 800, step: 10 },
  });

  game.settings.register(MODULE_ID, "minSize", {
    name:    "Minimum Size",
    hint:    "Minimum width/height in pixels. Prevents the bar from becoming too small. Default: 80.",
    scope:   "client", config: true, type: Number, default: 80,
    range:   { min: 40, max: 200, step: 5 },
  });

  game.settings.register(MODULE_ID, "aspectRatio", {
    name:    "Camera Aspect Ratio",
    hint:    "Controls the --av-width/--av-height CSS variables. 16:9 may crop images if your webcam does not natively stream in widescreen.",
    scope:   "client", config: true, type: String, default: "4:3",
    choices: {
      "4:3":  "4:3 (Default)",
      "16:9": "16:9 (Widescreen — crops unless source is native 16:9)",
      "free": "Free (no ratio lock)",
    },
  });

  game.settings.register(MODULE_ID, "hideNoVideo", {
    name:    "Hide Cameras Without Video",
    hint:    "Automatically hide the slot of any user who is connected but has their camera disabled. Reacts in real time — no reload needed. Default: off.",
    scope:   "client", config: true, type: Boolean, default: false,
  });

  game.settings.register(MODULE_ID, "handleAlwaysVisible", {
    name:    "Handle Always Visible",
    hint:    "Show the resize handle at all times instead of only on hover. Default: off.",
    scope:   "client", config: true, type: Boolean, default: false,
  });

  game.settings.register(MODULE_ID, "handleColor", {
    name:    "Handle & Icon Color",
    hint:    "Color for the resize handle and the eye/warning icons. Enter a hex code or click the swatch to pick. Default: amber (#c8a060).",
    scope:   "client", config: true, type: String, default: "#c8a060",
  });

  game.settings.register(MODULE_ID, "handleOpacity", {
    name:    "Handle Opacity",
    hint:    "Opacity of the handle when visible. 0.1 = very faint, 1.0 = fully opaque. Default: 0.7.",
    scope:   "client", config: true, type: Number, default: 0.7,
    range:   { min: 0.1, max: 1.0, step: 0.05 },
  });
});

// ─── Hooks ───────────────────────────────────────────────────

Hooks.once("ready", () => {
  initAllBars();
});

// Track if any of our settings changed during a settings session
let _settingsChanged = false;

function _injectColorPicker(root) {
  const section = root?.querySelector(`section[data-tab="${MODULE_ID}"]`)
                ?? root?.querySelector(`[data-tab="${MODULE_ID}"]`);
  if (!section) return false;

  // Attach change listener if not already done
  if (!section._rcbChangeListened) {
    section.addEventListener("change", () => { _settingsChanged = true; }, { passive: true });
    section._rcbChangeListened = true;
  }

  const textInput = section.querySelector(`input[name="${MODULE_ID}.handleColor"]`);
  if (!textInput || textInput._rcbPickerInjected) return true;
  textInput._rcbPickerInjected = true;

  // Wrap text input + color swatch in a flex row
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex; align-items:center; gap:6px;";
  textInput.parentNode.insertBefore(wrapper, textInput);
  wrapper.appendChild(textInput);

  // Style the existing text input to show hex code
  textInput.style.cssText = "flex:1; min-width:0; font-family:monospace; font-size:12px;";

  // Color swatch — clicking opens the system color picker
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

  // Keep in sync: picker → text
  swatch.addEventListener("input", () => {
    textInput.value = swatch.value;
    textInput.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Keep in sync: text → picker (validate hex first)
  textInput.addEventListener("input", () => {
    const v = textInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) swatch.value = v;
  });

  wrapper.appendChild(swatch);
  return true;
}

Hooks.on("renderSettingsConfig", (_app, html) => {
  _settingsChanged = false;

  const root = html instanceof jQuery ? html[0] : html;

  // Watch for any input change inside our module's settings section
  const section = root?.querySelector(`section[data-tab="${MODULE_ID}"]`)
                ?? root?.querySelector(`[data-tab="${MODULE_ID}"]`);
  if (section) {
    section.addEventListener("change", () => { _settingsChanged = true; }, { passive: true });
  }

  // Replace handleColor text input with native color picker.
  // In v13 tabbed settings the section may not be in the DOM yet — poll for it.
  if (!_injectColorPicker(root)) {
    let attempts = 0;
    const poll = setInterval(() => {
      if (_injectColorPicker(root) || ++attempts > 30) clearInterval(poll);
    }, 100);
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
  const el  = (typeof jQuery !== "undefined" && html instanceof jQuery) ? html[0] : html;
  const bar = el?.id === "camera-views"
    ? el
    : (el?.querySelector?.("#camera-views") ?? document.querySelector("#camera-views"));
  if (bar) initBar(bar);
});

// Fires whenever a user connects OR disconnects.
// When someone joins with camera already off, Foundry re-renders the camera bar
// but the no-video class is applied asynchronously after render.
// Re-check at intervals to catch the settled state.
Hooks.on("userConnected", (_user, _connected) => {
  const bar = document.querySelector("#camera-views");
  if (!bar) return;
  // AV state settles at different speeds — stagger re-checks
  const check = () => { applyNoVideoVisibility(bar); attachVideoListeners(bar); };
  setTimeout(check, 300);
  setTimeout(check, 1000);
  setTimeout(check, 3000);
});

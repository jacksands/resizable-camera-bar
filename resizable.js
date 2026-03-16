// ============================================================
// Resizable Camera Bar — v2.0.6
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

// ─── README ──────────────────────────────────────────────────

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

async function showReadme() {
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

// registerMenu em v13 exige subclasse de ApplicationV2.
// ApplicationV2 puro tem _renderHTML e _replaceHTML como métodos abstratos.
// Implementamos os dois manualmente com stubs mínimos — não queremos renderizar
// nada, apenas interceptar _onRender para abrir o DialogV2 do README.
class RCBReadmeMenu extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id:     "rcb-readme-menu",
    window: { title: "Resizable Camera Bar" },
  };
  // Contrato mínimo: _renderHTML retorna o dado que _replaceHTML vai receber.
  async _renderHTML()           { return null; }
  // Contrato mínimo: _replaceHTML não precisa fazer nada (não há DOM para atualizar).
  async _replaceHTML()          {}
  async _onRender(_ctx, _opts) {
    // Fecha a janela vazia antes que o Foundry tente mostrá-la,
    // depois abre o README via DialogV2.
    this.close({ animate: false });
    showReadme();
  }
}

// ─── Saved sizes ─────────────────────────────────────────────

const _saveSize = debounce((pos, size) => {
  try {
    // game.settings.get retorna o objeto diretamente (type: Object).
    // Copia rasa para não mutar o objeto retornado pelo Foundry.
    const sizes = Object.assign({}, get("savedSizes"));
    sizes[pos] = size;
    game.settings.set(MODULE_ID, "savedSizes", sizes);
  } catch (e) { console.warn(`${MODULE_ID} | save size error:`, e); }
}, 400);

function loadSize(pos) {
  try {
    const sizes = get("savedSizes") ?? {};
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

const _barIcons = new WeakMap();

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

// ─── Warning tooltip customizado ─────────────────────────────

let _warnTooltip = null;

function _hideWarnTooltip() {
  _warnTooltip?.remove();
  _warnTooltip = null;
}

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

function updateWarningIcon(bar) {
  const icons = getBarIcons(bar);
  if (!icons.warn) return;

  const { byModule, manually } = _buildWarnData(bar);
  const total = byModule.length + manually.length;

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

// ─── Handle ──────────────────────────────────────────────────

const _handles = new WeakMap();

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

  handle.style.zIndex = String(getBarZIndex(bar) + 1);

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

function isCameraOff(view) {
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

// ─── Main init ───────────────────────────────────────────────

function initBar(bar) {
  if (!bar || bar.id !== "camera-views") return;

  const pos = getPosition(bar);
  if (!pos) {
    setTimeout(() => initBar(bar), 150);
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

  setTimeout(() => applyNoVideoVisibility(bar), 500);
  setTimeout(() => applyNoVideoVisibility(bar), 1500);

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

function initAllBars() {
  const bar = document.querySelector("#camera-views");
  if (bar) initBar(bar);
}

// ─── Settings registration ───────────────────────────────────

Hooks.once("init", () => {

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
});

// ─── Hooks ───────────────────────────────────────────────────

Hooks.once("ready", () => {
  // A abordagem CSS (rcb-dynamic-hide) funciona independentemente de estado persistente.
  // Limpeza de API nativa removida pois game.webrtc.settings.setUser não existe em todas as versões.
  initAllBars();
});

let _settingsChanged = false;

function _injectColorPicker(root) {
  const section = root?.querySelector(`section[data-tab="${MODULE_ID}"]`)
                ?? root?.querySelector(`[data-tab="${MODULE_ID}"]`);
  if (!section) return false;

  if (!section._rcbChangeListened) {
    section.addEventListener("change", () => { _settingsChanged = true; }, { passive: true });
    section._rcbChangeListened = true;
  }

  const textInput = section.querySelector(`input[name="${MODULE_ID}.handleColor"]`);
  if (!textInput || textInput._rcbPickerInjected) return true;
  textInput._rcbPickerInjected = true;

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

Hooks.on("renderSettingsConfig", (_app, html) => {
  _settingsChanged = false;

  // Em ApplicationV2 (v13), html é sempre HTMLElement — sem jQuery.
  const root = html instanceof HTMLElement ? html : html?.[0] ?? html;

  const section = root?.querySelector(`section[data-tab="${MODULE_ID}"]`)
                ?? root?.querySelector(`[data-tab="${MODULE_ID}"]`);
  if (section) {
    section.addEventListener("change", () => { _settingsChanged = true; }, { passive: true });
  }

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
  const check = () => { applyNoVideoVisibility(bar); attachVideoListeners(bar); };
  setTimeout(check, 300);
  setTimeout(check, 1000);
  setTimeout(check, 3000);
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
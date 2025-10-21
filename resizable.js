// --- debounce para performance ---
function debounce(fn, delay = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// --- função que ajusta altura/largura proporcionalmente ---
function atualizarAlturaCamera(barra) {
  if (!barra || barra.id !== "camera-views") return; // <- só atua em #camera-views

  const altura = barra.offsetHeight;
  barra.style.setProperty("--av-height", `${altura}px`);
  barra.style.setProperty("--av-width", `${(altura * 4) / 3}px`);
}

// --- função que monitora redimensionamentos ---
function monitorarBarra(barra) {
  if (!barra || barra.id !== "camera-views") return; // <- reforço

  const atualizar = debounce(() => atualizarAlturaCamera(barra), 100);
  atualizar();

  window.addEventListener("resize", atualizar);
  new ResizeObserver(atualizar).observe(barra);
}

// --- inicialização principal ---
function inicializarBarrasCamera() {
  // busca SOMENTE as barras de câmera
  const barras = document.querySelectorAll("#camera-views.horizontal.top, #camera-views.horizontal.bottom");
  barras.forEach(monitorarBarra);
}

// --- hooks principais ---
Hooks.once("ready", inicializarBarrasCamera);

// --- reanexa quando Foundry redesenhar as câmeras ---
Hooks.on("renderCameraViews", (app, html) => {
  const barra = html[0]?.closest("#camera-views");
  if (barra) monitorarBarra(barra);
});

// --- reforço para mudanças de estado do usuário (ex: áudio/vídeo) ---
Hooks.on("updateUser", (user, data) => {
  if (data?.permissions || data?.flags?.webrtc) {
    inicializarBarrasCamera();
  }
});

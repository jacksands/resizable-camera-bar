// === debounce para performance ===
function debounce(fn, delay = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// === função que ajusta altura/largura proporcionalmente ===
function atualizarDimensaoCamera(barra) {
  if (!barra || barra.id !== "camera-views") return;

  // Verifica se a barra é vertical ou horizontal
  const isVertical = barra.classList.contains("vertical") || barra.classList.contains("left") || barra.classList.contains("right");

  if (isVertical) {
    // Barra lateral — usa largura como base
    const largura = barra.offsetWidth;
    barra.style.setProperty("--av-width", `${largura}px`);
    barra.style.setProperty("--av-height", `${(largura * 3) / 4}px`);
  } else {
    // Barra superior/inferior — usa altura como base
    const altura = barra.offsetHeight;
    barra.style.setProperty("--av-height", `${altura}px`);
    barra.style.setProperty("--av-width", `${(altura * 4) / 3}px`);
  }
}

// === função que monitora redimensionamentos ===
function monitorarBarra(barra) {
  if (!barra || barra.id !== "camera-views") return;

  const atualizar = debounce(() => atualizarDimensaoCamera(barra), 100);
  atualizar();

  window.addEventListener("resize", atualizar);
  new ResizeObserver(atualizar).observe(barra);
}

// === inicialização principal ===
function inicializarBarrasCamera() {
  // Agora inclui todas as posições possíveis
  const barras = document.querySelectorAll("#camera-views.horizontal.top, #camera-views.horizontal.bottom, #camera-views.left, #camera-views.right");
  barras.forEach(monitorarBarra);
}

// === hooks principais ===
Hooks.once("ready", inicializarBarrasCamera);

// === reanexa quando Foundry redesenhar as câmeras ===
Hooks.on("renderCameraViews", (app, html) => {
  const barra = html[0]?.closest("#camera-views");
  if (barra) monitorarBarra(barra);
});

// === reforço para mudanças de estado do usuário (ex: áudio/vídeo) ===
Hooks.on("updateUser", (user, data) => {
  if (data?.permissions || data?.flags?.webrtc) {
    inicializarBarrasCamera();
  }
});

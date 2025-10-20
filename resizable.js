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
  if (!barra) return;

  const altura = barra.offsetHeight;
  barra.style.setProperty("--av-height", `${altura}px`);
  barra.style.setProperty("--av-width", `${(altura * 4) / 3}px`);
}

// --- função que monitora redimensionamentos ---
function monitorarBarra(barra) {
  if (!barra) return;

  const atualizar = debounce(() => atualizarAlturaCamera(barra), 100);
  atualizar(); // executa uma vez ao iniciar

  window.addEventListener("resize", atualizar);
  new ResizeObserver(atualizar).observe(barra);
}

// --- função principal para iniciar ou reiniciar o sistema ---
function inicializarBarrasCamera() {
  const barras = document.querySelectorAll("#camera-views.horizontal.top, #camera-views.horizontal.bottom");
  barras.forEach(monitorarBarra);
}

// --- ganchos principais ---
Hooks.once("ready", inicializarBarrasCamera);

// --- reanexa quando o Foundry redesenhar as câmeras ---
Hooks.on("renderCameraViews", inicializarBarrasCamera);

// --- blindagem futura: se algum outro hook interno atualizar a UI ---
Hooks.on("updateUser", (user, data) => {
  if (data?.permissions || data?.flags?.webrtc) {
    inicializarBarrasCamera();
  }
});

// Função para atualizar as variáveis com base na altura do container
function atualizarAlturaCamera(barra) {
  if (!barra) return;

  const altura = barra.offsetHeight; // pega a altura atual da barra
  barra.style.setProperty("--av-height", altura + "px"); // define a var CSS
  barra.style.setProperty("--av-width", (altura * 4 / 3) + "px"); // mantém proporção 4:3
}

Hooks.on("ready", () => {
  // Seleciona as duas barras
  const barras = document.querySelectorAll("#camera-views.horizontal.top, #camera-views.horizontal.bottom");

  barras.forEach(barra => {
    // Atualiza ao carregar
    atualizarAlturaCamera(barra);

    // Atualiza ao redimensionar janela
    window.addEventListener("resize", () => atualizarAlturaCamera(barra));

    // Atualiza se a barra for redimensionada manualmente
    new ResizeObserver(() => atualizarAlturaCamera(barra)).observe(barra);
  });
});


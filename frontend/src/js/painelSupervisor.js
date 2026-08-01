const modal = document.querySelector("#modal-presenca");
const tituloModal = document.querySelector("#titulo-modal");

const botaoAdicionar = document.querySelector(
  "#botao-adicionar-presenca"
);

const botaoAbrirModalMenu = document.querySelector(
  "#botao-abrir-modal-menu"
);

const botaoFecharModal = document.querySelector(
  "#botao-fechar-modal"
);

const botaoCancelarModal = document.querySelector(
  "#botao-cancelar-modal"
);

const modalOverlay = document.querySelector("#modal-overlay");

const formulario = document.querySelector("#form-presenca");

const campoData = document.querySelector("#data-presenca");
const campoJustificativa = document.querySelector("#justificativa");

const contadorJustificativa = document.querySelector(
  "#contador-justificativa"
);

const grupoHorario = document.querySelector("#grupo-horario");
const campoHorario = document.querySelector("#horario-presenca");

function obterDataAtual() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function abrirModalAdicionar() {
  formulario.reset();

  tituloModal.textContent = "Adicionar presença";

  campoData.value = obterDataAtual();

  grupoHorario.hidden = true;
  campoHorario.required = false;

  contadorJustificativa.textContent = "0/200";

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function abrirModalCorrecao() {
  formulario.reset();

  tituloModal.textContent = "Corrigir presença";

  campoData.value = obterDataAtual();

  grupoHorario.hidden = false;
  campoHorario.required = true;

  contadorJustificativa.textContent = "0/200";

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function fecharModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

campoJustificativa.addEventListener("input", () => {
  contadorJustificativa.textContent =
    `${campoJustificativa.value.length}/200`;
});

botaoAdicionar.addEventListener("click", abrirModalAdicionar);
botaoAbrirModalMenu.addEventListener("click", abrirModalAdicionar);

botaoFecharModal.addEventListener("click", fecharModal);
botaoCancelarModal.addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", fecharModal);

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !modal.hidden) {
    fecharModal();
  }
});

document
  .querySelectorAll(".botao-adicionar")
  .forEach((botao) => {
    botao.addEventListener("click", abrirModalAdicionar);
  });

document
  .querySelectorAll(".botao-corrigir")
  .forEach((botao) => {
    botao.addEventListener("click", abrirModalCorrecao);
  });

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  console.log("Dados do formulário:", {
    alunoId: formulario.alunoId.value,
    data: formulario.data.value,
    horario: formulario.horario.value,
    justificativa: formulario.justificativa.value,
    tipoRegistro: formulario.tipoRegistro.value,
  });

  fecharModal();
});
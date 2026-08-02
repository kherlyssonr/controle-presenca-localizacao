const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const token = sessionStorage.getItem("token");

const elementos = {
  nomeSupervisor: document.querySelector(
    "#nome-supervisor-menu"
  ),

  avatarSupervisor: document.querySelector(
    "#avatar-supervisor"
  ),

  dataPainel: document.querySelector("#data-painel"),

  totalAlunos: document.querySelector("#total-alunos"),

  totalRegistraram: document.querySelector(
    "#total-registraram"
  ),

  totalNaoRegistraram: document.querySelector(
    "#total-nao-registraram"
  ),

  campoBusca: document.querySelector("#campo-busca"),

  tabelaCorpo: document.querySelector(
    "#tabela-alunos-corpo"
  ),

  mensagemLista: document.querySelector(
    "#mensagem-lista"
  ),

  botaoAdicionar: document.querySelector(
    "#botao-adicionar-presenca"
  ),

  botaoAbrirModalMenu: document.querySelector(
    "#botao-abrir-modal-menu"
  ),

  botaoExportar: document.querySelector(
    "#botao-exportar-csv"
  ),

  botaoSair: document.querySelector("#botao-sair"),

  modal: document.querySelector("#modal-presenca"),

  modalOverlay: document.querySelector("#modal-overlay"),

  tituloModal: document.querySelector("#titulo-modal"),

  botaoFecharModal: document.querySelector(
    "#botao-fechar-modal"
  ),

  botaoCancelarModal: document.querySelector(
    "#botao-cancelar-modal"
  ),

  formulario: document.querySelector("#form-presenca"),

  selectAluno: document.querySelector("#select-aluno"),

  campoData: document.querySelector("#data-presenca"),

  grupoHorario: document.querySelector("#grupo-horario"),

  campoHorario: document.querySelector(
    "#horario-presenca"
  ),

  campoJustificativa: document.querySelector(
    "#justificativa"
  ),

  contadorJustificativa: document.querySelector(
    "#contador-justificativa"
  ),

  mensagemModal: document.querySelector(
    "#mensagem-modal"
  ),

  botaoSalvar: document.querySelector(
    "#botao-salvar-presenca"
  ),
};

let modoModal = "ADICIONAR";
let presencaSelecionadaId = null;
let alunosCompletos = [];
let dataAtualBanco = "";
let temporizadorBusca = null;

function redirecionarParaLogin() {
  sessionStorage.clear();
  window.location.replace("/login-teste.html");
}

function formatarData(valor) {
  if (!valor) {
    return "--";
  }

  const dataSemHorario = String(valor).slice(0, 10);
  const [ano, mes, dia] = dataSemHorario.split("-");

  if (!ano || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}

function formatarHorario(valor) {
  if (!valor) {
    return "—";
  }

  return String(valor).slice(0, 5);
}

function formatarTipoRegistro(tipo) {
  if (tipo === "AUTOMATICO") {
    return "Automático";
  }

  if (tipo === "MANUAL") {
    return "Manual";
  }

  return "—";
}

function obterDataLocalIso() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function alterarEstadoBotao(botao, carregando, textoNormal) {
  botao.disabled = carregando;

  if (carregando) {
    botao.dataset.textoOriginal =
      botao.dataset.textoOriginal || botao.textContent.trim();

    botao.textContent = "Aguarde...";
    return;
  }

  botao.textContent =
    textoNormal ||
    botao.dataset.textoOriginal ||
    botao.textContent;
}

function exibirMensagemLista(texto, tipo = "") {
  elementos.mensagemLista.textContent = texto;
  elementos.mensagemLista.className = "mensagem-lista";

  if (tipo) {
    elementos.mensagemLista.classList.add(
      `mensagem-lista--${tipo}`
    );
  }
}

function limparMensagemLista() {
  elementos.mensagemLista.textContent = "";
  elementos.mensagemLista.className = "mensagem-lista";
}

function exibirMensagemModal(texto, tipo = "") {
  elementos.mensagemModal.textContent = texto;
  elementos.mensagemModal.className = "mensagem-modal";

  if (tipo) {
    elementos.mensagemModal.classList.add(
      `mensagem-modal--${tipo}`
    );
  }
}

function limparMensagemModal() {
  elementos.mensagemModal.textContent = "";
  elementos.mensagemModal.className = "mensagem-modal";
}

async function fazerRequisicao(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,

    headers: {
      Authorization: `Bearer ${token}`,
      ...opcoes.headers,
    },
  });

  let dados = {};

  try {
    dados = await resposta.json();
  } catch {
    dados = {};
  }

  if (resposta.status === 401) {
    redirecionarParaLogin();
    throw new Error("Sua sessão expirou.");
  }

  if (!resposta.ok) {
    const erro = new Error(
      dados.mensagem ||
        "Não foi possível concluir a operação."
    );

    erro.status = resposta.status;
    erro.dados = dados;

    throw erro;
  }

  return dados;
}

async function carregarPerfil() {
  const dados = await fazerRequisicao("/auth/me");

  if (dados.usuario.tipo !== "SUPERVISOR") {
    redirecionarParaLogin();
    return;
  }

  elementos.nomeSupervisor.textContent =
    dados.usuario.nome;

  elementos.avatarSupervisor.textContent =
    dados.usuario.nome
      .trim()
      .charAt(0)
      .toUpperCase();

  sessionStorage.setItem(
    "usuario",
    JSON.stringify(dados.usuario)
  );
}

async function carregarResumo() {
  const dados = await fazerRequisicao(
    "/supervisor/resumo-hoje"
  );

  dataAtualBanco = dados.data;

  elementos.dataPainel.textContent = formatarData(
    dados.data
  );

  elementos.totalAlunos.textContent =
    dados.resumo.totalAlunos;

  elementos.totalRegistraram.textContent =
    dados.resumo.registraramHoje;

  elementos.totalNaoRegistraram.textContent =
    dados.resumo.naoRegistraramHoje;
}

function criarCelula(rotulo, conteudo) {
  const celula = document.createElement("td");

  celula.dataset.label = rotulo;

  if (conteudo instanceof Node) {
    celula.appendChild(conteudo);
  } else {
    celula.textContent = conteudo;
  }

  return celula;
}

function criarStatus(aluno) {
  const status = document.createElement("span");

  status.classList.add("status");

  if (aluno.status === "Registrou") {
    status.classList.add("status--registrado");
  } else {
    status.classList.add("status--nao-registrado");
  }

  status.textContent = aluno.status;

  return status;
}

function criarBotaoAcao(aluno) {
  const botao = document.createElement("button");

  botao.type = "button";
  botao.classList.add("botao-tabela");

  if (aluno.presencaId) {
    botao.classList.add("botao-corrigir");
    botao.textContent = "Corrigir";

    botao.setAttribute(
      "aria-label",
      `Corrigir presença de ${aluno.nome}`
    );

    botao.addEventListener("click", () => {
      abrirModalCorrecao(aluno);
    });

    return botao;
  }

  botao.classList.add("botao-adicionar");
  botao.textContent = "Adicionar";

  botao.setAttribute(
    "aria-label",
    `Adicionar presença para ${aluno.nome}`
  );

  botao.addEventListener("click", () => {
    abrirModalAdicionar(aluno);
  });

  return botao;
}

function renderizarAlunos(alunos) {
  elementos.tabelaCorpo.replaceChildren();
  limparMensagemLista();

  if (alunos.length === 0) {
    exibirMensagemLista(
      "Nenhum aluno foi encontrado."
    );

    return;
  }

  alunos.forEach((aluno) => {
    const linha = document.createElement("tr");

    linha.appendChild(
      criarCelula("Nome", aluno.nome)
    );

    linha.appendChild(
      criarCelula("Matrícula", aluno.matricula)
    );

    linha.appendChild(
      criarCelula(
        "Horário",
        formatarHorario(aluno.horario)
      )
    );

    linha.appendChild(
      criarCelula("Status", criarStatus(aluno))
    );

    linha.appendChild(
      criarCelula(
        "Tipo",
        formatarTipoRegistro(aluno.tipoRegistro)
      )
    );

    linha.appendChild(
      criarCelula("Ação", criarBotaoAcao(aluno))
    );

    elementos.tabelaCorpo.appendChild(linha);
  });
}

function preencherSelectAlunos(alunoSelecionado = null) {
  elementos.selectAluno.replaceChildren();

  const opcaoInicial = document.createElement("option");

  opcaoInicial.value = "";
  opcaoInicial.textContent = "Selecione o aluno";

  elementos.selectAluno.appendChild(opcaoInicial);

  const alunosSemPresenca = alunosCompletos.filter(
    (aluno) => !aluno.presencaId
  );

  alunosSemPresenca.forEach((aluno) => {
    const opcao = document.createElement("option");

    opcao.value = aluno.id;
    opcao.textContent =
      `${aluno.nome} — ${aluno.matricula}`;

    elementos.selectAluno.appendChild(opcao);
  });

  if (alunoSelecionado) {
    elementos.selectAluno.value = String(
      alunoSelecionado.id
    );
  }
}

async function carregarAlunos(busca = "") {
  exibirMensagemLista("Carregando alunos...");

  const parametroBusca = encodeURIComponent(busca);

  try {
    const dados = await fazerRequisicao(
      `/supervisor/alunos-hoje?busca=${parametroBusca}`
    );

    if (!busca) {
      alunosCompletos = dados.alunos;
      preencherSelectAlunos();
    }

    renderizarAlunos(dados.alunos);
  } catch (erro) {
    console.error("Erro ao carregar alunos:", erro);

    elementos.tabelaCorpo.replaceChildren();

    exibirMensagemLista(
      erro.message,
      "erro"
    );
  }
}

function abrirModal() {
  elementos.modal.hidden = false;
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    elementos.campoJustificativa.focus();
  }, 50);
}

function fecharModal() {
  elementos.modal.hidden = true;
  document.body.style.overflow = "";

  elementos.formulario.reset();
  elementos.selectAluno.disabled = false;
  elementos.grupoHorario.hidden = true;
  elementos.campoHorario.required = false;

  presencaSelecionadaId = null;

  limparMensagemModal();
}

function abrirModalAdicionar(aluno = null) {
  modoModal = "ADICIONAR";
  presencaSelecionadaId = null;

  elementos.formulario.reset();

  elementos.tituloModal.textContent =
    "Adicionar presença";

  elementos.campoData.value =
    dataAtualBanco || obterDataLocalIso();

  elementos.grupoHorario.hidden = true;
  elementos.campoHorario.required = false;

  elementos.selectAluno.disabled = false;

  elementos.contadorJustificativa.textContent =
    "0/200";

  preencherSelectAlunos(aluno);
  limparMensagemModal();
  abrirModal();
}

function abrirModalCorrecao(aluno) {
  modoModal = "CORRIGIR";
  presencaSelecionadaId = aluno.presencaId;

  elementos.formulario.reset();

  elementos.tituloModal.textContent =
    "Corrigir presença";

  elementos.campoData.value =
    dataAtualBanco || obterDataLocalIso();

  elementos.grupoHorario.hidden = false;
  elementos.campoHorario.required = true;

  elementos.campoHorario.value =
    formatarHorario(aluno.horario) === "—"
      ? ""
      : formatarHorario(aluno.horario);

  elementos.selectAluno.replaceChildren();

  const opcao = document.createElement("option");

  opcao.value = aluno.id;
  opcao.textContent =
    `${aluno.nome} — ${aluno.matricula}`;

  elementos.selectAluno.appendChild(opcao);
  elementos.selectAluno.disabled = true;

  elementos.contadorJustificativa.textContent =
    "0/200";

  limparMensagemModal();
  abrirModal();
}

async function salvarPresenca(evento) {
  evento.preventDefault();

  limparMensagemModal();

  const justificativa =
    elementos.campoJustificativa.value.trim();

  if (!justificativa) {
    exibirMensagemModal(
      "A justificativa é obrigatória.",
      "erro"
    );

    return;
  }

  alterarEstadoBotao(
    elementos.botaoSalvar,
    true
  );

  try {
    let resultado;

    if (modoModal === "ADICIONAR") {
      const alunoId = Number(
        elementos.selectAluno.value
      );

      if (!Number.isInteger(alunoId) || alunoId <= 0) {
        exibirMensagemModal(
          "Selecione um aluno.",
          "erro"
        );

        return;
      }

      resultado = await fazerRequisicao(
        "/supervisor/presencas-manuais",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            alunoId,
            justificativa,
          }),
        }
      );
    } else {
      const horario = elementos.campoHorario.value;

      if (!horario) {
        exibirMensagemModal(
          "Informe o novo horário.",
          "erro"
        );

        return;
      }

      resultado = await fazerRequisicao(
        `/supervisor/presencas/${presencaSelecionadaId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            horario,
            justificativa,
          }),
        }
      );
    }

    await Promise.all([
      carregarResumo(),
      carregarAlunos(
        elementos.campoBusca.value.trim()
      ),
    ]);

    fecharModal();

    exibirMensagemLista(
      resultado.mensagem,
      "sucesso"
    );
  } catch (erro) {
    console.error("Erro ao salvar presença:", erro);

    exibirMensagemModal(
      erro.message,
      "erro"
    );
  } finally {
    alterarEstadoBotao(
      elementos.botaoSalvar,
      false,
      "Salvar"
    );
  }
}

async function exportarCsv() {
  alterarEstadoBotao(
    elementos.botaoExportar,
    true
  );

  try {
    const resposta = await fetch(
      `${API_URL}/supervisor/relatorio-hoje.csv`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (resposta.status === 401) {
      redirecionarParaLogin();
      return;
    }

    if (!resposta.ok) {
      let dados = {};

      try {
        dados = await resposta.json();
      } catch {
        dados = {};
      }

      throw new Error(
        dados.mensagem ||
          "Não foi possível exportar o relatório."
      );
    }

    const arquivo = await resposta.blob();
    const enderecoTemporario =
      URL.createObjectURL(arquivo);

    const link = document.createElement("a");

    link.href = enderecoTemporario;
    link.download =
      `presencas-${dataAtualBanco || obterDataLocalIso()}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(enderecoTemporario);

    exibirMensagemLista(
      "Relatório exportado com sucesso.",
      "sucesso"
    );
  } catch (erro) {
    console.error("Erro ao exportar CSV:", erro);

    exibirMensagemLista(
      erro.message,
      "erro"
    );
  } finally {
    alterarEstadoBotao(
      elementos.botaoExportar,
      false,
      "Exportar CSV"
    );
  }
}

function sair() {
  sessionStorage.clear();
  window.location.replace("/login-teste.html");
}

async function iniciarPagina() {
  if (!token) {
    redirecionarParaLogin();
    return;
  }

  elementos.tabelaCorpo.replaceChildren();

  exibirMensagemLista(
    "Carregando painel..."
  );

  try {
    await carregarPerfil();

    await Promise.all([
      carregarResumo(),
      carregarAlunos(),
    ]);
  } catch (erro) {
    console.error(
      "Erro ao carregar painel do supervisor:",
      erro
    );

    exibirMensagemLista(
      erro.message ||
        "Não foi possível carregar o painel.",
      "erro"
    );
  }
}

elementos.campoBusca.addEventListener("input", () => {
  clearTimeout(temporizadorBusca);

  temporizadorBusca = setTimeout(() => {
    carregarAlunos(
      elementos.campoBusca.value.trim()
    );
  }, 350);
});

elementos.campoJustificativa.addEventListener(
  "input",
  () => {
    elementos.contadorJustificativa.textContent =
      `${elementos.campoJustificativa.value.length}/200`;
  }
);

elementos.botaoAdicionar.addEventListener(
  "click",
  () => abrirModalAdicionar()
);

elementos.botaoAbrirModalMenu.addEventListener(
  "click",
  () => abrirModalAdicionar()
);

elementos.botaoFecharModal.addEventListener(
  "click",
  fecharModal
);

elementos.botaoCancelarModal.addEventListener(
  "click",
  fecharModal
);

elementos.modalOverlay.addEventListener(
  "click",
  fecharModal
);

elementos.formulario.addEventListener(
  "submit",
  salvarPresenca
);

elementos.botaoExportar.addEventListener(
  "click",
  exportarCsv
);

elementos.botaoSair.addEventListener("click", sair);

document.addEventListener("keydown", (evento) => {
  if (
    evento.key === "Escape" &&
    !elementos.modal.hidden
  ) {
    fecharModal();
  }
});

iniciarPagina();
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const token = sessionStorage.getItem("token");

const elementos = {
  nomeAluno: document.querySelector("#nome-aluno"),
  nomeMenu: document.querySelector("#nome-menu"),
  matriculaAluno: document.querySelector("#matricula-aluno"),
  avatar: document.querySelector(".usuario-resumo__avatar"),

  dataAtual: document.querySelector("#data-atual"),
  statusPresenca: document.querySelector("#status-presenca"),
  descricaoPresenca: document.querySelector(
    "#descricao-presenca"
  ),
  iconeStatus: document.querySelector("#icone-status"),

  detalhesPresenca: document.querySelector(
    "#detalhes-presenca"
  ),
  dataPresenca: document.querySelector("#data-presenca"),
  horarioPresenca: document.querySelector(
    "#horario-presenca"
  ),

  botaoPresenca: document.querySelector(
    "#botao-marcar-presenca"
  ),
  textoBotaoPresenca: document.querySelector(
    "#botao-marcar-presenca span"
  ),

  mensagemPresenca: document.querySelector(
    "#mensagem-presenca"
  ),

  botaoSair: document.querySelector("#botao-sair"),
};

let presencaRegistrada = false;

const ICONE_RELOGIO = `
  <svg viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      stroke-width="1.8"
    />

    <path
      d="M12 7V12L15.5 14"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

const ICONE_SUCESSO = `
  <svg viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      stroke-width="1.8"
    />

    <path
      d="M8 12L11 15L16 9"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

function redirecionarParaLogin() {
  sessionStorage.clear();
  window.location.replace("/");
}

function exibirMensagem(texto, tipo = "") {
  elementos.mensagemPresenca.textContent = texto;
  elementos.mensagemPresenca.className = "mensagem-presenca";

  if (tipo) {
    elementos.mensagemPresenca.classList.add(
      `mensagem-presenca--${tipo}`
    );
  }
}

function limparMensagem() {
  elementos.mensagemPresenca.textContent = "";
  elementos.mensagemPresenca.className = "mensagem-presenca";
}

function alterarBotaoPresenca(texto, desabilitado) {
  elementos.textoBotaoPresenca.textContent = texto;
  elementos.botaoPresenca.disabled = desabilitado;
}

async function fazerRequisicao(
  caminho,
  opcoes = {}
) {
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
      dados.mensagem || "Não foi possível concluir a operação."
    );

    erro.status = resposta.status;
    erro.dados = dados;

    throw erro;
  }

  return dados;
}

function obterPrimeiroNome(nomeCompleto) {
  return nomeCompleto.trim().split(" ")[0];
}

function formatarDataAtual() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function formatarDataBanco(valor) {
  if (!valor) {
    return "--";
  }

  const dataSemHorario = String(valor).slice(0, 10);
  const [ano, mes, dia] = dataSemHorario.split("-");

  if (!ano || !mes || !dia) {
    return valor;
  }

  const dataLocal = new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia)
  );

  return new Intl.DateTimeFormat("pt-BR").format(dataLocal);
}

function formatarHorario(valor) {
  if (!valor) {
    return "--";
  }

  return String(valor).slice(0, 5);
}

function preencherDadosUsuario(usuario) {
  const primeiroNome = obterPrimeiroNome(usuario.nome);

  elementos.nomeAluno.textContent = primeiroNome;
  elementos.nomeMenu.textContent = usuario.nome;
  elementos.matriculaAluno.textContent =
    usuario.matricula || "--";

  elementos.avatar.textContent =
    primeiroNome.charAt(0).toUpperCase();
}

function exibirPresencaNaoRegistrada() {
  presencaRegistrada = false;

  elementos.iconeStatus.innerHTML = ICONE_RELOGIO;
  elementos.statusPresenca.textContent =
    "Ainda não registrada";

  elementos.descricaoPresenca.textContent =
    "Registre sua presença ao chegar na instituição.";

  elementos.detalhesPresenca.hidden = true;

  alterarBotaoPresenca("Marcar presença", false);
}

function exibirPresencaRegistrada(presenca) {
  presencaRegistrada = true;

  elementos.iconeStatus.innerHTML = ICONE_SUCESSO;
  elementos.statusPresenca.textContent =
    "Presença registrada";

  elementos.descricaoPresenca.textContent =
    "Seu registro de presença de hoje foi confirmado.";

  elementos.dataPresenca.textContent =
    formatarDataBanco(presenca.data);

  elementos.horarioPresenca.textContent =
    formatarHorario(presenca.horario);

  elementos.detalhesPresenca.hidden = false;

  alterarBotaoPresenca("Presença registrada", true);
}

async function carregarPerfil() {
  const dados = await fazerRequisicao("/auth/me");

  if (dados.usuario.tipo !== "ALUNO") {
    sessionStorage.clear();
    window.location.replace("/");
    return;
  }

  preencherDadosUsuario(dados.usuario);

  sessionStorage.setItem(
    "usuario",
    JSON.stringify(dados.usuario)
  );
}

async function carregarPresencaHoje() {
  const dados = await fazerRequisicao(
    "/aluno/presenca-hoje"
  );

  if (dados.presenca.registrada) {
    exibirPresencaRegistrada(dados.presenca);
    return;
  }

  exibirPresencaNaoRegistrada();
}

function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Seu navegador não oferece suporte à localização."
        )
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        resolve({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          precisao: posicao.coords.accuracy,
        });
      },

      (erro) => {
        if (erro.code === erro.PERMISSION_DENIED) {
          reject(
            new Error(
              "Você precisa permitir o acesso à localização."
            )
          );

          return;
        }

        if (erro.code === erro.POSITION_UNAVAILABLE) {
          reject(
            new Error(
              "O dispositivo não conseguiu obter sua localização."
            )
          );

          return;
        }

        if (erro.code === erro.TIMEOUT) {
          reject(
            new Error(
              "A obtenção da localização demorou muito."
            )
          );

          return;
        }

        reject(
          new Error(
            "Não foi possível obter sua localização."
          )
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

async function marcarPresenca() {
  if (presencaRegistrada) {
    return;
  }

  limparMensagem();
  alterarBotaoPresenca("Obtendo localização...", true);

  try {
    const localizacao = await obterLocalizacao();

    alterarBotaoPresenca("Registrando...", true);

    const dados = await fazerRequisicao(
      "/aluno/presencas",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(localizacao),
      }
    );

    exibirMensagem(dados.mensagem, "sucesso");

    exibirPresencaRegistrada(dados.presenca);
  } catch (erro) {
    console.error("Erro ao registrar presença:", erro);

    exibirMensagem(erro.message, "erro");

    if (erro.status === 409) {
      await carregarPresencaHoje();
      return;
    }

    alterarBotaoPresenca("Marcar presença", false);
  }
}

function sair() {
  sessionStorage.clear();
  window.location.replace("/");
}

async function iniciarPagina() {
  if (!token) {
    redirecionarParaLogin();
    return;
  }

  elementos.dataAtual.textContent = formatarDataAtual();

  alterarBotaoPresenca("Carregando...", true);

  try {
    await carregarPerfil();
    await carregarPresencaHoje();
  } catch (erro) {
    console.error("Erro ao carregar área do aluno:", erro);

    exibirMensagem(
      erro.message || "Não foi possível carregar seus dados.",
      "erro"
    );
  }
}

elementos.botaoPresenca.addEventListener(
  "click",
  marcarPresenca
);

elementos.botaoSair.addEventListener("click", sair);

iniciarPagina();
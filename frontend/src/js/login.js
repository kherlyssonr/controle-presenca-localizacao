const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:3000";

const formulario = document.querySelector("#form-login");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");

const botaoEntrar = document.querySelector("#botao-entrar");

const botaoMostrarSenha = document.querySelector("#botao-mostrar-senha");

const mensagemLogin = document.querySelector("#mensagem-login");

function exibirMensagem(texto, tipo = "erro") {
  mensagemLogin.textContent = texto;

  mensagemLogin.className = `login-message login-message--${tipo}`;

  mensagemLogin.hidden = false;
}

function limparMensagem() {
  mensagemLogin.textContent = "";
  mensagemLogin.className = "login-message";
  mensagemLogin.hidden = true;
}

function alterarEstadoCarregamento(carregando) {
  campoEmail.disabled = carregando;
  campoSenha.disabled = carregando;
  botaoEntrar.disabled = carregando;

  botaoEntrar.textContent = carregando ? "Entrando..." : "Entrar";
}

function salvarSessao(dados) {
  sessionStorage.setItem("token", dados.token);

  sessionStorage.setItem("usuario", JSON.stringify(dados.usuario));
}

function redirecionarUsuario(usuario) {
  const tipoUsuario = String(usuario.tipo || "")
    .trim()
    .toUpperCase();

  if (tipoUsuario === "ALUNO") {
    window.location.replace("/painelAluno.html");
    return;
  }

  if (tipoUsuario === "SUPERVISOR") {
    window.location.replace("/painelSupervisor.html");
    return;
  }

  sessionStorage.clear();

  exibirMensagem("O perfil desta conta não é reconhecido.", "erro");
}

async function realizarLogin(evento) {
  evento.preventDefault();

  limparMensagem();

  const email = campoEmail.value.trim().toLowerCase();

  const senha = campoSenha.value;

  if (!email || !senha) {
    exibirMensagem("Preencha o e-mail e a senha.", "erro");

    return;
  }

  alterarEstadoCarregamento(true);

  try {
    const resposta = await fetch(`${API_URL}/auth/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        senha,
      }),
    });

    let dados = {};

    try {
      dados = await resposta.json();
    } catch {
      dados = {};
    }

    if (!resposta.ok) {
      throw new Error(dados.mensagem || "E-mail ou senha inválidos.");
    }

    if (!dados.token || !dados.usuario) {
      throw new Error("A resposta do servidor está incompleta.");
    }

    salvarSessao(dados);

    exibirMensagem("Login realizado com sucesso.", "sucesso");

    redirecionarUsuario(dados.usuario);
  } catch (erro) {
    console.error("Erro no login:", erro);

    const mensagem =
      erro instanceof TypeError
        ? "Não foi possível conectar ao servidor."
        : erro.message;

    exibirMensagem(mensagem || "Não foi possível realizar o login.", "erro");
  } finally {
    alterarEstadoCarregamento(false);
  }
}

function alternarExibicaoSenha() {
  const senhaEstaVisivel = campoSenha.type === "text";

  campoSenha.type = senhaEstaVisivel ? "password" : "text";

  botaoMostrarSenha.textContent = senhaEstaVisivel ? "Mostrar" : "Ocultar";

  botaoMostrarSenha.setAttribute(
    "aria-label",
    senhaEstaVisivel ? "Mostrar senha" : "Ocultar senha",
  );

  botaoMostrarSenha.setAttribute("aria-pressed", String(!senhaEstaVisivel));
}

function verificarSessaoExistente() {
  const token = sessionStorage.getItem("token");
  const usuarioSalvo = sessionStorage.getItem("usuario");

  if (!token || !usuarioSalvo) {
    return;
  }

  try {
    const usuario = JSON.parse(usuarioSalvo);

    redirecionarUsuario(usuario);
  } catch {
    sessionStorage.clear();
  }
}

formulario.addEventListener("submit", realizarLogin);

botaoMostrarSenha.addEventListener("click", alternarExibicaoSenha);

verificarSessaoExistente();

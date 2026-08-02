const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const elementos = {
  formulario: document.querySelector("#form-login"),
  email: document.querySelector("#email"),
  senha: document.querySelector("#senha"),

  botaoEntrar: document.querySelector("#botao-entrar"),

  botaoMostrarSenha: document.querySelector(
    "#botao-mostrar-senha"
  ),

  mensagem: document.querySelector("#mensagem-login"),
};

function exibirMensagem(texto, tipo = "") {
  elementos.mensagem.textContent = texto;
  elementos.mensagem.className = "mensagem-login";

  if (tipo) {
    elementos.mensagem.classList.add(
      `mensagem-login--${tipo}`
    );
  }
}

function limparMensagem() {
  elementos.mensagem.textContent = "";
  elementos.mensagem.className = "mensagem-login";
}

function alterarEstadoCarregamento(carregando) {
  elementos.botaoEntrar.disabled = carregando;

  elementos.email.disabled = carregando;
  elementos.senha.disabled = carregando;

  elementos.botaoEntrar.textContent = carregando
    ? "Entrando..."
    : "Entrar";
}

function redirecionarUsuario(usuario) {
  if (usuario.tipo === "ALUNO") {
    window.location.replace("/aluno.html");
    return;
  }

  if (usuario.tipo === "SUPERVISOR") {
    window.location.replace("/supervisor.html");
    return;
  }

  sessionStorage.clear();

  exibirMensagem(
    "O perfil desta conta não é reconhecido.",
    "erro"
  );
}

async function realizarLogin(evento) {
  evento.preventDefault();

  limparMensagem();

  const email = elementos.email.value.trim();
  const senha = elementos.senha.value;

  if (!email || !senha) {
    exibirMensagem(
      "Preencha o e-mail e a senha.",
      "erro"
    );

    return;
  }

  alterarEstadoCarregamento(true);

  try {
    const resposta = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          senha,
        }),
      }
    );

    let dados = {};

    try {
      dados = await resposta.json();
    } catch {
      dados = {};
    }

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem ||
          "E-mail ou senha inválidos."
      );
    }

    if (!dados.token || !dados.usuario) {
      throw new Error(
        "A resposta do servidor está incompleta."
      );
    }

    sessionStorage.setItem("token", dados.token);

    sessionStorage.setItem(
      "usuario",
      JSON.stringify(dados.usuario)
    );

    exibirMensagem(
      "Login realizado. Redirecionando...",
      "sucesso"
    );

    setTimeout(() => {
      redirecionarUsuario(dados.usuario);
    }, 500);
  } catch (erro) {
    console.error("Erro ao realizar login:", erro);

    exibirMensagem(
      erro.message ||
        "Não foi possível acessar o servidor.",
      "erro"
    );
  } finally {
    alterarEstadoCarregamento(false);
  }
}

function alternarExibicaoSenha() {
  const senhaEstaVisivel =
    elementos.senha.type === "text";

  elementos.senha.type = senhaEstaVisivel
    ? "password"
    : "text";

  elementos.botaoMostrarSenha.textContent =
    senhaEstaVisivel ? "Mostrar" : "Ocultar";

  elementos.botaoMostrarSenha.setAttribute(
    "aria-label",
    senhaEstaVisivel
      ? "Mostrar senha"
      : "Ocultar senha"
  );

  elementos.botaoMostrarSenha.setAttribute(
    "aria-pressed",
    String(!senhaEstaVisivel)
  );
}

elementos.formulario.addEventListener(
  "submit",
  realizarLogin
);

elementos.botaoMostrarSenha.addEventListener(
  "click",
  alternarExibicaoSenha
);
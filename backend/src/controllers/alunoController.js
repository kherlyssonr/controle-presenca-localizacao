import pool from "../database/connection.js";
import { calcularDistancia } from "../utils/calcularDistancia.js";

export function painelAluno(request, response) {
  return response.status(200).json({
    mensagem: "Acesso permitido à área do aluno.",
    usuarioAutenticado: request.usuario,
  });
}

export async function consultarPresencaHoje(request, response) {
  try {
    const resultado = await pool.query(
      `
        SELECT
          alunos.id AS aluno_id,
          usuarios.nome,
          usuarios.email,
          alunos.matricula,

          presencas.id AS presenca_id,
          presencas.data,
          presencas.horario,
          presencas.precisao,
          presencas.distancia,
          presencas.tipo_registro

        FROM alunos

        INNER JOIN usuarios
          ON usuarios.id = alunos.usuario_id

        LEFT JOIN presencas
          ON presencas.aluno_id = alunos.id
          AND presencas.data = CURRENT_DATE

        WHERE alunos.usuario_id = $1

        LIMIT 1;
      `,
      [request.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return response.status(404).json({
        mensagem: "Aluno não encontrado.",
      });
    }

    const dados = resultado.rows[0];

    if (!dados.presenca_id) {
      return response.status(200).json({
        aluno: {
          id: dados.aluno_id,
          nome: dados.nome,
          email: dados.email,
          matricula: dados.matricula,
        },
        presenca: {
          registrada: false,
          mensagem: "Presença ainda não registrada hoje.",
        },
      });
    }

    return response.status(200).json({
      aluno: {
        id: dados.aluno_id,
        nome: dados.nome,
        email: dados.email,
        matricula: dados.matricula,
      },
      presenca: {
        registrada: true,
        mensagem: "Presença já registrada hoje.",
        data: dados.data,
        horario: dados.horario,
        precisao: dados.precisao,
        distancia: dados.distancia,
        tipoRegistro: dados.tipo_registro,
      },
    });
  } catch (erro) {
    console.error("Erro ao consultar presença de hoje:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
} 

export async function registrarPresenca(request, response) {
  const { latitude, longitude, precisao } = request.body;

  const camposAusentes = [latitude, longitude, precisao].some(
    (valor) =>
      valor === undefined ||
      valor === null ||
      valor === ""
  );

  if (camposAusentes) {
    return response.status(400).json({
      mensagem: "Latitude, longitude e precisão são obrigatórias.",
    });
  }

  const latitudeAluno = Number(latitude);
  const longitudeAluno = Number(longitude);
  const precisaoAluno = Number(precisao);

  if (
    !Number.isFinite(latitudeAluno) ||
    !Number.isFinite(longitudeAluno) ||
    !Number.isFinite(precisaoAluno)
  ) {
    return response.status(400).json({
      mensagem: "Os dados de localização devem ser números válidos.",
    });
  }

  if (latitudeAluno < -90 || latitudeAluno > 90) {
    return response.status(400).json({
      mensagem: "A latitude informada é inválida.",
    });
  }

  if (longitudeAluno < -180 || longitudeAluno > 180) {
    return response.status(400).json({
      mensagem: "A longitude informada é inválida.",
    });
  }

  if (precisaoAluno <= 0) {
    return response.status(400).json({
      mensagem: "A precisão informada deve ser maior que zero.",
    });
  }

  try {
    const alunoResultado = await pool.query(
      `
        SELECT
          alunos.id,
          usuarios.ativo
        FROM alunos

        INNER JOIN usuarios
          ON usuarios.id = alunos.usuario_id

        WHERE alunos.usuario_id = $1
        LIMIT 1;
      `,
      [request.usuario.id]
    );

    if (alunoResultado.rows.length === 0) {
      return response.status(404).json({
        mensagem: "Aluno não encontrado.",
      });
    }

    const aluno = alunoResultado.rows[0];

    if (!aluno.ativo) {
      return response.status(403).json({
        mensagem: "Este usuário está desativado.",
      });
    }

    const presencaExistente = await pool.query(
      `
        SELECT id
        FROM presencas
        WHERE aluno_id = $1
          AND data = CURRENT_DATE
        LIMIT 1;
      `,
      [aluno.id]
    );

    if (presencaExistente.rows.length > 0) {
      return response.status(409).json({
        mensagem: "A presença de hoje já foi registrada.",
      });
    }

    const instituicaoResultado = await pool.query(
      `
        SELECT
          id,
          nome,
          latitude,
          longitude,
          raio_permitido,
          precisao_maxima
        FROM instituicao
        LIMIT 1;
      `
    );

    if (instituicaoResultado.rows.length === 0) {
      return response.status(500).json({
        mensagem: "A instituição ainda não foi configurada.",
      });
    }

    const instituicao = instituicaoResultado.rows[0];

    const precisaoMaxima = Number(instituicao.precisao_maxima);

    if (precisaoAluno > precisaoMaxima) {
      return response.status(422).json({
        mensagem: "A precisão da localização não é aceitável.",
        precisaoInformada: precisaoAluno,
        precisaoMaxima,
      });
    }

    const distancia = calcularDistancia(
      latitudeAluno,
      longitudeAluno,
      Number(instituicao.latitude),
      Number(instituicao.longitude)
    );

    const raioPermitido = Number(instituicao.raio_permitido);

    if (distancia > raioPermitido) {
      return response.status(403).json({
        mensagem: "Você está fora do raio permitido.",
        distancia: Number(distancia.toFixed(2)),
        raioPermitido,
      });
    }

    const registroResultado = await pool.query(
      `
        INSERT INTO presencas (
          aluno_id,
          precisao,
          distancia,
          tipo_registro,
          registrado_por
        )
        VALUES ($1, $2, $3, 'AUTOMATICO', $4)

        RETURNING
          id,
          data,
          horario,
          precisao,
          distancia,
          tipo_registro;
      `,
      [
        aluno.id,
        precisaoAluno,
        Number(distancia.toFixed(2)),
        request.usuario.id,
      ]
    );

    const presenca = registroResultado.rows[0];

    return response.status(201).json({
      mensagem: "Presença registrada com sucesso.",
      presenca: {
        id: presenca.id,
        data: presenca.data,
        horario: presenca.horario,
        precisao: presenca.precisao,
        distancia: presenca.distancia,
        tipoRegistro: presenca.tipo_registro,
      },
    });
  } catch (erro) {
    if (
      erro.code === "23505" &&
      erro.constraint === "presenca_unica_por_dia"
    ) {
      return response.status(409).json({
        mensagem: "A presença de hoje já foi registrada.",
      });
    }

    console.error("Erro ao registrar presença:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}
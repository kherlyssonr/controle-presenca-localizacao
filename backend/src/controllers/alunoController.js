import pool from "../database/connection.js";

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
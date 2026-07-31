import pool from "../database/connection.js";

export function painelSupervisor(request, response) {
  return response.status(200).json({
    mensagem: "Acesso permitido à área do supervisor.",
    usuarioAutenticado: request.usuario,
  });
}

export async function consultarResumoHoje(request, response) {
  try {
    const resultado = await pool.query(`
      SELECT
        COUNT(alunos.id)::INTEGER AS total_alunos,

        COUNT(presencas.id)::INTEGER AS registraram_hoje,

        (
          COUNT(alunos.id) - COUNT(presencas.id)
        )::INTEGER AS nao_registraram_hoje

      FROM alunos

      INNER JOIN usuarios
        ON usuarios.id = alunos.usuario_id

      LEFT JOIN presencas
        ON presencas.aluno_id = alunos.id
        AND presencas.data = CURRENT_DATE

      WHERE usuarios.ativo = TRUE;
    `);

    const resumo = resultado.rows[0];

    return response.status(200).json({
      data: new Date().toISOString().split("T")[0],

      resumo: {
        totalAlunos: resumo.total_alunos,
        registraramHoje: resumo.registraram_hoje,
        naoRegistraramHoje: resumo.nao_registraram_hoje,
      },
    });
  } catch (erro) {
    console.error("Erro ao consultar resumo do dia:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}
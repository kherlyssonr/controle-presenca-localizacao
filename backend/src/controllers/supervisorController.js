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

export async function listarAlunosHoje(request, response) {
  const busca =
    typeof request.query.busca === "string"
      ? request.query.busca
      : "";

  try {
    const dataResultado = await pool.query(`
      SELECT CURRENT_DATE::TEXT AS data;
    `);

    const alunosResultado = await pool.query(
      `
        SELECT
          alunos.id AS aluno_id,
          usuarios.nome,
          usuarios.email,
          alunos.matricula,

          presencas.id AS presenca_id,
          presencas.horario,
          presencas.tipo_registro,

          CASE
            WHEN presencas.id IS NULL
              THEN 'Não registrou'
            ELSE 'Registrou'
          END AS status

        FROM alunos

        INNER JOIN usuarios
          ON usuarios.id = alunos.usuario_id

        LEFT JOIN presencas
          ON presencas.aluno_id = alunos.id
          AND presencas.data = CURRENT_DATE

        WHERE usuarios.ativo = TRUE

          AND (
            $1 = ''
            OR usuarios.nome ILIKE $2
            OR alunos.matricula ILIKE $2
          )

        ORDER BY
          CASE
            WHEN presencas.id IS NULL THEN 1
            ELSE 0
          END,
          usuarios.nome ASC;
      `,
      [busca, `%${busca}%`]
    );

    const alunos = alunosResultado.rows.map((aluno) => ({
      id: aluno.aluno_id,
      nome: aluno.nome,
      email: aluno.email,
      matricula: aluno.matricula,
      horario: aluno.horario,
      status: aluno.status,
      tipoRegistro: aluno.tipo_registro,
    }));

    return response.status(200).json({
      data: dataResultado.rows[0].data,
      quantidade: alunos.length,
      busca,
      alunos,
    });
  } catch (erro) {
    console.error("Erro ao listar alunos do dia:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}
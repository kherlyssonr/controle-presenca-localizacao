import pool from "../database/connection.js";
import { gerarCsv } from "../utils/gerarCsv.js";
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
      presencaId: aluno.presenca_id,
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

export async function registrarPresencaManual(request, response) {
  const { alunoId, justificativa } = request.body;

  const alunoIdNumerico = Number(alunoId);

  if (!Number.isInteger(alunoIdNumerico) || alunoIdNumerico <= 0) {
    return response.status(400).json({
      mensagem: "O ID do aluno é inválido.",
    });
  }

  if (
    typeof justificativa !== "string" ||
    justificativa.trim() === ""
  ) {
    return response.status(400).json({
      mensagem: "A justificativa é obrigatória.",
    });
  }

  try {
    const alunoResultado = await pool.query(
      `
        SELECT
          alunos.id,
          alunos.matricula,
          usuarios.nome,
          usuarios.ativo
        FROM alunos

        INNER JOIN usuarios
          ON usuarios.id = alunos.usuario_id

        WHERE alunos.id = $1
        LIMIT 1;
      `,
      [alunoIdNumerico]
    );

    if (alunoResultado.rows.length === 0) {
      return response.status(404).json({
        mensagem: "Aluno não encontrado.",
      });
    }

    const aluno = alunoResultado.rows[0];

    if (!aluno.ativo) {
      return response.status(403).json({
        mensagem: "Não é possível registrar presença para um aluno desativado.",
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
      [alunoIdNumerico]
    );

    if (presencaExistente.rows.length > 0) {
      return response.status(409).json({
        mensagem: "O aluno já possui uma presença registrada hoje.",
      });
    }

    const registroResultado = await pool.query(
      `
        INSERT INTO presencas (
          aluno_id,
          tipo_registro,
          justificativa,
          registrado_por
        )
        VALUES ($1, 'MANUAL', $2, $3)

        RETURNING
          id,
          aluno_id,
          data,
          horario,
          tipo_registro,
          justificativa,
          registrado_por,
          criado_em;
      `,
      [
        alunoIdNumerico,
        justificativa.trim(),
        request.usuario.id,
      ]
    );

    const presenca = registroResultado.rows[0];

    return response.status(201).json({
      mensagem: "Presença manual registrada com sucesso.",
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
      },
      presenca: {
        id: presenca.id,
        data: presenca.data,
        horario: presenca.horario,
        tipoRegistro: presenca.tipo_registro,
        justificativa: presenca.justificativa,
        registradoPor: presenca.registrado_por,
        criadoEm: presenca.criado_em,
      },
    });
  } catch (erro) {
    if (
      erro.code === "23505" &&
      erro.constraint === "presenca_unica_por_dia"
    ) {
      return response.status(409).json({
        mensagem: "O aluno já possui uma presença registrada hoje.",
      });
    }

    console.error("Erro ao registrar presença manual:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}

export async function corrigirPresenca(request, response) {
  const presencaId = Number(request.params.presencaId);
  const { horario, justificativa } = request.body;

  if (!Number.isInteger(presencaId) || presencaId <= 0) {
    return response.status(400).json({
      mensagem: "O ID da presença é inválido.",
    });
  }

  if (
    typeof justificativa !== "string" ||
    justificativa.trim() === ""
  ) {
    return response.status(400).json({
      mensagem: "A justificativa é obrigatória.",
    });
  }

  if (typeof horario !== "string" || horario.trim() === "") {
    return response.status(400).json({
      mensagem: "O novo horário é obrigatório.",
    });
  }

  const horarioValido = /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    horario.trim()
  );

  if (!horarioValido) {
    return response.status(400).json({
      mensagem: "Informe o horário no formato HH:MM.",
    });
  }

  try {
    const resultado = await pool.query(
      `
        UPDATE presencas

        SET
          horario = $1::TIME,
          tipo_registro = 'MANUAL',
          justificativa = $2,
          registrado_por = $3,
          atualizado_em = CURRENT_TIMESTAMP

        WHERE id = $4

        RETURNING
          id,
          aluno_id,
          data,
          horario,
          tipo_registro,
          justificativa,
          registrado_por,
          criado_em,
          atualizado_em;
      `,
      [
        horario.trim(),
        justificativa.trim(),
        request.usuario.id,
        presencaId,
      ]
    );

    if (resultado.rows.length === 0) {
      return response.status(404).json({
        mensagem: "Presença não encontrada.",
      });
    }

    const presenca = resultado.rows[0];

    return response.status(200).json({
      mensagem: "Presença corrigida com sucesso.",
      presenca: {
        id: presenca.id,
        alunoId: presenca.aluno_id,
        data: presenca.data,
        horario: presenca.horario,
        tipoRegistro: presenca.tipo_registro,
        justificativa: presenca.justificativa,
        registradoPor: presenca.registrado_por,
        criadoEm: presenca.criado_em,
        atualizadoEm: presenca.atualizado_em,
      },
    });
  } catch (erro) {
    console.error("Erro ao corrigir presença:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}

export async function exportarRelatorioHoje(request, response) {
  try {
    const dataResultado = await pool.query(`
      SELECT CURRENT_DATE::TEXT AS data;
    `);

    const dataAtual = dataResultado.rows[0].data;

    const resultado = await pool.query(`
      SELECT
        usuarios.nome,
        alunos.matricula,

        CASE
          WHEN presencas.id IS NULL
            THEN ''
          ELSE presencas.data::TEXT
        END AS data,

        CASE
          WHEN presencas.id IS NULL
            THEN ''
          ELSE TO_CHAR(presencas.horario, 'HH24:MI:SS')
        END AS horario,

        CASE
          WHEN presencas.id IS NULL
            THEN 'Não registrou'
          ELSE 'Registrou'
        END AS status,

        COALESCE(
          presencas.tipo_registro,
          ''
        ) AS tipo_registro,

        COALESCE(
          presencas.justificativa,
          ''
        ) AS justificativa

      FROM alunos

      INNER JOIN usuarios
        ON usuarios.id = alunos.usuario_id

      LEFT JOIN presencas
        ON presencas.aluno_id = alunos.id
        AND presencas.data = CURRENT_DATE

      WHERE usuarios.ativo = TRUE

      ORDER BY usuarios.nome ASC;
    `);

    const cabecalhos = [
      "Nome",
      "Matrícula",
      "Data",
      "Horário",
      "Status",
      "Tipo de registro",
      "Justificativa",
    ];

    const linhas = resultado.rows.map((registro) => [
      registro.nome,
      registro.matricula,
      registro.data,
      registro.horario,
      registro.status,
      registro.tipo_registro,
      registro.justificativa,
    ]);

    const csv = gerarCsv(cabecalhos, linhas);

    const nomeArquivo = `presencas-${dataAtual}.csv`;

    response.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${nomeArquivo}"`
    );

    return response.status(200).send(csv);
  } catch (erro) {
    console.error("Erro ao exportar relatório CSV:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}
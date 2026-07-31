import bcrypt from "bcryptjs";
import pool from "./connection.js";

async function criarDadosIniciais() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const senhaSupervisorHash = await bcrypt.hash(
      process.env.SEED_SUPERVISOR_PASSWORD,
      10
    );

    const senhaAlunoHash = await bcrypt.hash(
      process.env.SEED_ALUNO_PASSWORD,
      10
    );

    // Cria ou atualiza o supervisor de teste
    const supervisorResultado = await client.query(
      `
        INSERT INTO usuarios (
          nome,
          email,
          senha_hash,
          tipo
        )
        VALUES ($1, $2, $3, $4)

        ON CONFLICT (email)
        DO UPDATE SET
          nome = EXCLUDED.nome,
          senha_hash = EXCLUDED.senha_hash,
          tipo = EXCLUDED.tipo,
          ativo = TRUE

        RETURNING id, nome, email, tipo;
      `,
      [
        "Supervisor de Teste",
        "supervisor@teste.com",
        senhaSupervisorHash,
        "SUPERVISOR",
      ]
    );

    // Cria ou atualiza o usuário aluno
    const usuarioAlunoResultado = await client.query(
      `
        INSERT INTO usuarios (
          nome,
          email,
          senha_hash,
          tipo
        )
        VALUES ($1, $2, $3, $4)

        ON CONFLICT (email)
        DO UPDATE SET
          nome = EXCLUDED.nome,
          senha_hash = EXCLUDED.senha_hash,
          tipo = EXCLUDED.tipo,
          ativo = TRUE

        RETURNING id, nome, email, tipo;
      `,
      [
        "Aluno de Teste",
        "aluno@teste.com",
        senhaAlunoHash,
        "ALUNO",
      ]
    );

    const usuarioAlunoId = usuarioAlunoResultado.rows[0].id;

    // Cria os dados específicos do aluno
    const alunoResultado = await client.query(
      `
        INSERT INTO alunos (
          usuario_id,
          matricula
        )
        VALUES ($1, $2)

        ON CONFLICT (matricula)
        DO UPDATE SET
          usuario_id = EXCLUDED.usuario_id

        RETURNING id, usuario_id, matricula;
      `,
      [usuarioAlunoId, "2026001"]
    );

    // Cria a instituição somente se ainda não houver uma cadastrada
    const instituicaoExistente = await client.query(
      `
        SELECT id
        FROM instituicao
        LIMIT 1;
      `
    );

    let instituicaoResultado;

    if (instituicaoExistente.rows.length === 0) {
      instituicaoResultado = await client.query(
        `
          INSERT INTO instituicao (
            nome,
            latitude,
            longitude,
            raio_permitido,
            precisao_maxima
          )
          VALUES ($1, $2, $3, $4, $5)

          RETURNING
            id,
            nome,
            latitude,
            longitude,
            raio_permitido,
            precisao_maxima;
        `,
        [
          process.env.INSTITUICAO_NOME,
          Number(process.env.INSTITUICAO_LATITUDE),
          Number(process.env.INSTITUICAO_LONGITUDE),
          Number(process.env.INSTITUICAO_RAIO),
          Number(process.env.INSTITUICAO_PRECISAO_MAXIMA),
        ]
      );
    } else {
      instituicaoResultado = await client.query(
        `
          UPDATE instituicao
          SET
            nome = $1,
            latitude = $2,
            longitude = $3,
            raio_permitido = $4,
            precisao_maxima = $5
          WHERE id = $6

          RETURNING
            id,
            nome,
            latitude,
            longitude,
            raio_permitido,
            precisao_maxima;
        `,
        [
          process.env.INSTITUICAO_NOME,
          Number(process.env.INSTITUICAO_LATITUDE),
          Number(process.env.INSTITUICAO_LONGITUDE),
          Number(process.env.INSTITUICAO_RAIO),
          Number(process.env.INSTITUICAO_PRECISAO_MAXIMA),
          instituicaoExistente.rows[0].id,
        ]
      );
    }

    await client.query("COMMIT");

    console.log("Dados iniciais criados com sucesso!");
    console.log("Supervisor:", supervisorResultado.rows[0]);
    console.log("Aluno:", alunoResultado.rows[0]);
    console.log("Instituição:", instituicaoResultado.rows[0]);
  } catch (erro) {
    await client.query("ROLLBACK");

    console.error("Erro ao criar os dados iniciais:");
    console.error(erro.message);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

criarDadosIniciais();
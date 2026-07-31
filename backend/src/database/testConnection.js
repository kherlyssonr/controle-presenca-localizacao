import pool from "./connection.js";

async function testarConexao() {
  try {
    const resultado = await pool.query(`
      SELECT
        current_database() AS banco,
        CURRENT_TIMESTAMP AS horario_servidor
    `);

    console.log("Conexão com PostgreSQL realizada com sucesso!");
    console.log("Banco conectado:", resultado.rows[0].banco);
    console.log("Horário do servidor:", resultado.rows[0].horario_servidor);
  } catch (erro) {
    console.error("Não foi possível conectar ao PostgreSQL.");
    console.error(erro.message);

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testarConexao();
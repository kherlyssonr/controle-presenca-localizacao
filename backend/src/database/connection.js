import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const configuracaoBanco = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(configuracaoBanco);

pool.on("error", (erro) => {
  console.error(
    "Erro inesperado na conexão com o PostgreSQL:",
    erro
  );
});

export default pool;
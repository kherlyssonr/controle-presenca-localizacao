import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../database/connection.js";

export async function login(request, response) {
  const { email, senha } = request.body;

  if (!email || !senha) {
    return response.status(400).json({
      mensagem: "E-mail e senha são obrigatórios.",
    });
  }

  try {
    const resultado = await pool.query(
      `
        SELECT
          usuarios.id,
          usuarios.nome,
          usuarios.email,
          usuarios.senha_hash,
          usuarios.tipo,
          usuarios.ativo,
          alunos.matricula
        FROM usuarios

        LEFT JOIN alunos
          ON alunos.usuario_id = usuarios.id

        WHERE LOWER(usuarios.email) = LOWER($1)
        LIMIT 1;
      `,
      [email]
    );

    if (resultado.rows.length === 0) {
      return response.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    const usuario = resultado.rows[0];

    if (!usuario.ativo) {
      return response.status(403).json({
        mensagem: "Este usuário está desativado.",
      });
    }

    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha_hash
    );

    if (!senhaValida) {
      return response.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    const token = jwt.sign(
      {
        sub: usuario.id,
        tipo: usuario.tipo,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      }
    );

    return response.status(200).json({
      mensagem: "Login realizado com sucesso.",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        matricula: usuario.matricula,
      },
    });
  } catch (erro) {
    console.error("Erro ao realizar login:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
} 

export async function perfil(request, response) {
  try {
    const resultado = await pool.query(
      `
        SELECT
          usuarios.id,
          usuarios.nome,
          usuarios.email,
          usuarios.tipo,
          usuarios.ativo,
          alunos.matricula
        FROM usuarios

        LEFT JOIN alunos
          ON alunos.usuario_id = usuarios.id

        WHERE usuarios.id = $1
        LIMIT 1;
      `,
      [request.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return response.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    const usuario = resultado.rows[0];

    if (!usuario.ativo) {
      return response.status(403).json({
        mensagem: "Este usuário está desativado.",
      });
    }

    return response.status(200).json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        matricula: usuario.matricula,
      },
    });
  } catch (erro) {
    console.error("Erro ao consultar perfil:", erro);

    return response.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
}
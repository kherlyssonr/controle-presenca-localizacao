import "dotenv/config";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import alunoRoutes from "./routes/alunoRoutes.js";
import supervisorRoutes from "./routes/supervisorRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);

app.use(express.json());

app.get("/", (request, response) => {
  return response.status(200).json({
    mensagem: "API do sistema de presença funcionando.",
  });
});

app.use("/auth", authRoutes);
app.use("/aluno", alunoRoutes);
app.use("/supervisor", supervisorRoutes);

export default app;

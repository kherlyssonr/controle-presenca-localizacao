import "dotenv/config";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import alunoRoutes from "./routes/alunoRoutes.js";
import supervisorRoutes from "./routes/supervisorRoutes.js";

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  express.json({
    limit: "20kb",
  }),
);

app.get("/", (request, response) => {
  return response.status(200).json({
    mensagem: "API do sistema de presença funcionando.",
  });
});

app.get("/health", (request, response) => {
  return response.status(200).json({
    status: "ok",
  });
});

app.use("/auth", authRoutes);
app.use("/aluno", alunoRoutes);
app.use("/supervisor", supervisorRoutes);

export default app;

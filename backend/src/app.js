import express from "express";

import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (request, response) => {
  return response.status(200).json({
    mensagem: "API do sistema de presença funcionando.",
  });
});

app.use("/auth", authRoutes);

export default app;


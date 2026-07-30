import express from "express";

const app = express();

app.use(express.json());

app.get("/", (request, response) => {
  return response.status(200).json({
    mensagem: "API do sistema de presença funcionando.",
  });
});

export default app;

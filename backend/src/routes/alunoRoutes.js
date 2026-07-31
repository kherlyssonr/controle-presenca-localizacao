import { Router } from "express";

import {
  painelAluno,
  consultarPresencaHoje,
  registrarPresenca,
} from "../controllers/alunoController.js";

import {
  autenticar,
  autorizarPerfis,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get(
  "/painel",
  autenticar,
  autorizarPerfis("ALUNO"),
  painelAluno
);

router.get(
  "/presenca-hoje",
  autenticar,
  autorizarPerfis("ALUNO"),
  consultarPresencaHoje
);

router.post(
  "/presencas",
  autenticar,
  autorizarPerfis("ALUNO"),
  registrarPresenca
);

export default router;
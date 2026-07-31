import { Router } from "express";

import {
  painelAluno,
  consultarPresencaHoje,
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

export default router;
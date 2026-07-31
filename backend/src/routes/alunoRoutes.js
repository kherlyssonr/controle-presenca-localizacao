import { Router } from "express";

import { painelAluno } from "../controllers/alunoController.js";

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

export default router;
import { Router } from "express";

import {
  painelSupervisor,
  consultarResumoHoje,
  listarAlunosHoje,
  registrarPresencaManual,
  corrigirPresenca,
} from "../controllers/supervisorController.js";

import {
  autenticar,
  autorizarPerfis,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.get(
  "/painel",
  autenticar,
  autorizarPerfis("SUPERVISOR"),
  painelSupervisor
);

router.get(
  "/resumo-hoje",
  autenticar,
  autorizarPerfis("SUPERVISOR"),
  consultarResumoHoje
);

router.get(
  "/alunos-hoje",
  autenticar,
  autorizarPerfis("SUPERVISOR"),
  listarAlunosHoje
);

router.post(
  "/presencas-manuais",
  autenticar,
  autorizarPerfis("SUPERVISOR"),
  registrarPresencaManual
);

router.patch(
  "/presencas/:presencaId",
  autenticar,
  autorizarPerfis("SUPERVISOR"),
  corrigirPresenca
);
export default router;
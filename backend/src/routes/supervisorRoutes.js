import { Router } from "express";

import {
  painelSupervisor,
  consultarResumoHoje,
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

export default router;
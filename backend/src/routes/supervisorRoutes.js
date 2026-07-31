import { Router } from "express";

import { painelSupervisor } from "../controllers/supervisorController.js";

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

export default router;
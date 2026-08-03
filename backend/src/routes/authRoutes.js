import { Router } from "express";

import {
  login,
  perfil,
} from "../controllers/authController.js";

import { autenticar } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/login", login);

router.get("/me", autenticar, perfil);

export default router;
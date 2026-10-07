import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middlewares/authenticate";
import { loginHandler, meHandler } from "./auth.controller";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, reessayez plus tard" },
});

const router = Router();
router.post("/login", loginLimiter, loginHandler);
router.get("/me", authenticate, meHandler);

export default router;

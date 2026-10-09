import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { getHandler, submitHandler } from "./enquete.controller";

// Route publique : limite large, car plusieurs diplomes peuvent partager la meme IP mobile.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { error: "Trop de requetes, reessayez plus tard" },
});

const router = Router();
router.get("/:jeton", limiter, getHandler);
router.post("/:jeton", limiter, submitHandler);

export default router;

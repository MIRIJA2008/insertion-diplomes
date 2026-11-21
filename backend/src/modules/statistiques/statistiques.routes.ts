import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { globalHandler, parFiliereHandler } from "./statistiques.controller";

const router = Router();
// Donnees agregees et anonymes : accessibles a tout utilisateur connecte (admin et consultant).
router.use(authenticate, requireRole("ADMIN", "CONSULTANT"));

router.get("/", globalHandler);
router.get("/par-filiere", parFiliereHandler);

export default router;

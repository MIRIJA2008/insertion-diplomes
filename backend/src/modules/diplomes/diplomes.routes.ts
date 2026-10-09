import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import {
  createHandler,
  deleteHandler,
  getHandler,
  listHandler,
  updateHandler,
} from "./diplomes.controller";

const router = Router();
// Donnees personnelles : reservees a l'administrateur.
router.use(authenticate, requireRole("ADMIN"));

router.get("/", listHandler);
router.get("/:id", getHandler);
router.post("/", createHandler);
router.put("/:id", updateHandler);
router.delete("/:id", deleteHandler);

export default router;

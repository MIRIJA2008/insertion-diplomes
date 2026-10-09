import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import {
  createHandler,
  deleteHandler,
  getHandler,
  listHandler,
  updateHandler,
} from "./promotions.controller";

const router = Router();
router.use(authenticate);

router.get("/", listHandler);
router.get("/:id", getHandler);
router.post("/", requireRole("ADMIN"), createHandler);
router.put("/:id", requireRole("ADMIN"), updateHandler);
router.delete("/:id", requireRole("ADMIN"), deleteHandler);

export default router;

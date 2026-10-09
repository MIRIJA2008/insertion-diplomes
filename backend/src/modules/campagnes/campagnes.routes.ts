import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import {
  cloturerHandler,
  createHandler,
  deleteHandler,
  generateHandler,
  getHandler,
  listHandler,
  listInvitationsHandler,
  ouvrirHandler,
  qrCodeHandler,
  updateHandler,
} from "./campagnes.controller";

const router = Router();
router.use(authenticate);

router.get("/", listHandler);
router.get("/:id", getHandler);

const admin = requireRole("ADMIN");
router.post("/", admin, createHandler);
router.put("/:id", admin, updateHandler);
router.delete("/:id", admin, deleteHandler);
router.post("/:id/ouvrir", admin, ouvrirHandler);
router.post("/:id/cloturer", admin, cloturerHandler);

// Les invitations listent des noms : reservees a l'administrateur.
router.post("/:id/invitations", admin, generateHandler);
router.get("/:id/invitations", admin, listInvitationsHandler);
router.get("/:id/invitations/:invitationId/qrcode", admin, qrCodeHandler);

export default router;

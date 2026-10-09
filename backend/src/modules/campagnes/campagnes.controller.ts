import { RequestHandler } from "express";
import { idSchema } from "../filieres/filieres.schemas";
import { campagneSchema, generateSchema, invitationQuerySchema } from "./campagnes.schemas";
import {
  cloturerCampagne,
  createCampagne,
  deleteCampagne,
  generateInvitations,
  getCampagne,
  getInvitationQrCode,
  listCampagnes,
  listInvitations,
  ouvrirCampagne,
  updateCampagne,
} from "./campagnes.service";

export const listHandler: RequestHandler = async (_req, res) => {
  res.json(await listCampagnes());
};

export const getHandler: RequestHandler = async (req, res) => {
  res.json(await getCampagne(idSchema.parse(req.params.id)));
};

export const createHandler: RequestHandler = async (req, res) => {
  res.status(201).json(await createCampagne(campagneSchema.parse(req.body)));
};

export const updateHandler: RequestHandler = async (req, res) => {
  const id = idSchema.parse(req.params.id);
  res.json(await updateCampagne(id, campagneSchema.parse(req.body)));
};

export const deleteHandler: RequestHandler = async (req, res) => {
  await deleteCampagne(idSchema.parse(req.params.id));
  res.status(204).send();
};

export const ouvrirHandler: RequestHandler = async (req, res) => {
  res.json(await ouvrirCampagne(idSchema.parse(req.params.id)));
};

export const cloturerHandler: RequestHandler = async (req, res) => {
  res.json(await cloturerCampagne(idSchema.parse(req.params.id)));
};

export const generateHandler: RequestHandler = async (req, res) => {
  const id = idSchema.parse(req.params.id);
  res.status(201).json(await generateInvitations(id, generateSchema.parse(req.body ?? {})));
};

export const listInvitationsHandler: RequestHandler = async (req, res) => {
  const id = idSchema.parse(req.params.id);
  res.json(await listInvitations(id, invitationQuerySchema.parse(req.query)));
};

export const qrCodeHandler: RequestHandler = async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const invitationId = idSchema.parse(req.params.invitationId);
  const png = await getInvitationQrCode(id, invitationId);
  res.type("image/png").send(png);
};

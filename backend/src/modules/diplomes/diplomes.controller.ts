import { RequestHandler } from "express";
import { idSchema } from "../filieres/filieres.schemas";
import { diplomeQuerySchema, diplomeSchema } from "./diplomes.schemas";
import {
  createDiplome,
  deleteDiplome,
  getDiplome,
  listDiplomes,
  updateDiplome,
} from "./diplomes.service";

export const listHandler: RequestHandler = async (req, res) => {
  res.json(await listDiplomes(diplomeQuerySchema.parse(req.query)));
};

export const getHandler: RequestHandler = async (req, res) => {
  res.json(await getDiplome(idSchema.parse(req.params.id)));
};

export const createHandler: RequestHandler = async (req, res) => {
  res.status(201).json(await createDiplome(diplomeSchema.parse(req.body)));
};

export const updateHandler: RequestHandler = async (req, res) => {
  const id = idSchema.parse(req.params.id);
  res.json(await updateDiplome(id, diplomeSchema.parse(req.body)));
};

export const deleteHandler: RequestHandler = async (req, res) => {
  await deleteDiplome(idSchema.parse(req.params.id));
  res.status(204).send();
};

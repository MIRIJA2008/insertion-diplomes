import { RequestHandler } from "express";
import { filiereSchema, idSchema } from "./filieres.schemas";
import {
  createFiliere,
  deleteFiliere,
  getFiliere,
  listFilieres,
  updateFiliere,
} from "./filieres.service";

export const listHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await listFilieres());
  } catch (e) {
    next(e);
  }
};

export const getHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await getFiliere(idSchema.parse(req.params.id)));
  } catch (e) {
    next(e);
  }
};

export const createHandler: RequestHandler = async (req, res, next) => {
  try {
    res.status(201).json(await createFiliere(filiereSchema.parse(req.body)));
  } catch (e) {
    next(e);
  }
};

export const updateHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    res.json(await updateFiliere(id, filiereSchema.parse(req.body)));
  } catch (e) {
    next(e);
  }
};

export const deleteHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteFiliere(idSchema.parse(req.params.id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

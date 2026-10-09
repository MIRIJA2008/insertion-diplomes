import { RequestHandler } from "express";
import { idSchema } from "../filieres/filieres.schemas";
import { promotionQuerySchema, promotionSchema } from "./promotions.schemas";
import {
  createPromotion,
  deletePromotion,
  getPromotion,
  listPromotions,
  updatePromotion,
} from "./promotions.service";

export const listHandler: RequestHandler = async (req, res) => {
  res.json(await listPromotions(promotionQuerySchema.parse(req.query)));
};

export const getHandler: RequestHandler = async (req, res) => {
  res.json(await getPromotion(idSchema.parse(req.params.id)));
};

export const createHandler: RequestHandler = async (req, res) => {
  res.status(201).json(await createPromotion(promotionSchema.parse(req.body)));
};

export const updateHandler: RequestHandler = async (req, res) => {
  const id = idSchema.parse(req.params.id);
  res.json(await updatePromotion(id, promotionSchema.parse(req.body)));
};

export const deleteHandler: RequestHandler = async (req, res) => {
  await deletePromotion(idSchema.parse(req.params.id));
  res.status(204).send();
};

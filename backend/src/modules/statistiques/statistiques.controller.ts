import { RequestHandler } from "express";
import { statsQuerySchema } from "./statistiques.schemas";
import { calculerStatistiques, statistiquesParFiliere } from "./statistiques.service";

export const globalHandler: RequestHandler = async (req, res) => {
  res.json(await calculerStatistiques(statsQuerySchema.parse(req.query)));
};

export const parFiliereHandler: RequestHandler = async (req, res) => {
  res.json(await statistiquesParFiliere(statsQuerySchema.parse(req.query)));
};

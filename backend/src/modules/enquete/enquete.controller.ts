import { RequestHandler } from "express";
import { jetonSchema, reponseSchema } from "./enquete.schemas";
import { getEnquete, submitReponse } from "./enquete.service";

export const getHandler: RequestHandler = async (req, res) => {
  res.json(await getEnquete(jetonSchema.parse(req.params.jeton)));
};

export const submitHandler: RequestHandler = async (req, res) => {
  const jeton = jetonSchema.parse(req.params.jeton);
  await submitReponse(jeton, reponseSchema.parse(req.body));
  res.status(201).json({ message: "Merci, votre reponse a ete enregistree" });
};

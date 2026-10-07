import { RequestHandler } from "express";
import { loginSchema } from "./auth.schemas";
import { getProfile, login } from "./auth.service";

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, motDePasse } = loginSchema.parse(req.body);
    res.json(await login(email, motDePasse));
  } catch (e) {
    next(e);
  }
};

export const meHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await getProfile(req.user!.id));
  } catch (e) {
    next(e);
  }
};

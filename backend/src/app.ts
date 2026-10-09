import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/prisma";
import authRoutes from "./modules/auth/auth.routes";
import filiereRoutes from "./modules/filieres/filieres.routes";
import promotionRoutes from "./modules/promotions/promotions.routes";
import diplomeRoutes from "./modules/diplomes/diplomes.routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "error", db: "indisponible" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/filieres", filiereRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/diplomes", diplomeRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.use(errorHandler);

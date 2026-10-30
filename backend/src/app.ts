import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/prisma";
import authRoutes from "./modules/auth/auth.routes";
import filiereRoutes from "./modules/filieres/filieres.routes";
import promotionRoutes from "./modules/promotions/promotions.routes";
import diplomeRoutes from "./modules/diplomes/diplomes.routes";
import campagneRoutes from "./modules/campagnes/campagnes.routes";
import enqueteRoutes from "./modules/enquete/enquete.routes";
import statistiqueRoutes from "./modules/statistiques/statistiques.routes";
import { inscriptionRoutes } from "./modules/inscription/inscription.routes";
import { offresRoutes } from "./modules/offres/offres.routes";
import { candidaturesRoutes } from "./modules/candidatures/candidatures.routes";
import { profilsRoutes } from "./modules/profils/profils.routes";
import { recruteursRoutes } from "./modules/recruteurs/recruteurs.routes";
import { publicRoutes } from "./modules/public/public.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { communautesRoutes } from "./modules/communautes/communautes.routes";
import { messagerieRoutes } from "./modules/messagerie/messagerie.routes";
import { alertesRoutes } from "./modules/alertes/alertes.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { suggestionsRoutes } from "./modules/suggestions/suggestions.routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
// Limite relevee pour permettre l'envoi du CV en base64
app.use(express.json({ limit: "15mb" }));

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

// Routes existantes (inchangees)
app.use("/api/auth", authRoutes);
app.use("/api/filieres", filiereRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/diplomes", diplomeRoutes);
app.use("/api/campagnes", campagneRoutes);
app.use("/api/enquete", enqueteRoutes);
app.use("/api/statistiques", statistiqueRoutes);

// Routes ajoutees par la refonte
app.use("/api/inscription", inscriptionRoutes);
app.use("/api/offres", offresRoutes);
app.use("/api", candidaturesRoutes);
app.use("/api/profils", profilsRoutes);
app.use("/api/recruteurs", recruteursRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/communautes", communautesRoutes);
app.use("/api/messagerie", messagerieRoutes);
app.use("/api/alertes", alertesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/suggestions", suggestionsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.use(errorHandler);
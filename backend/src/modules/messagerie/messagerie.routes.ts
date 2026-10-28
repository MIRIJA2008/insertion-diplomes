import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const messagerieRoutes = Router();
messagerieRoutes.use(authenticate);

messagerieRoutes.get("/conversations", async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { membres: { some: { utilisateurId: req.user!.id } } },
      include: {
        membres: { include: { utilisateur: { select: { id: true, nom: true, role: true } } } },
        messages: { orderBy: { envoyeLe: "desc" }, take: 1 },
      },
      orderBy: { id: "desc" },
    });
    res.json(conversations);
  } catch (e) {
    next(e);
  }
});

messagerieRoutes.post("/conversations", async (req, res, next) => {
  try {
    const { utilisateurId } = z.object({ utilisateurId: z.number().int() }).parse(req.body);
    if (utilisateurId === req.user!.id) throw new HttpError(400, "Vous ne pouvez pas ecrire a vous-meme");
    const autre = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!autre) throw new HttpError(404, "Utilisateur introuvable");
    const existante = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [{ membres: { some: { utilisateurId: req.user!.id } } }, { membres: { some: { utilisateurId } } }],
      },
    });
    if (existante) return res.json(existante);
    const conversation = await prisma.conversation.create({
      data: { type: "DIRECT", membres: { create: [{ utilisateurId: req.user!.id }, { utilisateurId }] } },
    });
    res.status(201).json(conversation);
  } catch (e) {
    next(e);
  }
});

messagerieRoutes.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const membre = await prisma.conversationMembre.findUnique({
      where: { conversationId_utilisateurId: { conversationId: Number(req.params.id), utilisateurId: req.user!.id } },
    });
    if (!membre) throw new HttpError(403, "Acces refuse");
    const messages = await prisma.message.findMany({
      where: { conversationId: Number(req.params.id) },
      include: { auteur: { select: { id: true, nom: true } } },
      orderBy: { envoyeLe: "asc" },
      take: 200,
    });
    res.json(messages);
  } catch (e) {
    next(e);
  }
});

messagerieRoutes.post("/conversations/:id/messages", async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const membre = await prisma.conversationMembre.findUnique({
      where: { conversationId_utilisateurId: { conversationId, utilisateurId: req.user!.id } },
    });
    if (!membre) throw new HttpError(403, "Acces refuse");
    const { contenu } = z.object({ contenu: z.string().min(1).max(2000) }).parse(req.body);
    const message = await prisma.message.create({
      data: { conversationId, auteurId: req.user!.id, contenu },
      include: { auteur: { select: { id: true, nom: true } } },
    });
    // Notifier les autres membres de la conversation (fire & forget)
    prisma.conversationMembre.findMany({
      where: { conversationId: Number(req.params.id), NOT: { utilisateurId: req.user!.id } },
      select: { utilisateurId: true },
    }).then((membres) => {
      if (membres.length > 0) {
        prisma.notification.createMany({
          data: membres.map((m) => ({
            utilisateurId: m.utilisateurId,
            titre: "Nouveau message",
            contenu: "Vous avez recu un nouveau message.",
          })),
        }).catch(() => {});
      }
    }).catch(() => {});
    const autres = await prisma.conversationMembre.findMany({
      where: { conversationId, utilisateurId: { not: req.user!.id } },
    });
    if (autres.length > 0) {
      await prisma.notification.createMany({
        data: autres.map((m) => ({ utilisateurId: m.utilisateurId, titre: "Nouveau message", contenu: contenu.slice(0, 80) })),
      });
    }
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});
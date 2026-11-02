import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";

export const adminRoutes = Router();
adminRoutes.use(authenticate, requireRole("ADMIN", "CONSULTANT"));

// Journal d'audit
adminRoutes.get("/audit", async (req, res, next) => {
  try {
    const logs = await prisma.activiteLog.findMany({ orderBy: { creeLe: "desc" }, take: 100 });
    res.json(logs);
  } catch (e) { next(e); }
});

// Dashboard : toutes les statistiques globales
adminRoutes.get("/dashboard", async (req, res, next) => {
  try {
    const [
      totalDiplomes, totalRecruteurs, totalOffres, totalCandidatures,
      offresOuvertes, candidaturesEnAttente, suggestionsEnAttente
    ] = await Promise.all([
      prisma.utilisateur.count({ where: { role: "CANDIDAT" } }),
      prisma.utilisateur.count({ where: { role: "RECRUTEUR" } }),
      prisma.offre.count(),
      prisma.candidature.count(),
      prisma.offre.count({ where: { dateLimite: { gte: new Date() } } }),
      prisma.candidature.count({ where: { statut: "ENVOYEE" } }),
      prisma.suggestion.count({ where: { statut: "NOUVELLE" } }),
    ]);

    // Evolution des inscriptions (6 derniers mois)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const inscriptions = await prisma.utilisateur.findMany({
      where: { creeLe: { gte: sixMonthsAgo } },
      select: { creeLe: true, role: true },
    });

    const evolution: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      evolution[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    for (const u of inscriptions) {
      const key = `${u.creeLe.getFullYear()}-${String(u.creeLe.getMonth() + 1).padStart(2, "0")}`;
      if (evolution[key] !== undefined) evolution[key]++;
    }

    res.json({
      totalDiplomes, totalRecruteurs, totalOffres, totalCandidatures,
      offresOuvertes, candidaturesEnAttente, suggestionsEnAttente,
      evolutionInscriptions: Object.entries(evolution).reverse().map(([mois, count]) => ({ mois, count })),
    });
  } catch (e) { next(e); }
});
// Liste des diplômés avec recherche et filtres
adminRoutes.get("/diplomes", async (req, res, next) => {
  try {
    const { q, filiereId } = req.query;
    const where: any = { role: "CANDIDAT" };
    
    if (q) {
      where.OR = [
        { nom: { contains: String(q), mode: "insensitive" } },
        { email: { contains: String(q), mode: "insensitive" } },
      ];
    }
    
    if (filiereId) {
      where.profilCandidat = { filiereId: Number(filiereId) };
    }

    const diplomes = await prisma.utilisateur.findMany({
      where,
      include: {
        profilCandidat: { include: { filiere: true } },
        _count: { select: { candidatures: true } },
      },
      orderBy: { creeLe: "desc" },
      take: 100,
    });
    res.json(diplomes);
  } catch (e) { next(e); }
});

// Fiche complete d'un diplome
adminRoutes.get("/diplomes/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const diplome = await prisma.utilisateur.findUnique({
      where: { id },
      include: {
        profilCandidat: { include: { filiere: true } },
        candidatures: {
          include: {
            offre: { include: { organisme: true } },
            historique: { orderBy: { creeLe: "desc" } },
          },
          orderBy: { dateEnvoi: "desc" },
        },
        favoris: { include: { offre: true } },
      },
    });
    if (!diplome) return res.status(404).json({ error: "Diplome introuvable" });
    res.json(diplome);
  } catch (e) { next(e); }
});
// Liste des organismes recruteurs
adminRoutes.get("/organismes", async (req, res, next) => {
  try {
    const { q } = req.query;
    const where: any = {};
    if (q) {
      where.nom = { contains: String(q), mode: "insensitive" };
    }

    const organismes = await prisma.organisme.findMany({
      where,
      include: {
        utilisateur: { select: { email: true } },
        _count: { select: { offres: true } },
      },
      orderBy: { nom: "asc" },
    });
    res.json(organismes);
  } catch (e) { next(e); }
});

// Detail d'un organisme
adminRoutes.get("/organismes/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const organisme = await prisma.organisme.findUnique({
      where: { id },
      include: {
        utilisateur: { select: { email: true } },
        offres: {
          include: {
            _count: { select: { candidatures: true } },
          },
          orderBy: { creeLe: "desc" },
        },
      },
    });
    if (!organisme) return res.status(404).json({ error: "Organisme introuvable" });
    res.json(organisme);
  } catch (e) { next(e); }
});

// Verifier un organisme
adminRoutes.patch("/organismes/:id/verifier", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { verifie } = req.body;
    
    const updated = await prisma.organisme.update({
      where: { id },
      data: { verifie: Boolean(verifie) },
    });

    await prisma.activiteLog.create({
      data: {
        action: verifie ? "ORGANISME_VERIFIE" : "ORGANISME_NON_VERIFIE",
        details: `L organisme ${updated.nom} a ete ${verifie ? "verifie" : "revoque"}`,
      },
    });

    res.json(updated);
  } catch (e) { next(e); }
});
// Statistiques d'insertion
adminRoutes.get("/stats-insertion", async (req, res, next) => {
  try {
    // 1. Repartition par situation professionnelle
    const situations = await prisma.profilCandidat.groupBy({
      by: ["situationPro"],
      _count: true,
    });

    // 2. Repartition par filiere
    const filieres = await prisma.filiere.findMany({
      include: {
        _count: { select: { profils: true } },
      },
    });

    // 3. Taux de verification
    const totalProfils = await prisma.profilCandidat.count();
    const profilsVerifies = await prisma.profilCandidat.count({ where: { verifie: true } });

    res.json({
      situations: situations.map(s => ({ statut: s.situationPro || "INCONNU", count: s._count })),
      filieres: filieres.map(f => ({ nom: f.intitule, code: f.code, count: f._count.profils })),
      verification: { total: totalProfils, verifies: profilsVerifies },
    });
  } catch (e) { next(e); }
});
// Export CSV : Liste des diplômés
adminRoutes.get("/export/diplomes", async (req, res, next) => {
  try {
    const diplomes = await prisma.utilisateur.findMany({
      where: { role: "CANDIDAT" },
      include: { profilCandidat: { include: { filiere: true } } },
    });

    let csv = "Nom,Email,Inscrit le,Filiere,Niveau,Situation,Verifie\n";
    for (const d of diplomes) {
      const date = new Date(d.creeLe).toLocaleDateString("fr-FR");
      const filiere = d.profilCandidat?.filiere?.intitule || "";
      const niveau = d.profilCandidat?.niveauEtudes || "";
      const situation = d.profilCandidat?.situationPro || "INCONNU";
      const verifie = d.profilCandidat?.verifie ? "Oui" : "Non";
      csv += `"${d.nom}","${d.email}","${date}","${filiere}","${niveau}","${situation}","${verifie}"\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=diplomes.csv");
    res.send(csv);
  } catch (e) { next(e); }
});

// Export CSV : Statistiques d'insertion
adminRoutes.get("/export/stats", async (req, res, next) => {
  try {
    const situations = await prisma.profilCandidat.groupBy({
      by: ["situationPro"],
      _count: true,
    });

    let csv = "Situation Professionnelle,Nombre de diplomes\n";
    for (const s of situations) {
      csv += `"${s.situationPro || "INCONNU"}",${s._count}\n`;
    }

    const filieres = await prisma.filiere.findMany({
      include: { _count: { select: { profils: true } } },
    });
    csv += "\nFiliere,Nombre de diplomes\n";
    for (const f of filieres) {
      csv += `"${f.intitule}",${f._count.profils}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=statistiques.csv");
    res.send(csv);
  } catch (e) { next(e); }
});
// Lister les alertes
adminRoutes.get("/alertes", async (req, res, next) => {
  try {
    const alertes = await prisma.alerteAdmin.findMany({
      orderBy: [{ statut: "asc" }, { priorite: "desc" }, { creeLe: "desc" }],
    });
    res.json(alertes);
  } catch (e) { next(e); }
});

// Générer des alertes automatiquement (scan de la base)
adminRoutes.post("/alertes/generer", async (req, res, next) => {
  try {
    let count = 0;
    const diplomes = await prisma.utilisateur.findMany({
      where: { role: "CANDIDAT" },
      include: { profilCandidat: true },
    });

    for (const d of diplomes) {
      // 1. Alerte : Profil incomplet
      if (!d.profilCandidat?.cvPdf || !d.profilCandidat?.etablissement) {
        const existe = await prisma.alerteAdmin.findFirst({
          where: { diplomeId: d.id, type: "PROFIL_INCOMPLET", statut: { not: "RESOLUE" } },
        });
        if (!existe) {
          await prisma.alerteAdmin.create({
            data: { diplomeId: d.id, type: "PROFIL_INCOMPLET", priorite: "MOYENNE" },
          });
          count++;
        }
      }

      // 2. Alerte : Situation inconnue
      if (d.profilCandidat?.situationPro === "INCONNU") {
        const existe = await prisma.alerteAdmin.findFirst({
          where: { diplomeId: d.id, type: "SITUATION_INCONNUE", statut: { not: "RESOLUE" } },
        });
        if (!existe) {
          await prisma.alerteAdmin.create({
            data: { diplomeId: d.id, type: "SITUATION_INCONNUE", priorite: "HAUTE" },
          });
          count++;
        }
      }
    }

    res.json({ ok: true, count });
  } catch (e) { next(e); }
});

// Changer le statut d'une alerte
adminRoutes.patch("/alertes/:id", async (req, res, next) => {
  try {
    const { statut, commentaire } = req.body;
    const alerte = await prisma.alerteAdmin.update({
      where: { id: Number(req.params.id) },
      data: { statut, commentaire },
    });
    res.json(alerte);
  } catch (e) { next(e); }
});
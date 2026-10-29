import { prisma } from "../../config/prisma";

export interface MatchingResult {
  score: number;
  raisons: string[];
  manques: string[];
}

interface ProfilData {
  filiereId: number | null;
  niveauEtudes: string | null;
  competences: string[];
}

interface OffreData {
  filiereId: number | null;
  niveauRequis: string | null;
  competencesRecherchees: string[];
  lieu: string;
}

function normaliser(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

export function calculerMatching(profil: ProfilData | null, offre: OffreData): MatchingResult {
  const raisons: string[] = [];
  const manques: string[] = [];
  let score = 0;

  if (!profil) {
    return { score: 0, raisons: ["Completez votre profil pour un matching personnalise"], manques: [] };
  }

  // ═══════ Competences (40%) ═══════
  const compProfil = new Set(profil.competences.map(normaliser));
  const compOffre = offre.competencesRecherchees.map(normaliser);
  const compMatch = compOffre.filter((c) => compProfil.has(c));
  const compManques = offre.competencesRecherchees.filter((_, i) => !compProfil.has(compOffre[i]));

  if (compOffre.length === 0) {
    score += 20; // Pas de competences requises = neutre
    raisons.push("Aucune competence specifique requise pour cette offre");
  } else {
    const ratio = compMatch.length / compOffre.length;
    score += Math.round(ratio * 40);
    if (compMatch.length > 0) {
      raisons.push(`${compMatch.length} competence(s) requise(s) sur ${compOffre.length} (${offre.competencesRecherchees.slice(0, compMatch.length).join(", ")})`);
    }
    if (compManques.length > 0) {
      manques.push(...compManques);
    }
  }

  // ═══════ Filiere (30%) ═══════
  if (profil.filiereId && offre.filiereId) {
    if (profil.filiereId === offre.filiereId) {
      score += 30;
      raisons.push("Votre filiere correspond a celle demandee");
    } else {
      manques.push("Filiere differente de celle demandee");
    }
  } else if (!offre.filiereId) {
    score += 15;
  }

  // ═══════ Niveau (20%) ═══════
  if (profil.niveauEtudes && offre.niveauRequis) {
    const p = profil.niveauEtudes.toLowerCase();
    const r = offre.niveauRequis.toLowerCase();
    // Heuristique simple : si les 2 mentionnent "licence" ou "master", on considere OK
    const mentionP = p.includes("licence") ? "licence" : p.includes("master") ? "master" : p.includes("doctorat") ? "doctorat" : "";
    const mentionR = r.includes("licence") ? "licence" : r.includes("master") ? "master" : r.includes("doctorat") ? "doctorat" : "";
    if (mentionP && mentionR) {
      if (mentionP === mentionR) {
        score += 20;
        raisons.push("Votre niveau d etudes correspond au niveau demande");
      } else if ((mentionP === "master" && mentionR === "licence") || (mentionP === "doctorat" && (mentionR === "master" || mentionR === "licence"))) {
        score += 20;
        raisons.push("Votre niveau depasse le minimum requis");
      } else {
        score += 5;
        manques.push("Niveau d etudes en dessous du minimum demande");
      }
    } else {
      score += 10;
    }
  } else if (!offre.niveauRequis) {
    score += 10;
  }

  // ═══════ Localisation (10%) ═══════
  // On ne peut pas savoir la ville du candidat (pas dans ProfilCandidat), donc on attribue neutre
  score += 10;

  return { score: Math.min(100, score), raisons, manques };
}

export async function getProfilCandidat(utilisateurId: number) {
  const p = await prisma.profilCandidat.findUnique({
    where: { utilisateurId },
    select: { filiereId: true, niveauEtudes: true, competences: true },
  });
  return p;
}

import { z } from "zod";

export const SECTEURS = [
  "Agriculture et elevage",
  "Industrie et mecanique",
  "Batiment et travaux publics",
  "Electricite et energie",
  "Numerique et informatique",
  "Commerce et services",
  "Tourisme et hotellerie",
  "Sante et social",
  "Administration publique",
  "Education et formation",
  "Autre",
] as const;

export const jetonSchema = z
  .string()
  .min(20)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);

const EMPLOIS: string[] = ["EMPLOI_SALARIE", "EMPLOI_INDEPENDANT"];

export const reponseSchema = z
  .object({
    consentement: z.literal(true, { message: "Le consentement est obligatoire" }),
    situation: z.enum([
      "EMPLOI_SALARIE",
      "EMPLOI_INDEPENDANT",
      "POURSUITE_ETUDES",
      "RECHERCHE_EMPLOI",
      "AUTRE",
    ]),
    secteur: z.enum(SECTEURS).nullish(),
    typeContrat: z.enum(["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"]).nullish(),
    delaiInsertionMois: z.number().int().min(0).max(120).nullish(),
    ville: z.string().trim().min(1).max(100),
    adequationFormation: z.number().int().min(1).max(5).nullish(),
    remarque: z.string().trim().max(500).nullish(),
  })
  .superRefine((d, ctx) => {
    if (!EMPLOIS.includes(d.situation)) return;
    for (const champ of ["secteur", "typeContrat", "delaiInsertionMois", "adequationFormation"] as const) {
      if (d[champ] == null) {
        ctx.addIssue({
          code: "custom",
          message: "Champ obligatoire pour une personne en emploi",
          path: [champ],
        });
      }
    }
  })
  .transform((d) => {
    const enEmploi = EMPLOIS.includes(d.situation);
    return {
      consentement: true as const,
      situation: d.situation,
      ville: d.ville,
      remarque: d.remarque || null,
      secteur: enEmploi ? (d.secteur ?? null) : null,
      typeContrat: enEmploi ? (d.typeContrat ?? null) : null,
      delaiInsertionMois: enEmploi ? (d.delaiInsertionMois ?? null) : null,
      adequationFormation: enEmploi ? (d.adequationFormation ?? null) : null,
    };
  });

export type ReponseData = z.output<typeof reponseSchema>;

import { z } from "zod";

export const campagneSchema = z
  .object({
    titre: z.string().trim().min(3).max(150),
    dateDebut: z.coerce.date(),
    dateFin: z.coerce.date(),
  })
  .refine((d) => d.dateFin > d.dateDebut, {
    message: "La date de fin doit etre apres la date de debut",
    path: ["dateFin"],
  });

export const generateSchema = z.object({
  promotionId: z.coerce.number().int().positive().optional(),
  filiereId: z.coerce.number().int().positive().optional(),
  anneeSortie: z.coerce.number().int().optional(),
});

export const invitationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  statut: z.enum(["repondu", "en_attente"]).optional(),
});

export type CampagneInput = z.infer<typeof campagneSchema>;
export type GenerateInput = z.infer<typeof generateSchema>;
export type InvitationQuery = z.infer<typeof invitationQuerySchema>;

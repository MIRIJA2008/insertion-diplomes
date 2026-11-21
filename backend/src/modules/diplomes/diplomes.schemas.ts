import { z } from "zod";

export const diplomeSchema = z.object({
  nom: z.string().trim().min(1).max(100),
  prenom: z.string().trim().min(1).max(100),
  promotionId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contact: z
    .string()
    .trim()
    .max(150)
    .nullish()
    .transform((v) => (v ? v : null)),
});

export const diplomeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).optional(),
  promotionId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  filiereId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  anneeSortie: z.coerce.number().int().min(1990).max(2100).optional(),
});

export type DiplomeInput = z.infer<typeof diplomeSchema>;
export type DiplomeQuery = z.infer<typeof diplomeQuerySchema>;

import { z } from "zod";

export const promotionSchema = z.object({
  filiereId: z.coerce.number().int().positive(),
  anneeSortie: z.coerce.number().int().min(1990).max(2100),
  effectif: z.coerce.number().int().min(0).nullish(),
});

export const promotionQuerySchema = z.object({
  filiereId: z.coerce.number().int().positive().optional(),
  anneeSortie: z.coerce.number().int().optional(),
});

export type PromotionInput = z.infer<typeof promotionSchema>;
export type PromotionQuery = z.infer<typeof promotionQuerySchema>;

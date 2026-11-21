import { z } from "zod";

export const promotionSchema = z.object({
  filiereId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  anneeSortie: z.coerce.number().int().min(1990).max(2100),
  effectif: z.coerce.number().int().min(0).nullish(),
});

export const promotionQuerySchema = z.object({
  filiereId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  anneeSortie: z.coerce.number().int().min(1990).max(2100).optional(),
});

export type PromotionInput = z.infer<typeof promotionSchema>;
export type PromotionQuery = z.infer<typeof promotionQuerySchema>;

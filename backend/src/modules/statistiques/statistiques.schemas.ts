import { z } from "zod";

export const statsQuerySchema = z.object({
  campagneId: z.coerce.number().int().positive().optional(),
  filiereId: z.coerce.number().int().positive().optional(),
  anneeSortie: z.coerce.number().int().min(1990).max(2100).optional(),
});

export type StatsQuery = z.infer<typeof statsQuerySchema>;

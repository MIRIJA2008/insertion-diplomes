import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();

export const filiereSchema = z.object({
  code: z.string().trim().min(1).max(20).toUpperCase(),
  intitule: z.string().trim().min(2).max(150),
  niveau: z.string().trim().min(1).max(50),
});

export type FiliereInput = z.infer<typeof filiereSchema>;

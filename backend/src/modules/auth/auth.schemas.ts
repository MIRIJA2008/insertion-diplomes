import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  motDePasse: z.string().min(1),
});

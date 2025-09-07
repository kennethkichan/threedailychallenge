import { z } from 'zod';

// Schema for a single problem, used for validation
export const ProblemSchema = z.object({
  id: z.string(),
  problem_type: z.string(),
  difficulty: z.number(),
  prompt: z.string(),
  data: z.object({
    options: z.array(z.string()),
  }),
  answer: z.string(),
  solution_explanation: z.string().optional(),
  age_group: z.string().optional(),
  reviewed: z.number().optional(),
  reviewed_on: z.string().optional(),
  is_active: z.number().optional(),
});

// Deriving the TypeScript type from the Zod schema
export type Problem = z.infer<typeof ProblemSchema>;

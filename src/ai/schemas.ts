import { z } from 'zod';

// Define the schema for a single challenge
export const ChallengeSchema = z.object({
  problemType: z.enum(['Pattern Recognition', 'Shortcut Calculation', 'Mixed Reasoning']).describe('The type of problem (Pattern Recognition, Shortcut Calculation, or Mixed Reasoning).'),
  problemStatement: z.string().describe('The problem statement.'),
  choices: z.array(z.string()).describe('An array of four randomized answer choices.'),
  correctValue: z.string().describe('The single correct answer value, which must be one of the items in the choices array.'),
  answer: z.string().describe("The letter corresponding to the correct choice ('A', 'B', 'C', or 'D')."),
  solutionExplanation: z.string().describe('A brief explanation of the solution and any shortcuts used.'),
});

// Define the input schema for challenge generation
export const DailyChallengeInputSchema = z.object({
  count: z.number().optional().default(3).describe('The number of challenges to generate.'),
});

// Define the output schema for challenge generation
export const DailyChallengeOutputSchema = z.array(ChallengeSchema);

// Define TypeScript types inferred from the Zod schemas
export type Challenge = z.infer<typeof ChallengeSchema>;
export type DailyChallengeInput = z.infer<typeof DailyChallengeInputSchema>;
export type DailyChallengeOutput = z.infer<typeof DailyChallengeOutputSchema>;
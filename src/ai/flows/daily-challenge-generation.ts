'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a daily set of logic challenges.
 *
 * - generateDailyChallenges - A function that generates a set of 3 logic challenges for high school students.
 * - DailyChallengeInput - The input type for the generateDailyChallenges function (currently empty).
 * - DailyChallengeOutput - The return type for the generateDailyChallenges function, defining the structure of the generated challenges.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single challenge
const ChallengeSchema = z.object({
  problemType: z.string().describe('The type of problem (Pattern Recognition, Shortcut Calculation, or Mixed Reasoning)'),
  problemStatement: z.string().describe('The problem statement'),
  choices: z.array(z.string()).describe('An array of four answer choices (A, B, C, D)'),
  answer: z.string().describe('The correct answer (A, B, C, or D)'),
  solutionExplanation: z.string().describe('A brief explanation of the solution and any shortcuts used'),
});

// Define the input schema (currently empty, but can be extended later)
const DailyChallengeInputSchema = z.object({});
export type DailyChallengeInput = z.infer<typeof DailyChallengeInputSchema>;

// Define the output schema as an array of challenges
const DailyChallengeOutputSchema = z.array(ChallengeSchema);
export type DailyChallengeOutput = z.infer<typeof DailyChallengeOutputSchema>;

// Exported function to generate daily challenges
export async function generateDailyChallenges(input: DailyChallengeInput): Promise<DailyChallengeOutput> {
  return generateDailyChallengesFlow(input);
}

// Define the prompt
const dailyChallengePrompt = ai.definePrompt({
  name: 'dailyChallengePrompt',
  input: {schema: DailyChallengeInputSchema},
  output: {schema: DailyChallengeOutputSchema},
  prompt: `Daily Challenge: Pattern & Formula Logic Game

Create a set of 3 logic problems suitable for high school students. Each problem should fall into one of these categories:

Pattern Recognition: Identify the next item in a numerical or visual sequence, or determine the rule governing a set.

Shortcut Calculation: Solve a problem using a mathematical formula or trick (e.g., sum of an arithmetic series, quick multiplication, divisibility rules).

Mixed Reasoning: Combine pattern recognition with a shortcut calculation for a multi-step solution.

For each problem, provide:

The problem statement

Four answer choices (A, B, C, D)

The correct answer

A brief explanation of the solution and any shortcuts used

Ensure the output is a JSON array of Challenge objects with the fields \"problemType\", \"problemStatement\", \"choices\", \"answer\", and \"solutionExplanation\". Vary the topics daily (algebra, geometry, number theory, etc.). Ensure at least one problem uses a shortcut or clever calculation. Keep explanations concise but clear, highlighting the pattern or shortcut. Target difficulty for high school level, but include occasional stretch problems for engagement.

Output:`, //Crucially ask for valid json for the Genkit schema to parse.
});

// Define the flow
const generateDailyChallengesFlow = ai.defineFlow(
  {
    name: 'generateDailyChallengesFlow',
    inputSchema: DailyChallengeInputSchema,
    outputSchema: DailyChallengeOutputSchema,
  },
  async input => {
    const {output} = await dailyChallengePrompt(input);
    return output!;
  }
);

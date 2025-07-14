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
  prompt: `You are a master puzzle creator. Your task is to generate 3 unique and engaging logic problems for high school students.

**Instructions:**
1.  **Create 3 Problems:**
    *   **Problem 1: Pattern Recognition:** Identify the next item in a sequence or the rule for a set.
    *   **Problem 2: Shortcut Calculation:** Solve using a mathematical formula or trick (e.g., sum of series, divisibility rules).
    *   **Problem 3: Mixed Reasoning:** Combine pattern recognition with a shortcut.
2.  **For each problem, follow this exact process:**
    a.  First, create the \`problemStatement\`.
    b.  Second, solve the problem yourself and write a clear, step-by-step \`solutionExplanation\`.
    c.  Third, based on your solution, determine the single, unambiguously correct answer.
    d.  Fourth, create three incorrect but plausible distractors.
    e.  Fifth, create the \`choices\` array containing the one correct answer and the three distractors. The order should be randomized.
    f.  Finally, determine the letter (A, B, C, or D) corresponding to the correct answer in your randomized \`choices\` array and set it as the \`answer\`.

3.  **Critical Quality Control:**
    *   **Triple-check your work.** The \`answer\` must match the correct option in the \`choices\` array. The \`solutionExplanation\` must correctly solve the \`problemStatement\`. There should be no ambiguity or errors.
    *   **Vary topics:** Use a mix of algebra, geometry, number theory, etc.

4.  **Output Format:**
    *   The final output must be a valid JSON array of 3 challenge objects matching the provided schema.

Output:`,
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

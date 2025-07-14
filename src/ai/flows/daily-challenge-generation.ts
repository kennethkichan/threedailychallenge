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
  prompt: `You are a master puzzle creator for a high school audience. Your task is to generate a set of 3 unique and engaging logic problems.

**Instructions:**
1.  **Create 3 Problems:**
    *   **Problem 1: Pattern Recognition:** Identify the next item in a sequence or the rule for a set.
    *   **Problem 2: Shortcut Calculation:** Solve using a mathematical formula or trick (e.g., sum of series, divisibility rules, systems of equations).
    *   **Problem 3: Mixed Reasoning:** A problem that requires both pattern-finding and calculation.

2.  **For each problem, follow this exact, critical process:**
    a.  **Step 1: Create the \`problemStatement\`.**
    b.  **Step 2: Solve the problem yourself and write a clear, step-by-step \`solutionExplanation\`.** The explanation must be logical and lead to one single, unambiguously correct answer.
    c.  **Step 3: State the correct answer** based on your solution. This is your "correct value".
    d.  **Step 4: Create three plausible but incorrect "distractor" choices.** These should be based on common mistakes a student might make. For each distractor, briefly explain the flawed logic that would lead to it. For example: "Distractor 1: 25. This is wrong because the student forgot to carry the one."
    e.  **Step 5: Create the \`choices\` array** containing the one "correct value" and the three "distractor" values. The order of these four choices must be randomized.
    f.  **Step 6: Determine the letter (A, B, C, or D) corresponding to the correct answer's position** in your new randomized \`choices\` array and set it as the \`answer\`.

3.  **Critical Quality Control:**
    *   **TRIPLE-CHECK YOUR WORK.** The final \`answer\` letter must point to the correct value in the \`choices\` array. The \`solutionExplanation\` must perfectly solve the \`problemStatement\`. There should be no ambiguity or errors. The problem must be solvable with the information given.
    *   **Vary topics:** Use a mix of algebra, geometry, number theory, classic logic puzzles, etc.

4.  **Final Output Format:**
    *   The final output must be a valid JSON array of 3 challenge objects matching the provided schema. Do not include your reasoning for the distractors in the final JSON output.

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

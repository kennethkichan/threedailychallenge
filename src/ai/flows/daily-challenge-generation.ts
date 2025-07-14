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
  prompt: `You are a meticulous and brilliant puzzle creator for a high school audience. Your primary goal is to create flawless, logically sound challenges.

**Instructions:**
1.  **Create 3 Problems:**
    *   **Problem 1: Pattern Recognition:** Identify the next item in a sequence or the rule for a set.
    *   **Problem 2: Shortcut Calculation:** Solve using a mathematical formula or trick.
    *   **Problem 3: Mixed Reasoning:** A problem that requires both pattern-finding and calculation.

2.  **For each problem, you must follow this exact, multi-step process without deviation:**
    *   **Step A: Ideation & Solution.**
        1.  Create a clear, unambiguous \`problemStatement\` that has only one correct solution.
        2.  Solve the problem yourself. Write down the single correct value.
        3.  Write a clear, step-by-step \`solutionExplanation\` that logically proves the correct value.
        4.  Create three plausible but incorrect "distractor" choices based on common mistakes.

    *   **Step B: Assembly.**
        1.  Create a \`choices\` array containing the one "correct value" and the three "distractor" values.
        2.  Randomize the order of this \`choices\` array.
        3.  Determine the letter (A, B, C, or D) that corresponds to the correct value's position in the newly randomized \`choices\` array. This is your candidate \`answer\`.

    *   **Step C: MANDATORY CHAIN OF VERIFICATION.** This is the most important step.
        1.  Review the final \`problemStatement\`, the randomized \`choices\`, the candidate \`answer\` letter, and the \`solutionExplanation\`.
        2.  **Re-solve the problem from scratch** using only the generated \`problemStatement\`.
        3.  Does your new solution match the value at the candidate \`answer\` letter in the \`choices\` array?
        4.  Does the \`solutionExplanation\` correctly and logically describe how to arrive at that same answer?
        5.  **If there is any mismatch, discard the entire problem and start over from Step A.** Do not output a flawed problem.

3.  **Final Output Format:**
    *   The final output must be a valid JSON array of 3 *verified* challenge objects that have passed the entire process.

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

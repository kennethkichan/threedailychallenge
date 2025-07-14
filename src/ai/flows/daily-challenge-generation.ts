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

You are a master puzzle creator. Your task is to generate 3 unique and engaging logic problems for high school students.

**Instructions:**
1.  **Create 3 Problems:**
    *   **Pattern Recognition:** Identify the next item in a sequence or the rule for a set.
    *   **Shortcut Calculation:** Solve using a mathematical formula or trick (e.g., sum of series, divisibility rules).
    *   **Mixed Reasoning:** Combine pattern recognition with a shortcut.
2.  **For each problem, provide:**
    *   A clear \`problemStatement\`.
    *   Four distinct \`choices\` (A, B, C, D), with only one being correct.
    *   The correct \`answer\` (A, B, C, or D).
    *   A detailed \`solutionExplanation\`.
3.  **Quality Control (Very Important):**
    *   **Verify Correctness:** Before finalizing the output, you MUST double-check your work. Solve each problem yourself to ensure the selected \`answer\` is unambiguously correct and that the \`solutionExplanation\` is accurate and easy to follow.
    *   **Plausible Distractors:** The incorrect choices should be plausible but clearly wrong.
    *   **Ensure Correct Answer is in Choices:** After determining the single correct answer, you MUST ensure that this correct answer is one of the four options provided in the \`choices\` array. Do not provide a correct answer that isn't listed as an option.
    *   **Vary Topics:** Use a mix of algebra, geometry, number theory, etc.
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

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
  problemType: z.string().describe('The type of problem (Pattern Recognition, Shortcut Calculation, or Mixed Reasoning).'),
  problemStatement: z.string().describe('The problem statement.'),
  choices: z.array(z.string()).describe('An array of four randomized answer choices.'),
  correctValue: z.string().describe('The single correct answer value, which must be one of the items in the choices array.'),
  answer: z.string().describe("The letter corresponding to the correct choice ('A', 'B', 'C', or 'D')."),
  solutionExplanation: z.string().describe('A brief explanation of the solution and any shortcuts used.'),
});

// Define the input schema (currently empty, but can be extended later)
const DailyChallengeInputSchema = z.object({});
export type DailyChallengeInput = z.infer<typeof DailyChallengeInputSchema>;

// Define the output schema as an array of 3 challenges
const DailyChallengeOutputSchema = z.array(ChallengeSchema).length(3);
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

2.  **For each problem, provide the following:**
    *   \`problemType\`: The type of problem.
    *   \`problemStatement\`: A clear, unambiguous problem with a single correct solution.
    *   \`solutionExplanation\`: A clear, step-by-step explanation that proves the correct answer.
    *   \`correctValue\`: The single correct answer value.
    *   \`choices\`: An array of 4 strings. This array must contain the \`correctValue\` and three plausible but incorrect "distractor" choices. The order of choices should be randomized.
    *   \`answer\`: The letter ('A', 'B', 'C', or 'D') corresponding to the position of the \`correctValue\` in the randomized \`choices\` array.

3.  **Final Output Format:**
    *   The final output must be a valid JSON array of 3 challenge objects.

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
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const {output} = await dailyChallengePrompt(input);

      if (output && output.length === 3) {
        const choiceLabels = ['A', 'B', 'C', 'D'];
        const allValid = output.every(challenge => {
          if (challenge.choices.length !== 4) return false;
          const correctValueIndex = choiceLabels.indexOf(challenge.answer);
          if (correctValueIndex === -1) return false;
          // Check if the correctValue is present and matches the choice at the answer letter's index
          return (
            challenge.choices.includes(challenge.correctValue) &&
            challenge.choices[correctValueIndex] === challenge.correctValue
          );
        });

        if (allValid) {
          return output;
        }
      }
      console.log(`Attempt ${attempts}: Generated challenges failed validation. Retrying...`);
    }
    throw new Error(`Failed to generate valid daily challenges after ${maxAttempts} attempts.`);
  }
);

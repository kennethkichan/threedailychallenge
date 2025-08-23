'use server';

import {ai} from '@/ai/genkit';
import {
  DailyChallengeInput,
  DailyChallengeInputSchema,
  DailyChallengeOutput,
  DailyChallengeOutputSchema,
} from '@/ai/schemas';

// /**
//  * Generates a set of logic challenges for high school students using an AI model.
//  * This function is a Next.js Server Action and can be called directly from client components.
//  *
//  * @param input - An object conforming to `DailyChallengeInput`.
//  * @returns A promise that resolves to an array of `Challenge` objects.
//  * @throws An error if valid challenges cannot be generated after multiple attempts.
//  */
// Exported function to generate daily challenges
export async function generateDailyChallenges(input: DailyChallengeInput): Promise<DailyChallengeOutput> {
  return generateDailyChallengesFlow(input);
}

// Define the prompt
const dailyChallengePrompt = ai.definePrompt({
  name: 'dailyChallengePrompt',
  input: {schema: DailyChallengeInputSchema},
  output: {schema: DailyChallengeOutputSchema},
  prompt: `You are a meticulous and brilliant puzzle creator for a high school audience. Your primary goal is to create flawless, logically sound challenges. You must double-check your work to ensure all parts of the challenge are consistent and correct.

**Instructions:**
1.  **Create {{count}} Problems:** of the following types, trying to balance them:
    *   **Pattern Recognition:** Identify the next item in a sequence or the rule for a set.
    *   **Shortcut Calculation:** Solve using a mathematical formula or trick.
    *   **Mixed Reasoning:** A problem that requires both pattern-finding and calculation.

2.  **For each problem, provide the following:**
    *   \`problemType\`: The type of problem.
    *   \`problemStatement\`: A clear, unambiguous problem with a single correct solution.
    *   \`solutionExplanation\`: A clear, step-by-step explanation that proves the \`correctValue\`.
    *   \`correctValue\`: The single correct answer value, derived directly from the \`solutionExplanation\`.
    *   \`choices\`: An array of 4 strings. This array must contain the \`correctValue\` and three plausible but incorrect "distractor" choices. The order of choices should be randomized.
    *   \`answer\`: The letter ('A', 'B', 'C', or 'D') corresponding to the position of the \`correctValue\` in the randomized \`choices\` array.

3.  **CRITICAL: Quality Check before outputting:**
    *   **Verify Correctness:** Re-read the \`problemStatement\` and solve it again. Does your \`solutionExplanation\` lead to the exact \`correctValue\`?
    *   **Verify Consistency:** Is the \`correctValue\` present in the \`choices\` array? Does the \`answer\` letter correctly point to the \`correctValue\` in the \`choices\` array?
    *   **Plausible Distractors:** Are the incorrect choices reasonable mistakes someone might make?

4.  **Final Output Format:**
    *   The final output must be a valid JSON array of {{count}} challenge objects that has passed your quality check.

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

      if (output && output.length === (input.count ?? 3)) {
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

        if (allValid) { // If all challenges are valid, return them
          return output;
        }
      }
      console.log(`Attempt ${attempts}: Generated challenges failed validation. Retrying...`);
    }
    throw new Error(`Failed to generate valid daily challenges after ${maxAttempts} attempts.`);
  }
);

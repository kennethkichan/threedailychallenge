'use server';

import {ai} from '@/ai/genkit';
import {
  ChallengeSchema,
  DailyChallengeInput,
  DailyChallengeInputSchema,
  DailyChallengeOutput,
  DailyChallengeOutputSchema,
  ChallengeValidation,
  ChallengeValidationSchema,
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

// New prompt for the AI Judge
const challengeValidatorPrompt = ai.definePrompt({
  name: 'challengeValidatorPrompt',
  input: { schema: ChallengeSchema },
  output: { schema: ChallengeValidationSchema },
  prompt: `You are a meticulous logic and math expert. Your task is to validate a given puzzle.
Carefully analyze the provided problem statement, the proposed solution explanation, and the correct value.

**Instructions:**
1.  **Solve the Problem:** Independently solve the \`problemStatement\`.
2.  **Verify the Explanation:** Does the \`solutionExplanation\` provide a correct, step-by-step derivation for the answer?
3.  **Check for Consistency:** Does the result from your independent solving and the explanation's result match the provided \`correctValue\` exactly?

**Input Challenge:**
- Problem Statement: {{problemStatement}}
- Solution Explanation: {{solutionExplanation}}
- Proposed Correct Value: {{correctValue}}

**Output:**
Based on your analysis, determine if the challenge is valid.
- If it is flawless, set \`isValid\` to true.
- If there are any logical errors, mathematical mistakes, or inconsistencies, set \`isValid\` to false and provide a concise \`reason\`.
`,
});

// New flow for validating a single challenge
const validateChallengeFlow = ai.defineFlow(
  {
    name: 'validateChallengeFlow',
    inputSchema: ChallengeSchema,
    outputSchema: ChallengeValidationSchema,
  },
  async (challenge): Promise<ChallengeValidation> => {
    const { output } = await challengeValidatorPrompt(challenge);
    if (!output) {
      // Handle cases where the validator prompt fails
      return { isValid: false, reason: 'Validator AI failed to respond.' };
    }
    return output;
  }
);

// Define the flow
const generateDailyChallengesFlow = ai.defineFlow(
  {
    name: 'generateDailyChallengesFlow',
    inputSchema: DailyChallengeInputSchema,
    outputSchema: DailyChallengeOutputSchema,
  },
  async input => {
    const desiredCount = input.count ?? 3;
    const maxAttempts = 5; // Increased attempts for generation + validation
    let attempts = 0;
    const validChallenges: DailyChallengeOutput = [];

    while (validChallenges.length < desiredCount && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}: Generating and validating challenges...`);

      // Generate a batch of challenges, asking for more than needed to account for validation failures.
      const generationCount = Math.ceil((desiredCount - validChallenges.length) * 1.5);
      const { output: generatedChallenges } = await dailyChallengePrompt({ count: generationCount });

      if (!generatedChallenges || generatedChallenges.length === 0) {
        console.log(`Attempt ${attempts}: AI failed to generate any challenges. Retrying...`);
        continue;
      }

      // Validate each generated challenge
      for (const challenge of generatedChallenges) {
        // First, perform the basic structural validation
        const choiceLabels = ['A', 'B', 'C', 'D'];
        const correctValueIndex = choiceLabels.indexOf(challenge.answer);
        const isStructurallyValid =
          challenge.choices.length === 4 &&
          correctValueIndex !== -1 &&
          challenge.choices.includes(challenge.correctValue) &&
          challenge.choices[correctValueIndex] === challenge.correctValue;

        if (!isStructurallyValid) {
          console.log('Challenge failed structural validation:', challenge.problemStatement);
          continue;
        }

        // Now, use the AI judge for logical validation
        const validationResult = await validateChallengeFlow(challenge);
        if (validationResult.isValid) {
          validChallenges.push(challenge);
          console.log(`✅ Challenge validated: "${challenge.problemStatement}"`);
          if (validChallenges.length === desiredCount) break; // Stop if we have enough
        } else {
          console.log(`❌ Challenge failed AI validation: "${challenge.problemStatement}". Reason: ${validationResult.reason}`);
        }
      }
    }

    if (validChallenges.length >= desiredCount) {
      return validChallenges.slice(0, desiredCount);
    }

    throw new Error(`Failed to generate ${desiredCount} valid daily challenges after ${maxAttempts} attempts.`);
  }
);

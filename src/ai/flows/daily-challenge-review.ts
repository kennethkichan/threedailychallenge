import { generate } from '@genkit-ai/ai';
import { defineFlow } from '@genkit-ai/flow';
import { geminiPro, googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
// Import the single source of truth for the Problem schema.
import { ProblemSchema, Problem } from '../../../scripts/db';

// Define the output for our review flow
export const ReviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'correct', 'reject']),
  reasoning: z.string(),
  correctedProblem: ProblemSchema.partial().optional(),
});

export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;

const verifierPrompt = `
You are a ruthless, machine-like logic and math verifier. Your only goal is to find errors.

Analyze the provided JSON puzzle.
1.  **INDEPENDENT SOLUTION**: Solve the problem from scratch.
2.  **VERDICT**: Compare your answer to the problem's provided 'answer'. The problem is INACCURATE if your answer does not match, the explanation is illogical, or it's not solvable with text alone.

Return ONLY a single, valid JSON object with your analysis:
{
  "is_accurate": boolean,
  "verification_notes": "A one-sentence explanation for your verdict."
}

PROBLEM TO VERIFY:
`;

const correctorPrompt = `
You are an expert problem editor. The following JSON problem was found to be inaccurate for the reason provided.

Your task is to fix the problem and output a complete, corrected, and valid JSON object. Do not change the core concept of the problem, only fix the errors.

The corrected problem MUST be solvable using only text.

Return ONLY the single, corrected, valid JSON object for the problem.

INACCURATE PROBLEM:
`;

export const reviewProblem = defineFlow(
  {
    name: 'reviewProblem',
    inputSchema: z.object({ problem: ProblemSchema }),
    outputSchema: ReviewDecisionSchema,
  },
  async ({ problem }) => {
    // Step 1: Verify the problem's accuracy
    const verificationResponse = await generate({
      model: geminiPro,
      prompt: `${verifierPrompt}${JSON.stringify(problem, null, 2)}`,
      config: { temperature: 0.1 },
      output: { format: 'json' },
    });

    const verification = verificationResponse.output() as {
      is_accurate: boolean;
      verification_notes: string;
    };

    if (verification.is_accurate) {
      return {
        decision: 'approve',
        reasoning: verification.verification_notes,
      };
    }

    // Step 2: If inaccurate, attempt to correct it
    const correctionResponse = await generate({
      model: geminiPro,
      prompt: `${correctorPrompt}${JSON.stringify(problem, null, 2)}\n\nREASON FOR INACCURACY:\n${verification.verification_notes}`,
      config: { temperature: 0.4 },
      output: { format: 'json' },
    });

    const correctedData = correctionResponse.output();

    if (correctedData) {
      return {
        decision: 'correct',
        reasoning: `Auto-corrected based on verification: ${verification.verification_notes}`,
        correctedProblem: correctedData as any,
      };
    }

    // Step 3: If correction fails, reject it
    return {
      decision: 'reject',
      reasoning: `Correction failed. Original issue: ${verification.verification_notes}`,
    };
  }
);
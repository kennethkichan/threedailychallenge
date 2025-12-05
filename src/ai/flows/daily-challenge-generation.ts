'use server';

import { generate } from '@genkit-ai/ai';
import { defineFlow } from '@genkit-ai/flow';
import { geminiPro } from '@genkit-ai/googleai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// Define a schema that matches the structure in `scripts/db.ts` but without review fields.
const GeneratedProblemSchema = z.object({
  age_group: z.string(),
  problem_type: z.string(),
  difficulty: z.number(),
  question: z.string(),
  data: z.object({
    options: z.array(z.string()),
  }),
  answer: z.string(),
  solution_explanation: z.string(),
});

// This is the new, categorized generation flow.
export const generateCategorizedChallenge = defineFlow(
  {
    name: 'generateCategorizedChallenge',
    inputSchema: z.object({ age_group: z.string(), problem_type: z.string() }),
    outputSchema: GeneratedProblemSchema,
  },
  async ({ age_group, problem_type }) => {
    // Load the powerful prompt template you already have.
    const promptTemplate = await fs.readFile(
      path.join(process.cwd(), 'scripts', 'problems_prompt_template.txt'),
      'utf-8'
    );

    const prompt = promptTemplate
      .replace('[Age Group]', age_group)
      .replace('[Problem Type]', problem_type);

    const llmResponse = await generate({
      model: geminiPro,
      prompt: prompt,
      output: { schema: GeneratedProblemSchema, format: 'json' },
      config: { temperature: 0.8 }, // Increase temperature for more variation
    });

    return llmResponse.output()!;
  }
);

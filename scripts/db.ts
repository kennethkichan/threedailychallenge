import * as fs from 'fs/promises';
import * as path from 'path';
import * as z from 'zod';

export const ProblemSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  age_group: z.string(),
  problem_type: z.string(),
  difficulty: z.number(),
  data: z.object({
    options: z.array(z.string()),
  }),
  answer: z.string(),
  solution_explanation: z.string(),
  review_status: z.string(),
  reviewed: z.number(),
  reviewed_on: z.string().nullable(),
  verification_notes: z.string().optional().nullable(),
  disputed_on: z.string().optional().nullable(),
});

export type Problem = z.infer<typeof ProblemSchema>;

export const DB_PATH = path.join(
  process.cwd(),
  'public',
  'problems_database.json'
);

export interface Database {
  problems: Problem[];
  maxId: number;
}

export async function readDatabase(): Promise<Database> {
  try {
    const fileContent = await fs.readFile(DB_PATH, 'utf-8');
    const problems: Problem[] = JSON.parse(fileContent);

    if (Array.isArray(problems)) {
      const maxId = problems.reduce(
        (max, p) => Math.max(max, parseInt(p.id, 10) || 0),
        0
      );
      return { problems, maxId };
    }

    throw new Error('Invalid database format: expected a JSON array of problems.');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Database file not found. A new one will be created.');
      // If the file doesn't exist, there are no problems and the maxId is 0.
      return { problems: [], maxId: 0 };
    }
    console.error('Error reading or parsing database file:', error);
    throw new Error('Could not read or validate the database.');
  }
}

export async function writeDatabase(db: Database): Promise<void> {
  // Only write the problems array to the file, not the maxId.
  const dataToWrite = JSON.stringify(db.problems, null, 2);
  await fs.writeFile(DB_PATH, dataToWrite);
}
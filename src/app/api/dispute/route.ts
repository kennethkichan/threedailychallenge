'use server'

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { Problem, ProblemSchema } from '@/ai/schemas';

const ProblemsFileSchema = z.array(ProblemSchema);
const DISPUTE_REQUEST_SCHEMA = z.object({
  problemId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedRequest = DISPUTE_REQUEST_SCHEMA.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { problemId } = parsedRequest.data;
    const filePath = path.join(process.cwd(), 'public', 'problems_database.json');
    
    const fileContents = await fs.readFile(filePath, 'utf-8');
    const problems = ProblemsFileSchema.parse(JSON.parse(fileContents));

    const problemIndex = problems.findIndex(p => p.id === problemId);

    if (problemIndex === -1) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    problems[problemIndex].review_status = 'disputed';
    problems[problemIndex].disputed_on = new Date().toISOString();

    await fs.writeFile(filePath, JSON.stringify(problems, null, 4));

    return NextResponse.json({ message: 'Problem disputed successfully' });
  } catch (error) {
    console.error('Error disputing problem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

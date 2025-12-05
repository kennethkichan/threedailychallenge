import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const newChallenge = await req.json();

    const dbPath = path.join(process.cwd(), 'public', 'problems_database.json');
    
    let problems = [];
    try {
        const fileContent = await fs.readFile(dbPath, 'utf-8');
        problems = JSON.parse(fileContent);
    } catch (error) {
        console.log('Could not read db, creating a new one');
    }
    
    const newId = problems.length > 0 ? Math.max(...problems.map((p: any) => parseInt(p.id, 10))) + 1 : 1;
    newChallenge.id = newId.toString();

    problems.push(newChallenge);

    await fs.writeFile(dbPath, JSON.stringify(problems, null, 2));

    return NextResponse.json({ message: 'Challenge added successfully' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Failed to add challenge' }, { status: 500 });
  }
}

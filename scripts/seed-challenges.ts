import 'dotenv/config';
import { generateDailyChallenges } from '../src/ai/flows/daily-challenge-generation';
import * as fs from 'fs/promises';
import * as path from 'path';

const CHALLENGE_COUNT = 10;
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'challenges.json');

async function seed() {
  console.log(`🌱 Generating ${CHALLENGE_COUNT} challenges...`);

  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.error(
      '❌ Error: Please provide a GOOGLE_API_KEY in your .env file.'
    );
    console.error('Create a file named .env in the root of your project and add your key, e.g.:');
    console.error('GOOGLE_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  try {
    const challenges = await generateDailyChallenges({ count: CHALLENGE_COUNT });

    // Ensure the public directory exists
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(challenges, null, 2));
    console.log(`✅ Successfully wrote ${challenges.length} challenges to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Failed to generate challenges:', error);
    process.exit(1);
  }
}

seed();
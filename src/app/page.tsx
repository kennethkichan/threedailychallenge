import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { Challenge, ChallengeSchema } from '@/ai/schemas';
import { ChallengeCard } from '@/components/challenge-card';

// Define the schema for the array of challenges from the JSON file
const ChallengesFileSchema = z.array(ChallengeSchema);

/**
 * Reads and validates challenges from the public JSON file.
 * This function runs on the server.
 */
async function getChallenges(): Promise<Challenge[]> {
  const filePath = path.join(process.cwd(), 'public', 'challenges.json');
  try {
    const fileContents = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContents);
    // Validate the data against our schema to ensure it's in the expected format
    return ChallengesFileSchema.parse(data);
  } catch (error) {
    console.error("Failed to read or parse 'public/challenges.json':", error);
    return [];
  }
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 * @returns A new array with the elements shuffled.
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default async function HomePage() {
  const allChallenges = await getChallenges();
  const selectedChallenges = shuffleArray(allChallenges).slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-gray-50 dark:bg-gray-900">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold text-center lg:text-left w-full">
          Today's 3 Daily Challenges
        </h1>
      </div>

      {selectedChallenges.length > 0 ? (
        <div className="w-full max-w-2xl space-y-6">
          {selectedChallenges.map((challenge, index) => (
            <ChallengeCard key={index} challenge={challenge} />
          ))}
        </div>
      ) : (
        <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">No Challenges Available</h2>
          <p className="text-gray-600 dark:text-gray-300">
            We couldn't load the challenges. Please try running the seed script or check the server logs.
          </p>
        </div>
      )}
    </main>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Problem } from '@/ai/schemas';
import { ChallengeCard } from '@/components/challenge-card';
import { Button } from '@/components/ui/button';

// Shuffle function remains the same
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function HomePage() {
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [difficulties, setDifficulties] = useState<number[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProblems() {
      try {
        const response = await fetch('/problems_database.json');
        const data = await response.json();
        setAllProblems(data);
        const uniqueDifficulties = [...new Set(data.map((p: Problem) => p.difficulty))].sort((a,b) => a-b);
        setDifficulties(uniqueDifficulties);
      } catch (error) {
        console.error("Failed to fetch 'problems_database.json':", error);
      }
    }
    fetchProblems();
  }, []);

  useEffect(() => {
    if (selectedDifficulty !== null) {
      const problems = allProblems.filter(p => p.difficulty === selectedDifficulty);
      setFilteredProblems(shuffleArray(problems).slice(0, 3));
    } else if (allProblems.length > 0) {
        setFilteredProblems(shuffleArray(allProblems).slice(0, 3));
    }
  }, [selectedDifficulty, allProblems]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-gray-50 dark:bg-gray-900">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold text-center lg:text-left w-full">
          Today's Daily Challenges
        </h1>
      </div>

      <div className="w-full max-w-2xl mb-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant={selectedDifficulty === null ? 'default' : 'outline'}
            onClick={() => setSelectedDifficulty(null)}
          >
            All
          </Button>
          {difficulties.map(difficulty => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              Difficulty {difficulty}
            </Button>
          ))}
        </div>
      </div>

      {filteredProblems.length > 0 ? (
        <div className="w-full max-w-2xl space-y-6">
          {filteredProblems.map((problem) => (
            <ChallengeCard key={problem.id} challenge={problem} />
          ))}
        </div>
      ) : (
        <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">No Challenges Available</h2>
          <p className="text-gray-600 dark:text-gray-300">
            We couldn't load the challenges for the selected difficulty. Please try another one.
          </p>
        </div>
      )}
    </main>
  );
}

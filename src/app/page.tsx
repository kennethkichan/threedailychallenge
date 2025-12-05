'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Problem } from '@/ai/schemas';
import { ChallengeCard } from '@/components/challenge-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { auth } from '@/firebase';

// Shuffle function remains the same
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const ageGroupDisplay: Record<string, { label: string; order: number }> = {
    'Toddler': { label: 'Toddler (1-3)', order: 1 },
    'Child': { label: 'Child (4-8)', order: 2 },
    'Pre-teen': { label: 'Pre-teen (9-12)', order: 3 },
    'High School': { label: 'High School (14-18)', order: 4 },
    'Adult': { label: 'Adult (18+)', order: 5 }
  };

  function LoggedInView() {
    const [allProblems, setAllProblems] = useState<Problem[]>([]);
    const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
    const [ageGroups, setAgeGroups] = useState<string[]>([]);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  
    const fetchProblems = useCallback(async () => {
      try {
        const response = await fetch('/problems_database.json');
        const data = await response.json();
        const nonDisputed = data.filter((p: Problem) => p.review_status !== 'disputed');
        setAllProblems(nonDisputed);
        const uniqueAgeGroups = [...new Set(nonDisputed.map((p: Problem) => p.age_group).filter(Boolean))] as string[];
        uniqueAgeGroups.sort((a, b) => (ageGroupDisplay[a]?.order || 99) - (ageGroupDisplay[b]?.order || 99));
        setAgeGroups(uniqueAgeGroups);
      } catch (error) {
        console.error("Failed to fetch 'problems_database.json':", error);
      }
    }, []);
  
    useEffect(() => {
      fetchProblems();
    }, [fetchProblems]);
  
    useEffect(() => {
      let problemsToFilter = allProblems;
      if (selectedAgeGroup !== null) {
        problemsToFilter = allProblems.filter(p => p.age_group === selectedAgeGroup);
      }
      setFilteredProblems(shuffleArray(problemsToFilter).slice(0, 3));
    }, [selectedAgeGroup, allProblems]);
  
    const handleDispute = (problemId: string) => {
      setAllProblems(prevProblems => prevProblems.filter(p => p.id !== problemId));
    };
  
    return (
        <>
            <div className="w-full flex flex-col items-center">
                <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
                    <h1 className="text-4xl font-bold text-center lg:text-left w-full">
                    Today's Daily Challenges
                    </h1>
                </div>

                <div className="w-full max-w-2xl mb-8">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                        variant={selectedAgeGroup === null ? 'default' : 'outline'}
                        onClick={() => setSelectedAgeGroup(null)}
                    >
                        All
                    </Button>
                    {ageGroups.map(ageGroup => (
                        <Button
                        key={ageGroup}
                        variant={selectedAgeGroup === ageGroup ? 'default' : 'outline'}
                        onClick={() => setSelectedAgeGroup(ageGroup)}
                        >
                        {ageGroupDisplay[ageGroup]?.label || ageGroup}
                        </Button>
                    ))}
                    </div>
                </div>

                {filteredProblems.length > 0 ? (
                    <div className="w-full max-w-2xl space-y-6">
                    {filteredProblems.map((problem) => (
                        <ChallengeCard key={problem.id} challenge={problem} onDispute={handleDispute} />
                    ))}
                    </div>
                ) : (
                    <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">No Challenges Available</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We couldn't load the challenges for the selected age group. Please try another one.
                    </p>
                    </div>
                )}
            </div>
            <div className="mt-8 pb-4">
                <Button onClick={() => auth.signOut()} variant="outline">Sign Out</Button>
            </div>
        </>
    );
  }
  
  function LoggedOutView() {
      return (
          <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to Daily Challenges!</h1>
              <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Sign in to track your progress and compete with others.
              </p>
              <Link href="/login">
                <Button size="lg">Sign In</Button>
              </Link>
          </div>
      );
  }

export default function HomePage() {
    const { user, loading } = useAuth();
  
    return (
        <main className={`flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-gray-50 dark:bg-gray-900 ${user ? 'justify-between' : 'justify-center'}`}>
            {loading ? (
            <p>Loading...</p> 
            ) : user ? (
            <LoggedInView />
            ) : (
            <LoggedOutView />
            )}
        </main>
    );
}

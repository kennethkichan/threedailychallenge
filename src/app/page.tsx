'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Problem } from '@/ai/schemas';
import { ChallengeCard } from '@/components/challenge-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { auth } from '@/firebase';
import { getUserProgress, updateUserStreak, logAnsweredQuestion, getAnsweredQuestions, AnsweredQuestion } from '@/lib/streak-service';
import { differenceInCalendarDays } from 'date-fns';

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
    const { user } = useAuth();
    const [allProblems, setAllProblems] = useState<Problem[]>([]);
    const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
    const [ageGroups, setAgeGroups] = useState<string[]>([]);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
    const [userStreak, setUserStreak] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    const fetchProblems = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
      try {
        const [problemsResponse, userProgress, answeredQuestionsData] = await Promise.all([
            fetch('/problems_database.json'),
            getUserProgress(user.uid),
            getAnsweredQuestions(user.uid),
        ]);

        const data = await problemsResponse.json();
        const nonDisputed = data.filter((p: Problem) => p.review_status !== 'disputed');
        setAllProblems(nonDisputed);

        const uniqueAgeGroups = [...new Set(nonDisputed.map((p: Problem) => p.age_group).filter(Boolean))] as string[];
        uniqueAgeGroups.sort((a, b) => (ageGroupDisplay[a]?.order || 99) - (ageGroupDisplay[b]?.order || 99));
        setAgeGroups(uniqueAgeGroups);

        if (userProgress) {
            const today = new Date();
            const lastDate = userProgress.lastChallengeDate?.toDate();
            if (lastDate && differenceInCalendarDays(today, lastDate) > 1) {
              setUserStreak(0); // Reset streak if more than a day has passed
            } else {
              setUserStreak(userProgress.streak);
            }
        }

        setAnsweredQuestions(answeredQuestionsData);

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoading(false);
      }
    }, [user]);

    useEffect(() => {
      fetchProblems();
    }, [fetchProblems]);

    useEffect(() => {
        if (isLoading) return;
        
        setMessage(null);
    
        let problemsToFilter = allProblems;
        if (selectedAgeGroup) {
          problemsToFilter = allProblems.filter(p => p.age_group === selectedAgeGroup);
        }
    
        if (problemsToFilter.length === 0 && selectedAgeGroup) {
          setMessage(`There are no challenges available for the ${selectedAgeGroup} category right now. Please check back later or select another category.`);
          setFilteredProblems([]);
          return;
        }

        const masteredIds = answeredQuestions
            .filter(q => q.count >= 3)
            .map(q => q.questionId);
    
        const freshProblems = problemsToFilter.filter(p => !masteredIds.includes(p.id));
    
        let problemsToShow: Problem[];
    
        if (freshProblems.length >= 3) {
          problemsToShow = shuffleArray(freshProblems).slice(0, 3);
        } else {
          const oldProblems = problemsToFilter.filter(p => masteredIds.includes(p.id));
          
          const answeredCounts = answeredQuestions.reduce((acc, q) => {
            acc[q.questionId] = q.count;
            return acc;
          }, {} as Record<string, number>);
          
          oldProblems.sort((a, b) => (answeredCounts[a.id] || 0) - (answeredCounts[b.id] || 0));
    
          const combined = [...freshProblems, ...oldProblems];
          problemsToShow = combined.slice(0, 3);
        }
    
        if (problemsToShow.length === 0 && allProblems.length > 0) {
            if (selectedAgeGroup) {
                setMessage(`Congratulations! You've completed all the challenges for the ${selectedAgeGroup} category. Please check back later for more!`);
            } else {
                setMessage("You've completed all available challenges! Please check back later for more.");
            }
        }
        
        setFilteredProblems(problemsToShow);
    
      }, [selectedAgeGroup, allProblems, answeredQuestions, isLoading]);

    const handleDispute = (problemId: string) => {
        setAllProblems(prevProblems => prevProblems.filter(p => p.id !== problemId));
    };

    const handleAnswerSelected = (problemId: string, selectedAnswer: string) => {
        setSelectedAnswers(prev => ({ ...prev, [problemId]: selectedAnswer }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitted(true);

        const allCorrect = filteredProblems.every(p => selectedAnswers[p.id] === p.answer);

        if (allCorrect) {
          const newStreak = userStreak + 1;
          setUserStreak(newStreak);
          await updateUserStreak(user.uid, newStreak);
        } else {
          setUserStreak(0);
          await updateUserStreak(user.uid, 0);
        }

        for (const problem of filteredProblems) {
          await logAnsweredQuestion(user.uid, problem.id);
        }
    };

    return (
        <>
        <div className="w-full flex flex-col items-center">
                <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8 text-center">
                    <h1 className="text-4xl font-bold w-full">
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

                <div className="w-full max-w-2xl mb-8 flex justify-center items-center">
                    <p className="text-lg font-semibold">
                        Your current streak: {userStreak}
                    </p>
                </div>

                {isLoading ? (
                    <p>Loading challenges...</p>
                ) : filteredProblems.length > 0 ? (
                    <div className="w-full max-w-2xl space-y-6">
                    {filteredProblems.map((problem) => (
                        <ChallengeCard 
                            key={problem.id} 
                            challenge={problem} 
                            onDispute={handleDispute} 
                            onAnswerSelected={handleAnswerSelected}
                            isSubmitted={isSubmitted}
                            selectedValue={selectedAnswers[problem.id] || null}
                        />
                    ))}
                     <Button onClick={handleSubmit} className="w-full mt-6" disabled={isSubmitted || Object.keys(selectedAnswers).length < filteredProblems.length}>
                        Submit Answers
                    </Button>
                    </div>
                ) : message ? (
                    <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">All Done for Now!</h2>
                        <p className="text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">No Challenges Available</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            We couldn't find any challenges for this category. Please select another one or check back later!
                        </p>
                    </div>
                )}
            </div>
            <div className="mt-8 pb-4 flex space-x-4">
                <Link href="/add-challenge">
                    <Button variant="outline">Add Challenge</Button>
                </Link>
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
        <main className={`flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-gray-50 dark:bg-gray-900 ${user ? 'justify-start' : 'justify-center'}`}>
            {loading || !user ? (
            <p>Loading...</p> 
            ) : (
            <LoggedInView />
            )}
        </main>
    );
}

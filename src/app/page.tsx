"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { StreakCounter } from "@/components/StreakCounter";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Trophy, RefreshCw } from "lucide-react";
import { Confetti } from "@/components/Confetti";
import { generateDailyChallenges } from "@/ai/flows/daily-challenge-generation";
import { challengeStore, type AnswerState } from "@/lib/challenge-store";
import type { Challenge } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STREAK_KEY = "formulaic_streak";

interface StreakData {
  count: number;
  lastCompleted: string;
}

/**
 * Shuffles an array in-place and returns it.
 * (Fisher-Yates shuffle)
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answersState, setAnswersState] = useState<AnswerState>({});
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const fetchChallenges = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    if (forceRefresh) {
      challengeStore.clearToday();
      setAnswersState({});
    }

    try {
      // 1. Check for today's challenges
      let dailyChallenges = challengeStore.getChallenges();

      if (dailyChallenges && !forceRefresh) {
        setChallenges(dailyChallenges);
      } else {
        // 2. If no daily challenges, get the pool from localStorage
        let challengePool = challengeStore.getChallengePool();

        // 3. If no pool in localStorage, fetch from the public file
        if (!challengePool) {
          const response = await fetch('/challenges.json');
          if (!response.ok) {
            throw new Error('Could not load challenge pool. Please run `npm run seed:challenges` first.');
          }
          challengePool = (await response.json()) as Challenge[];
          challengeStore.storeChallengePool(challengePool);
        }

        // 4. Select 3 random challenges from the pool and store for the day
        const selectedChallenges = shuffle([...challengePool]).slice(0, 3);
        challengeStore.storeChallenges(selectedChallenges);
        setChallenges(selectedChallenges);
      }
      setAnswersState(challengeStore.getAnswers());
    } catch (err: any) {
      console.error(err);
      setError(`Failed to load challenges: ${err.message}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    const initialize = async () => {
      try {
        const storedStreak = localStorage.getItem(STREAK_KEY);
        if (storedStreak) {
          const data: StreakData = JSON.parse(storedStreak);
          const lastDate = new Date(data.lastCompleted);
          const today = new Date(todayStr);
          const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          setStreak(diffDays > 1 ? 0 : data.count);
        }
      } catch (e) { console.error("Failed to parse streak", e); setStreak(0); }
      
      fetchChallenges();
    };
    initialize();
  }, [todayStr, fetchChallenges]);
  
  const handleAnswerSelect = useCallback((challengeIndex: number, answer: string) => {
    setAnswersState(prev => ({
      ...prev,
      [challengeIndex]: { ...prev[challengeIndex], selected: answer },
    }));
  }, []);

  const handleSubmitAnswer = useCallback((challengeIndex: number) => {
    const newState = {
      ...answersState,
      [challengeIndex]: { ...(answersState[challengeIndex] || { selected: null }), submitted: true },
    };
    setAnswersState(newState);
    challengeStore.storeAnswers(newState);

    const allSubmitted = challenges.length > 0 && Object.values(newState).length === challenges.length && Object.values(newState).every(a => a.submitted);

    if (allSubmitted) {
      const allCorrect = Object.values(newState).every((ans, i) => ans.selected === challenges[i].correctValue);
      const storedStreak = localStorage.getItem(STREAK_KEY);
      const lastCompleted = storedStreak ? JSON.parse(storedStreak).lastCompleted : null;

      if (lastCompleted !== todayStr) {
        let newStreak = streak;
        if (allCorrect) {
          newStreak += 1;
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        } else {
          newStreak = 0;
        }
        setStreak(newStreak);
        localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newStreak, lastCompleted: todayStr }));
      }
    }
  }, [answersState, challenges, streak, todayStr]);

  const gameFinished = challenges.length > 0 && Object.values(answersState).length === challenges.length && Object.values(answersState).every(a => a.submitted);
  const correctAnswersCount = Object.values(answersState).filter((ans, i) => ans.submitted && ans.selected === challenges[i]?.correctValue).length;

  const handleRefresh = () => {
    fetchChallenges(true);
  }

  const LoadingSkeleton = () => (
    <div className="space-y-8 w-full max-w-2xl">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="w-full">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-7 w-full mt-4" />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-foreground p-4 sm:p-8 md:p-12">
      {showConfetti && <Confetti />}
      <header className="w-full max-w-2xl mb-8 text-center space-y-4">
        <h1 className="text-5xl font-bold font-headline text-primary">3 Daily Challenges</h1>
        <p className="text-xl text-muted-foreground">Your daily set of logic puzzles.</p>
        <div className="flex items-center justify-center gap-4">
          <StreakCounter streak={streak} />
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh Challenges</span>
          </Button>
        </div>
      </header>

      {loading && <LoadingSkeleton />}
      
      {error && (
        <Alert variant="destructive" className="max-w-2xl">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <div className="w-full flex flex-col items-center space-y-8">
          {gameFinished && (
            <Card className="w-full max-w-2xl bg-card-foreground/5 animate-in fade-in-50 duration-500">
              <CardHeader className="items-center text-center">
                <Trophy className="w-16 h-16 text-accent mb-4" />
                <CardTitle className="text-3xl">Challenge Complete!</CardTitle>
                <CardDescription className="text-lg">
                  You scored {correctAnswersCount} out of {challenges.length}.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p>Come back tomorrow for a new set of challenges!</p>
              </CardContent>
            </Card>
          )}

          {challenges.map((challenge, index) => (
            <ChallengeCard
              key={index}
              challenge={challenge}
              challengeIndex={index}
              onAnswerSelect={handleAnswerSelect}
              onSubmitAnswer={handleSubmitAnswer}
              answerState={answersState[index] || { selected: null, submitted: false }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

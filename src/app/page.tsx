"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { generateDailyChallenges } from "@/ai/flows/daily-challenge-generation";
import { ChallengeCard } from "@/components/ChallengeCard";
import { StreakCounter } from "@/components/StreakCounter";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Trophy, RefreshCw } from "lucide-react";
import { Confetti } from "@/components/Confetti";
import type { Challenge } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STREAK_KEY = "formulaic_streak";

interface StreakData {
  count: number;
  lastCompleted: string;
}

type AnswerState = Record<number, { selected: string | null; submitted: boolean }>;

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answersState, setAnswersState] = useState<AnswerState>({});
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const challengesKey = `challenges_${todayStr}`;
  const answersKey = `answers_${todayStr}`;

  const fetchChallenges = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    if(forceRefresh) {
        setAnswersState({});
    }

    try {
      const storedChallenges = localStorage.getItem(challengesKey);
      const storedAnswers = localStorage.getItem(answersKey);

      if (storedChallenges && !forceRefresh) {
        setChallenges(JSON.parse(storedChallenges));
        if (storedAnswers) {
          setAnswersState(JSON.parse(storedAnswers));
        }
      } else {
        if (forceRefresh) {
            localStorage.removeItem(challengesKey);
            localStorage.removeItem(answersKey);
        }
        const newChallenges = await generateDailyChallenges({});
        if (newChallenges && newChallenges.length > 0) {
          setChallenges(newChallenges);
          localStorage.setItem(challengesKey, JSON.stringify(newChallenges));
          // Clean up old challenges
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('challenges_') && key !== challengesKey) {
              localStorage.removeItem(key);
              localStorage.removeItem(key.replace('challenges_', 'answers_'));
            }
          });
        } else {
          throw new Error("AI did not return any challenges.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(`Failed to load challenges: ${err.message}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, [challengesKey, answersKey]);


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
    localStorage.setItem(answersKey, JSON.stringify(newState));

    const allSubmitted = challenges.length > 0 && Object.values(newState).length === challenges.length && Object.values(newState).every(a => a.submitted);

    if (allSubmitted) {
      const allCorrect = Object.values(newState).every((ans, i) => ans.selected === challenges[i].answer);
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
  }, [answersState, challenges, streak, todayStr, answersKey]);

  const gameFinished = challenges.length > 0 && Object.values(answersState).length === challenges.length && Object.values(answersState).every(a => a.submitted);
  const correctAnswersCount = Object.values(answersState).filter((ans, i) => ans.submitted && ans.selected === challenges[i]?.answer).length;

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
        <h1 className="text-5xl font-bold font-headline text-primary">Formulaic</h1>
        <p className="text-xl text-muted-foreground">Your daily dose of logic puzzles.</p>
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

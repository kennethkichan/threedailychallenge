import type { Challenge } from './types';

/**
 * A type representing the state of the user's answers for the daily challenges.
 * The key is the challenge index (0, 1, or 2).
 */
export type AnswerState = Record<
  number,
  { selected: string | null; submitted: boolean }
>;

const getTodayKey = (prefix: string): string => {
  const todayStr = new Date().toISOString().split('T')[0];
  return `${prefix}_${todayStr}`;
};

/**
 * A dedicated module for interacting with localStorage for challenges and answers.
 */
export const challengeStore = {
  getChallenges: (): Challenge[] | null => {
    if (typeof window === 'undefined') return null;
    const key = getTodayKey('challenges');
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as Challenge[]) : null;
  },

  storeChallenges: (challenges: Challenge[]): void => {
    if (typeof window === 'undefined') return;
    const key = getTodayKey('challenges');
    localStorage.setItem(key, JSON.stringify(challenges));
  },

  getAnswers: (): AnswerState => {
    if (typeof window === 'undefined') return {};
    const key = getTodayKey('answers');
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as AnswerState) : {};
  },

  storeAnswers: (answers: AnswerState): void => {
    if (typeof window === 'undefined') return;
    const key = getTodayKey('answers');
    localStorage.setItem(key, JSON.stringify(answers));
  },

  clearToday: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getTodayKey('challenges'));
    localStorage.removeItem(getTodayKey('answers'));
  },
};
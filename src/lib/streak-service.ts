
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { User } from 'firebase/auth';

export interface UserProgress {
  streak: number;
  lastChallengeDate: Timestamp | null;
}

export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  const userRef = doc(db, `users/${userId}`);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      streak: data.streak || 0,
      lastChallengeDate: data.lastChallengeDate || null,
    };
  }
  return null;
};

export const updateUserStreak = async (userId: string, newStreak: number) => {
  const userRef = doc(db, `users/${userId}`);
  await updateDoc(userRef, {
    streak: newStreak,
    lastChallengeDate: serverTimestamp(),
  });
};

export interface AnsweredQuestion {
  questionId: string;
  count: number;
  lastAnswered: Timestamp;
}

export const logAnsweredQuestion = async (userId: string, questionId: string) => {
  const answeredQuestionRef = doc(db, `users/${userId}/answeredQuestions`, questionId);
  const docSnap = await getDoc(answeredQuestionRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    await updateDoc(answeredQuestionRef, {
      count: (data.count || 0) + 1,
      lastAnswered: serverTimestamp(),
    });
  } else {
    await setDoc(answeredQuestionRef, {
      questionId,
      count: 1,
      lastAnswered: serverTimestamp(),
    });
  }
};

export const getAnsweredQuestions = async (userId: string): Promise<AnsweredQuestion[]> => {
  const answeredQuestionsRef = collection(db, `users/${userId}/answeredQuestions`);
  const querySnapshot = await getDocs(answeredQuestionsRef);
  return querySnapshot.docs.map(doc => doc.data() as AnsweredQuestion);
};

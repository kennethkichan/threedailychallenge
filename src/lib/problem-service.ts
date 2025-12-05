// src/lib/problem-service.ts
import { db } from '@/firebase';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from 'firebase/firestore';
import { Problem } from '@/ai/schemas';

export const getProblems = async (): Promise<Problem[]> => {
  const problemsCollectionRef = collection(db, 'problems');
  const q = query(problemsCollectionRef, where('review_status', '!=', 'disputed'));
  const querySnapshot = await getDocs(q);
  
  const problems: Problem[] = [];
  querySnapshot.forEach((doc) => {
    problems.push({ id: doc.id, ...doc.data() } as Problem);
  });
  
  return problems;
};

export const getAllProblems = async (): Promise<Problem[]> => {
    const problemsCollectionRef = collection(db, 'problems');
    const querySnapshot = await getDocs(problemsCollectionRef);
    
    const problems: Problem[] = [];
    querySnapshot.forEach((doc) => {
      problems.push({ id: doc.id, ...doc.data() } as Problem);
    });
    
    return problems;
  };

export const createProblem = async (problem: Omit<Problem, 'id'>): Promise<Problem> => {
    const problemsCollectionRef = collection(db, 'problems');
    const docRef = await addDoc(problemsCollectionRef, problem);
    return { id: docRef.id, ...problem };
};

export const updateProblem = async (problem: Problem): Promise<void> => {
    const problemRef = doc(db, 'problems', problem.id);
    await updateDoc(problemRef, problem);
};

export const deleteProblem = async (problemId: string): Promise<void> => {
    const problemRef = doc(db, 'problems', problemId);
    await deleteDoc(problemRef);
};

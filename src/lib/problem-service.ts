'use server';

import { adminDb } from '@/firebase-admin';
import { Problem } from '@/ai/schemas';

export const getProblems = async (): Promise<Problem[]> => {
    const problemsCollectionRef = adminDb.collection('problems');
    const q = problemsCollectionRef.where('review_status', '!=', 'disputed');
    const querySnapshot = await q.get();
    
    const problems: Problem[] = [];
    querySnapshot.forEach((doc) => {
        problems.push({ id: doc.id, ...doc.data() } as Problem);
    });
    
    return problems;
};

export const getAllProblems = async (): Promise<Problem[]> => {
    const problemsCollectionRef = adminDb.collection('problems');
    const querySnapshot = await problemsCollectionRef.get();
    
    const problems: Problem[] = [];
    querySnapshot.forEach((doc) => {
        problems.push({ id: doc.id, ...doc.data() } as Problem);
    });
    
    return problems;
};

export const createProblem = async (problem: Omit<Problem, 'id'>): Promise<Problem> => {
    const problemsCollectionRef = adminDb.collection('problems');
    const docRef = await problemsCollectionRef.add(problem);
    return { id: docRef.id, ...problem };
};

export const updateProblem = async (problem: Problem): Promise<void> => {
    const problemRef = adminDb.collection('problems').doc(problem.id);
    await problemRef.update({ ...problem });
};

export const deleteProblem = async (problemId: string): Promise<void> => {
    const problemRef = adminDb.collection('problems').doc(problemId);
    await problemRef.delete();
};

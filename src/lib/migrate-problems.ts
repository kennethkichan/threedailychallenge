// src/lib/migrate-problems.ts
import { db } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import problems from '../../public/problems_database.json';
import { Problem } from '@/ai/schemas'; // Assuming you have this type defined

export const syncProblemsToFirestore = async () => {
  const problemsCollectionRef = collection(db, 'problems');
  const batch = writeBatch(db);

  // A type assertion to ensure `problems` matches the expected structure.
  const typedProblems: Problem[] = problems as Problem[];

  typedProblems.forEach((problem) => {
    if (problem.id) { // Ensure the problem has an ID
        const docRef = doc(problemsCollectionRef, problem.id);
        // Overwriting the document entirely to ensure old fields like 'prompt' are removed.
        batch.set(docRef, problem);
    }
  });

  try {
    await batch.commit();
    console.log('Successfully synced problems to Firestore.');
    return { success: true, message: 'Successfully synced problems to Firestore.' };
  } catch (error) {
    console.error('Error syncing problems to Firestore:', error);
    return { success: false, message: `Error syncing problems: ${error}` };
  }
};

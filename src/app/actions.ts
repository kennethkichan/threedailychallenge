'use server';

import { adminDb } from '@/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Reports a problem by creating a dispute record and updating the problem's status.
 * This is a server action and can only be executed on the server.
 * @param problemId The ID of the problem to report.
 * @returns An object indicating success or failure.
 */
export async function reportProblem(problemId: string): Promise<{ success: boolean, message: string }> {
  if (!problemId) {
    return { success: false, message: 'Problem ID is required.' };
  }

  try {
    const problemRef = adminDb.collection('problems').doc(problemId);
    const disputeRef = adminDb.collection('disputes').doc(); // Create a new dispute with a random ID

    const problemDoc = await problemRef.get();
    if (!problemDoc.exists) {
        return { success: false, message: 'Problem not found.' };
    }

    const batch = adminDb.batch();

    // Update the problem's status to 'disputed'
    batch.update(problemRef, { 
        review_status: 'disputed',
        disputed_on: FieldValue.serverTimestamp()
    });

    // Create a new dispute record
    batch.set(disputeRef, {
      problemId: problemId,
      reason: 'User reported an issue with the problem or solution.', // Generic reason
      status: 'open',
      createdAt: FieldValue.serverTimestamp(),
      // In a real app, you might get the userId from the session
      // userId: session.uid 
    });

    await batch.commit();

    return { success: true, message: 'Problem successfully reported.' };
  } catch (error) {
    console.error('Error reporting problem:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to report problem: ${errorMessage}` };
  }
}

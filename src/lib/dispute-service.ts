'use server';

import { adminDb } from '@/firebase-admin';
import { Dispute } from '@/ai/schemas';

/**
 * Fetches all disputes from the Firestore database.
 * 
 * @returns A promise that resolves to an array of Dispute objects.
 */
export const getDisputes = async (): Promise<Dispute[]> => {
    const disputesCollectionRef = adminDb.collection('disputes');
    const querySnapshot = await disputesCollectionRef.get();
    
    const disputes: Dispute[] = [];
    querySnapshot.forEach((doc) => {
        disputes.push({ id: doc.id, ...doc.data() } as Dispute);
    });
    
    return disputes;
};

/**
 * Updates the status of a dispute and the associated problem in Firestore.
 * 
 * @param disputeId The ID of the dispute to update.
 * @param problemId The ID of the problem associated with the dispute.
 * @param newStatus The new status to set for the dispute and problem.
 */
export const updateDisputeStatus = async (disputeId: string, problemId: string, newStatus: 'resolved' | 'dismissed'): Promise<void> => {
    const batch = adminDb.batch();

    // Ref to the dispute document
    const disputeRef = adminDb.collection('disputes').doc(disputeId);
    batch.update(disputeRef, { status: newStatus });

    // Ref to the problem document
    const problemRef = adminDb.collection('problems').doc(problemId);
    batch.update(problemRef, { review_status: newStatus });

    // Commit the batch
    await batch.commit();
};

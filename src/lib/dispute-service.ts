// src/lib/dispute-service.ts
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Dispute } from '@/ai/schemas';

export const createDispute = async (problemId: string, userId: string, reason: string) => {
  try {
    // Add a new document to the 'disputes' collection
    await addDoc(collection(db, 'disputes'), {
      problemId,
      userId,
      reason,
      status: 'open', // Initial status
      createdAt: serverTimestamp(),
    });

    // Mark the problem as disputed
    const problemRef = doc(db, 'problems', problemId);
    await updateDoc(problemRef, {
      review_status: 'disputed',
    });

    console.log(`Successfully created dispute for problem ${problemId}`);
    return { success: true, message: 'Dispute submitted successfully.' };
  } catch (error) {
    console.error('Error creating dispute:', error);
    return { success: false, message: `Error submitting dispute: ${error}` };
  }
};

export const getDisputes = async (): Promise<Dispute[]> => {
    const disputesCollectionRef = collection(db, 'disputes');
    const querySnapshot = await getDocs(disputesCollectionRef);
    
    const disputes: Dispute[] = [];
    querySnapshot.forEach((doc) => {
        disputes.push({ id: doc.id, ...doc.data() } as Dispute);
    });
    
    return disputes;
};

export const updateDisputeStatus = async (disputeId: string, problemId: string, newStatus: 'resolved' | 'dismissed'): Promise<void> => {
    const batch = writeBatch(db);

    const disputeRef = doc(db, 'disputes', disputeId);
    batch.update(disputeRef, { status: newStatus });

    const problemRef = doc(db, 'problems', problemId);
    batch.update(problemRef, { review_status: 'approved' });

    await batch.commit();
};


import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { User } from 'firebase/auth';

export const createUserProfileDocument = async (user: User) => {
  if (!user) return;

  const userRef = doc(db, `users/${user.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const createdAt = serverTimestamp();

    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        streak: 0,
        lastChallengeDate: null,
      });
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  }
};

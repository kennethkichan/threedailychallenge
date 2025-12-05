
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminDb = admin.firestore();
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export { adminDb };

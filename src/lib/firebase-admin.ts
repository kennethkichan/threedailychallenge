'use server';

import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const verifyAdmin = async () => {
    const sessionCookie = cookies().get('__session')?.value;
  
    if (!sessionCookie) {
      return { isAdmin: false, error: 'Unauthorized' };
    }
  
    try {
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      if (decodedClaims.is_admin) {
        return { isAdmin: true, error: null };
      }
      return { isAdmin: false, error: 'Forbidden' };
    } catch (error) {
      return { isAdmin: false, error: 'Invalid session cookie' };
    }
}; 

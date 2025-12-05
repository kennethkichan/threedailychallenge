'use server';

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { verifyAdmin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function GET(req: NextRequest) {
  const { isAdmin, error } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      isAdmin: !!user.customClaims?.is_admin,
    }));
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { isAdmin, error } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    const { uid, makeAdmin } = await req.json();
    await admin.auth().setCustomUserClaims(uid, { is_admin: makeAdmin });
    return NextResponse.json({ message: 'User admin status updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

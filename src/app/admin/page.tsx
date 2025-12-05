'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminPage() {
  const { user, is_admin, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p className="mb-4">You must be logged in to view this page.</p>
            <Link href="/login"><Button>Go to Login</Button></Link>
        </div>
    );
  }

  if (!is_admin) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p className="mb-4">You do not have permission to access this page.</p>
            <Link href="/"><Button>Go to Homepage</Button></Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-6">Welcome, Admin. You can now create and manage problems.</p>
      <div className="flex space-x-4">
        <Link href="/admin/problems/new">
          <Button>Create New Problem</Button>
        </Link>
        <Link href="/">
            <Button variant="secondary">Go Back Home</Button>
        </Link>
      </div>
    </div>
  );
}

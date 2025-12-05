'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { syncProblemsToFirestore } from '@/lib/migrate-problems';
import { getAllProblems, createProblem, updateProblem, deleteProblem } from '@/lib/problem-service';
import { getDisputes, updateDisputeStatus } from '@/lib/dispute-service';
import { Problem, Dispute } from '@/ai/schemas';
import { ProblemList } from '@/components/problem-list';
import { ProblemEditor } from '@/components/problem-editor';
import { DisputeList } from '@/components/dispute-list';
import { UserList } from '@/components/user-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function AdminPage() {
  const { user, loading, is_admin } = useAuth();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoadingDisputes, setIsLoadingDisputes] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [resolvingDispute, setResolvingDispute] = useState<Dispute | null>(null);

  const fetchProblems = async () => {
    if (is_admin) {
      setIsLoadingProblems(true);
      const allProblems = await getAllProblems();
      setProblems(allProblems);
      setIsLoadingProblems(false);
    }
  };

  const fetchDisputes = async () => {
    if (is_admin) {
      setIsLoadingDisputes(true);
      const allDisputes = await getDisputes();
      setDisputes(allDisputes);
      setIsLoadingDisputes(false);
    }
  };

  useEffect(() => {
    if (!loading && !is_admin) {
      router.push('/');
    }
    fetchProblems();
    fetchDisputes();
  }, [user, loading, is_admin, router]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    const result = await syncProblemsToFirestore();
    setSyncMessage(result.message);
    setIsSyncing(false);
    fetchProblems();
  };

  const handleCreate = () => {
    setEditingProblem(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setIsEditorOpen(true);
  };

  const handleDelete = async (problemId: string) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
      await deleteProblem(problemId);
      fetchProblems();
    }
  };

  const handleSave = async (problem: Problem) => {
    if (editingProblem) {
      await updateProblem({ ...editingProblem, ...problem });
    } else {
      await createProblem(problem as Omit<Problem, 'id'>);
    }

    if (resolvingDispute) {
        await updateDisputeStatus(resolvingDispute.id, resolvingDispute.problemId, 'resolved');
        setResolvingDispute(null);
    }

    fetchProblems();
    fetchDisputes();
    setIsEditorOpen(false);
  };

  const handleResolve = (dispute: Dispute) => {
    const problemToEdit = problems.find(p => p.id === dispute.problemId);
    if (problemToEdit) {
        setEditingProblem(problemToEdit);
        setResolvingDispute(dispute);
        setIsEditorOpen(true);
    }
  };

  const handleDismiss = async (disputeId: string, problemId: string) => {
    await updateDisputeStatus(disputeId, problemId, 'dismissed');
    fetchDisputes();
  };

  if (loading || !is_admin) {
    return <p>Loading or unauthorized...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
      </div>

      <Tabs defaultValue="disputes">
        <TabsList className="mb-4">
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="problems">Problem Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes">
          {isLoadingDisputes ? (
            <p>Loading disputes...</p>
          ) : (
            <DisputeList 
              disputes={disputes} 
              onResolve={handleResolve} 
              onDismiss={handleDismiss} 
            />
          )}
        </TabsContent>

        <TabsContent value="problems">
          {isLoadingProblems ? (
            <p>Loading problems...</p>
          ) : (
            <ProblemList 
              problems={problems} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onCreate={handleCreate}
            />
          )}
        </TabsContent>

        <TabsContent value="users">
          <UserList />
        </TabsContent>

        <TabsContent value="sync">
            <h2 className="text-xl font-semibold mb-2">Sync Problems</h2>
            <p className="mb-4">Sync the problems from `problems_database.json` to Firestore.</p>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? 'Syncing...' : 'Sync Problems to Firestore'}
            </Button>
            {syncMessage && <p className="mt-4 text-sm text-gray-600">{syncMessage}</p>}
        </TabsContent>
      </Tabs>

      <ProblemEditor 
        problem={editingProblem}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

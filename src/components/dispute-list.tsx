'use client';

import { Dispute } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DisputeListProps {
  disputes: Dispute[];
  onResolve: (dispute: Dispute) => void;
  onDismiss: (disputeId: string, problemId: string) => void;
}

export function DisputeList({ disputes, onResolve, onDismiss }: DisputeListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Problem ID</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {disputes.map((dispute) => (
          <TableRow key={dispute.id}>
            <TableCell>{dispute.problemId}</TableCell>
            <TableCell>{dispute.reason}</TableCell>
            <TableCell>{dispute.status}</TableCell>
            <TableCell>
                {dispute.status === 'open' && (
                    <>
                        <Button variant="outline" size="sm" onClick={() => onResolve(dispute)} className="mr-2">
                            Resolve
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => onDismiss(dispute.id, dispute.problemId)}>
                            Dismiss
                        </Button>
                    </>
                )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

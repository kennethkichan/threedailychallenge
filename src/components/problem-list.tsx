'use client';

import { useState, useMemo } from 'react';
import { Problem } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';

interface ProblemListProps {
  problems: Problem[];
  onEdit: (problem: Problem) => void;
  onDelete: (problemId: string) => void;
  onCreate: () => void;
}

const statusOptions = ['all', 'approved', 'disputed'];

export function ProblemList({ problems, onEdit, onDelete, onCreate }: ProblemListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [problemsPerPage, setProblemsPerPage] = useState(10);

  const sortedAndFilteredProblems = useMemo(() => {
    return problems
      .filter(p => {
        const searchMatch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.question.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || (p.review_status || 'approved') === statusFilter;
        return searchMatch && statusMatch;
      })
      .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
  }, [problems, searchTerm, statusFilter]);

  const totalPages = Math.ceil(sortedAndFilteredProblems.length / problemsPerPage);
  const startIndex = (currentPage - 1) * problemsPerPage;
  const endIndex = startIndex + problemsPerPage;
  const paginatedProblems = sortedAndFilteredProblems.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value, 10);
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
                <Input 
                    placeholder="Search by ID or question..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map(option => (
                            <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={onCreate}>Create New Problem</Button>
        </div>
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Problem ID</TableHead>
            <TableHead>Question</TableHead>
            <TableHead className="w-[150px]">Age Group</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProblems.map((problem) => (
            <TableRow key={problem.id}>
              <TableCell className="font-mono text-xs">{problem.id}</TableCell>
              <TableCell className="font-medium truncate">{problem.question}</TableCell>
              <TableCell>{problem.age_group}</TableCell>
              <TableCell>
                <Badge
                  variant={problem.review_status === 'disputed' ? 'destructive' : 'default'}
                >
                  {problem.review_status || 'approved'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(problem)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(problem.id)}>
                      Delete
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-4 py-4">
        <div className="flex items-center space-x-2">
            <span className="text-sm">Rows per page:</span>
            <Select onValueChange={(value) => setProblemsPerPage(Number(value))} value={`${problemsPerPage}`}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {[10, 25, 50].map(size => (
                        <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center space-x-2">
            <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            >
            Previous
            </Button>
            <Input 
                type="number"
                value={currentPage}
                onChange={handlePageInputChange}
                className="w-16 text-center"
            />
            <span className="text-sm">
            of {totalPages}
            </span>
            <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            >
            Next
            </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Problem } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';

interface ProblemEditorProps {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (problem: Problem) => void;
}

const ageGroups = ['Toddler', 'Child', 'Pre-teen', 'High School', 'Adult'];

export function ProblemEditor({ problem, isOpen, onClose, onSave }: ProblemEditorProps) {
  const [formData, setFormData] = useState<Problem | Partial<Problem>>({});

  useEffect(() => {
    if (problem) {
      setFormData(problem);
    } else {
      // Reset for new problem
      setFormData({ question: '', answer: '', solution_explanation: '', age_group: ageGroups[0] });
    }
  }, [problem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    onSave(formData as Problem);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]"> 
        <DialogHeader>
          <DialogTitle>{problem ? 'Edit Problem' : 'Create New Problem'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="question" className="text-right">
              Question
            </Label>
            <Textarea id="question" value={formData.question || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="answer" className="text-right">
              Answer
            </Label>
            <Input id="answer" value={formData.answer || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="solution_explanation" className="text-right">
              Explanation
            </Label>
            <Textarea id="solution_explanation" value={formData.solution_explanation || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="age_group" className="text-right">
              Age Group
            </Label>
            <Select onValueChange={(value) => handleSelectChange('age_group', value)} value={formData.age_group}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an age group" />
                </SelectTrigger>
                <SelectContent>
                    {ageGroups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          {/* Add fields for choices if you have them */}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ageGroups = ['Toddler', 'Child', 'Pre-teen', 'High School', 'Adult'];

export default function AddChallengePage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    prompt: '',
    problem_type: '',
    options: ['', '', '', ''],
    answer: '',
    solution_explanation: '',
    age_group: '',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formState.options];
    newOptions[index] = value;
    setFormState(prev => ({ ...prev, options: newOptions }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newChallenge = {
      prompt: formState.prompt,
      problem_type: formState.problem_type,
      data: { options: formState.options },
      answer: formState.answer,
      solution_explanation: formState.solution_explanation,
      age_group: formState.age_group,
      review_status: 'approved', 
    };

    try {
      const response = await fetch('/api/add-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChallenge),
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Failed to add challenge');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Add a New Challenge</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea id="prompt" name="prompt" value={formState.prompt} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="problem_type">Problem Type</Label>
          <Input id="problem_type" name="problem_type" value={formState.problem_type} onChange={handleInputChange} required />
        </div>
        <div>
          <Label>Options</Label>
          {formState.options.map((option, index) => (
            <Input
              key={index}
              className="mt-2"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              required
            />
          ))}
        </div>
        <div>
            <Label htmlFor="answer">Correct Answer</Label>
            <Select onValueChange={(value) => handleSelectChange('answer', value)} value={formState.answer}>
                <SelectTrigger>
                    <SelectValue placeholder="Select the correct answer" />
                </SelectTrigger>
                <SelectContent>
                {formState.options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                    {`Option ${index + 1}: ${option}`}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
        <div>
          <Label htmlFor="solution_explanation">Solution Explanation</Label>
          <Textarea id="solution_explanation" name="solution_explanation" value={formState.solution_explanation} onChange={handleInputChange} required />
        </div>
        <div>
            <Label htmlFor="age_group">Age Group</Label>
            <Select onValueChange={(value) => handleSelectChange('age_group', value)} value={formState.age_group}>
                <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                {ageGroups.map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
        <Button type="submit">Add Challenge</Button>
      </form>
    </div>
  );
}

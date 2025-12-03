'use client';

import { useState } from 'react';
import { Problem } from '@/ai/schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ChallengeCardProps {
  challenge: Problem;
  onDispute: (problemId: string) => void;
}

export function ChallengeCard({ challenge, onDispute }: ChallengeCardProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    setIsSubmitted(true);
  };

  const handleDispute = async () => {
    try {
      const response = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: challenge.id }),
      });

      if (response.ok) {
        setIsDisputed(true);
        setTimeout(() => onDispute(challenge.id), 2000); // give user time to see confirmation
      } else {
        console.error('Failed to dispute the problem.');
        // Optionally, show an error message to the user
      }
    } catch (error) {
      console.error('An error occurred while disputing the problem:', error);
    }
  };

  const isCorrect = selectedValue === challenge.answer;
  const choiceLabels = ['A', 'B', 'C', 'D'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{challenge.problem_type}</span>
          {isSubmitted && !isDisputed && (
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                isCorrect
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          )}
        </CardTitle>
        <div className="text-right text-xs font-mono text-gray-400 dark:text-gray-500 pt-1">
          ID: {challenge.id}
        </div>
        <CardDescription className="pt-2 text-base text-gray-800 dark:text-gray-200">
          {challenge.prompt}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          onValueChange={handleValueChange}
          disabled={isSubmitted}
          value={selectedValue ?? undefined}
          className="space-y-2"
        >
          {challenge.data.options.map((choice, index) => {
            const id = `${challenge.prompt}-${index}`;
            let choiceStyle = 'cursor-pointer';
            if (isSubmitted) {
              choiceStyle = ''; // remove cursor pointer after submission
              if (choice === challenge.answer) {
                choiceStyle += ' text-green-600 dark:text-green-400 font-bold';
              } else if (choice === selectedValue) {
                choiceStyle += ' text-red-600 dark:text-red-400 line-through';
              }
            }
            return (
              <div key={id} className="flex items-center space-x-3">
                <RadioGroupItem value={choice} id={id} />
                <Label htmlFor={id} className={`flex-1 ${choiceStyle}`}>
                  <span className="font-mono mr-2">{choiceLabels[index]}.</span> {choice}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex-col items-start">
        {isSubmitted && (
          <Accordion type="single" collapsible className="w-full" defaultValue="solution">
            <AccordionItem value="solution">
              <AccordionTrigger>Solution Explanation</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.solution_explanation}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <div className="pt-4 w-full flex justify-end">
          {isSubmitted && !isDisputed && (
            <Button variant="destructive" size="sm" onClick={handleDispute}>
              Report Problem
            </Button>
          )}
          {isDisputed && (
            <p className="text-sm text-red-500 font-semibold">
              Problem reported. It will be removed shortly.
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
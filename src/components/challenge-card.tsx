'use client';

import { useState, useTransition } from 'react';
import { Problem } from '@/ai/schemas';
import { reportProblem } from '@/app/actions';
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
  onAnswerSelected: (problemId: string, selectedAnswer: string) => void;
  isSubmitted: boolean;
  selectedValue: string | null;
}

export function ChallengeCard({ challenge, onAnswerSelected, isSubmitted, selectedValue }: ChallengeCardProps) {
  const [isDisputed, setIsDisputed] = useState(challenge.review_status === 'disputed');
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (value: string) => {
    if (!isSubmitted) {
        onAnswerSelected(challenge.id, value);
    }
  };

  const handleDispute = async () => {
    startTransition(async () => {
        const result = await reportProblem(challenge.id);
        if (result.success) {
            setIsDisputed(true);
        } else {
            console.error('Failed to dispute problem:', result.message);
        }
    });
  };

  const isCorrect = selectedValue === challenge.answer;
  const choiceLabels = ['A', 'B', 'C', 'D'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{challenge.problem_type}</span>
          <div className="flex items-center space-x-4">
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
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                ID: {challenge.id}
            </span>
          </div>
        </CardTitle>
        <CardDescription className="pt-2 text-base text-gray-800 dark:text-gray-200">
          {challenge.question}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          onValueChange={handleValueChange}
          disabled={isSubmitted || isPending}
          value={selectedValue ?? ''}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {challenge.data.options.map((choice, index) => {
            const id = `${challenge.question}-${index}`;
            const isSelected = selectedValue === choice;
            const isCorrectAnswer = choice === challenge.answer;
            
            let boxStyle;

            if (isSubmitted) {
              if (isCorrectAnswer) {
                boxStyle = 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-400 text-green-800 dark:text-green-200';
              } else if (isSelected && !isCorrectAnswer) {
                boxStyle = 'bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-400 text-red-800 dark:text-red-200 line-through';
              } else {
                boxStyle = 'border-gray-300 dark:border-gray-700 opacity-60';
              }
            } else {
                if (isSelected) {
                    boxStyle = 'border-primary bg-primary/10 dark:border-primary-foreground dark:bg-primary/20';
                } else {
                    boxStyle = 'border-gray-300 dark:border-gray-700 hover:border-primary/80 dark:hover:border-primary-foreground/80 hover:bg-primary/5 dark:hover:bg-primary/10';
                }
            }

            return (
              <Label
                key={id}
                htmlFor={id}
                className={`flex items-center p-4 rounded-lg border transition-all ${boxStyle} ${!isSubmitted ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <RadioGroupItem value={choice} id={id} className="sr-only" />
                <span className="font-mono mr-3 font-semibold">{choiceLabels[index]}</span>
                <span className="flex-1">{choice}</span>
              </Label>
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
          {isSubmitted && !isCorrect && !isDisputed && (
            <Button
              variant={'destructive'}
              size="sm"
              onClick={handleDispute}
              disabled={isPending}
            >
              {isPending ? 'Reporting...' : 'Report Problem'}
            </Button>
          )}
          {(isDisputed || challenge.review_status === 'disputed') && (
            <p className="text-sm text-red-500 font-semibold">
              Problem reported. Our team will review it shortly.
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

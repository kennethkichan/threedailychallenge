'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Challenge } from '@/ai/schemas';
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
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedValue) {
      setIsSubmitted(true);
    }
  };

  const isCorrect = selectedValue === challenge.correctValue;
  const choiceLabels = ['A', 'B', 'C', 'D'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{challenge.problemType}</span>
          {isSubmitted && (
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
        <CardDescription className="pt-2 text-base text-gray-800 dark:text-gray-200">
          {challenge.problemStatement}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          onValueChange={setSelectedValue}
          disabled={isSubmitted}
          value={selectedValue ?? undefined}
          className="space-y-2"
        >
          {challenge.choices.map((choice, index) => {
            const id = `${challenge.problemStatement}-${index}`;
            let choiceStyle = 'cursor-pointer';
            if (isSubmitted) {
              choiceStyle = ''; // remove cursor pointer after submission
              if (choice === challenge.correctValue) {
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
      <CardFooter>
        {!isSubmitted ? (
          <Button onClick={handleSubmit} disabled={!selectedValue}>
            Check Answer
          </Button>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="solution">
              <AccordionTrigger>View Solution Explanation</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.solutionExplanation}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardFooter>
    </Card>
  );
}
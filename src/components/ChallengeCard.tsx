"use client";

import { BrainCircuit, Calculator, Combine, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ChallengeCardProps {
  challenge: Challenge;
  challengeIndex: number;
  onAnswerSelect: (challengeIndex: number, answer: string) => void;
  onSubmitAnswer: (challengeIndex: number) => void;
  answerState: { selected: string | null; submitted: boolean };
}

const ICONS: { [key: string]: React.ReactNode } = {
  "Pattern Recognition": <BrainCircuit className="h-4 w-4" />,
  "Shortcut Calculation": <Calculator className="h-4 w-4" />,
  "Mixed Reasoning": <Combine className="h-4 w-4" />,
  "default": <Lightbulb className="h-4 w-4" />,
};

export function ChallengeCard({ challenge, challengeIndex, onAnswerSelect, onSubmitAnswer, answerState }: ChallengeCardProps) {
  const { selected: selectedAnswer, submitted } = answerState;
  
  const isCorrect = submitted && selectedAnswer === challenge.correctValue;

  const getChoiceStyle = (choiceValue: string) => {
    if (!submitted) return "border-border";
    const isCorrectAnswer = choiceValue === challenge.correctValue;
    const isSelectedAnswer = choiceValue === selectedAnswer; // Define isSelectedAnswer here

    if (isCorrectAnswer) return "border-green-500 ring-2 ring-green-500 bg-green-500/10";
    if (isSelectedAnswer && !isCorrectAnswer) return "border-destructive ring-2 ring-destructive bg-destructive/10";
    return "border-border";
  };
  
  const getChoiceFeedbackIcon = (choiceValue: string) => {
    if (!submitted) {
      return <div className="w-5 h-5" />; // Placeholder for alignment
    }

    const isCorrectAnswer = choiceValue === challenge.correctValue;
    const isSelectedAnswer = choiceValue === selectedAnswer;

    if (isCorrectAnswer) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (isSelectedAnswer && !isCorrectAnswer) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return <div className="w-5 h-5" />; // Placeholder for alignment
  };

  const choiceLabels = ['A', 'B', 'C', 'D'];
  return (
    <Card className="w-full max-w-2xl overflow-hidden transition-shadow duration-300 ease-in-out shadow-lg hover:shadow-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
            <CardDescription className="flex items-center gap-2 font-semibold text-sm">
                {ICONS[challenge.problemType] || ICONS.default}
                {challenge.problemType}
            </CardDescription>
            {submitted && (
              <Badge variant={isCorrect ? "default" : "destructive"} className={cn(isCorrect && "bg-green-600")}>
                {isCorrect ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                {isCorrect ? "Correct" : "Incorrect"}
              </Badge>
            )}
        </div>
        <CardTitle className="text-xl leading-snug">
          {challenge.problemStatement}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <RadioGroup
          value={selectedAnswer ?? undefined}
          onValueChange={(value) => onAnswerSelect(challengeIndex, value)}
          disabled={submitted}
          className="space-y-3"
        >
          {challenge.choices.map((choice, index) => (
            <Label key={index} htmlFor={`${challengeIndex}-${index}`} className={cn(
              "flex items-center space-x-4 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-muted/50",
              getChoiceStyle(choice) // Use the choice value directly
            )}>
              <RadioGroupItem value={choice} id={`${challengeIndex}-${index}`} /> {/* Use the choice value directly */}
              <span className="flex-1 text-base">{`${choiceLabels[index]}) ${choice}`}</span>
              {getChoiceFeedbackIcon(choice)}
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4 bg-muted/30 px-6 py-4">
        {!submitted ? (
          <Button onClick={() => onSubmitAnswer(challengeIndex)} disabled={!selectedAnswer} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Submit Answer
          </Button>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="solution" className="border-0">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                View Solution
              </AccordionTrigger>
              <AccordionContent className="text-base space-y-2 pt-2">
              <p><span className="font-bold">Correct Answer:</span> {challenge.answer}) {challenge.correctValue}</p>
                <p><span className="font-bold">Explanation:</span> {challenge.solutionExplanation}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardFooter>
    </Card>
  );
}

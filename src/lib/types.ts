export interface Challenge {
  problemType: string;
  problemStatement: string;
  choices: string[];
  answer: string;
  correctValue: string; // Add this line
  solutionExplanation: string;
}

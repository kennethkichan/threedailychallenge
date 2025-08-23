import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDailyChallenges } from './daily-challenge-generation';
import { ai } from '@/ai/genkit';

// Mock the entire genkit ai module
vi.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: vi.fn().mockReturnValue(vi.fn()),
    defineFlow: vi.fn((config, flow) => flow), // Return the flow function directly
  },
}));

const mockDailyChallengePrompt = ai.definePrompt({
  name: 'dailyChallengePrompt',
});

describe('generateDailyChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validOutput = [
    {
      problemType: 'Pattern Recognition',
      problemStatement: '1, 2, 4, 8, ?',
      choices: ['12', '14', '16', '18'],
      correctValue: '16',
      answer: 'C',
      solutionExplanation: 'Each number is double the previous one.',
    },
    {
      problemType: 'Shortcut Calculation',
      problemStatement: 'What is 50% of 200?',
      choices: ['50', '100', '150', '200'],
      correctValue: '100',
      answer: 'B',
      solutionExplanation: '50% is half, so half of 200 is 100.',
    },
    {
      problemType: 'Mixed Reasoning',
      problemStatement: 'A, B, C, ?',
      choices: ['D', 'E', 'F', 'G'],
      correctValue: 'D',
      answer: 'A',
      solutionExplanation: 'The next letter in the alphabet.',
    },
  ];

  const invalidOutput = [
    ...validOutput.slice(0, 2),
    {
      problemType: 'Mixed Reasoning',
      problemStatement: 'A, B, C, ?',
      choices: ['D', 'E', 'F', 'G'],
      correctValue: 'D',
      answer: 'B', // Invalid: 'B' corresponds to 'E', not 'D'
      solutionExplanation: 'The next letter in the alphabet.',
    },
  ];

  it('should return challenges when the AI output is valid', async () => {
    (mockDailyChallengePrompt as any).mockResolvedValue({ output: validOutput });
    const challenges = await generateDailyChallenges({});
    expect(challenges).toEqual(validOutput);
    expect(mockDailyChallengePrompt).toHaveBeenCalledTimes(1);
  });

  it('should throw an error after multiple failed attempts with invalid AI output', async () => {
    (mockDailyChallengePrompt as any).mockResolvedValue({ output: invalidOutput });
    await expect(generateDailyChallenges({})).rejects.toThrow(
      'Failed to generate valid daily challenges after 3 attempts.'
    );
    expect(mockDailyChallengePrompt).toHaveBeenCalledTimes(3);
  });
});
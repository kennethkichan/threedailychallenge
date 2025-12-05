import { defineFlow, run } from '@genkit-ai/flow';
import { z } from 'zod';
import { readDatabase, writeDatabase, Problem } from '../../../scripts/db';
import { generateCategorizedChallenge } from './daily-challenge-generation';
import { reviewProblem, ReviewDecision } from './daily-challenge-review';

// Define the generation tasks. This could also be loaded from a config file.
const TASKS = [
  { age_group: 'Toddler', problem_type: 'Pattern Recognition' },
  { age_group: 'Child', problem_type: 'Pattern Recognition' },
//   { age_group: 'Child', problem_type: 'Basic Sorting' },
//   { age_group: 'High School', problem_type: 'Sequences' },
//   { age_group: 'Adult', problem_type: 'Logical Deduction' },
];

/**
 * A Genkit flow to generate new problems based on the defined TASKS.
 */
export const generateProblemsFlow = defineFlow(
  {
    name: 'generateProblemsFlow',
    inputSchema: z.object({ countPerTask: z.number().default(1) }),
    outputSchema: z.string(),
  },
  async ({ countPerTask }) => {
    console.log(`🌱 Starting generation task...`);
    const { problems: existingProblems, maxId } = await readDatabase();
    const existingQuestions = new Set(existingProblems.map(p => p.question));
    console.log(`🔍 Found ${existingQuestions.size} existing problems.`);

    const allGeneratedProblems: Omit<Problem, 'id'>[] = [];

    for (const task of TASKS) {
      console.log(`\n🔄 Generating ${countPerTask} problem(s) for: ${task.age_group} - ${task.problem_type}`);
      for (let i = 0; i < countPerTask; i++) {
        try {
          const generated = await run(generateCategorizedChallenge, {
            age_group: task.age_group,
            problem_type: task.problem_type,
          });
          if (generated && !existingQuestions.has(generated.question)) {
            allGeneratedProblems.push(generated);
            existingQuestions.add(generated.question);
            console.log(`   ✨ Generated unique problem candidate.`);
          } else {
            console.log(`   🚫 Skipping duplicate or invalid problem.`);
          }
        } catch (e) {
          console.log(`   ❌ Error generating problem for task. Skipping.`);
        }
      }
    }

    if (allGeneratedProblems.length === 0) {
      return '\nNo new unique problems were generated. Database is up to date.';
    }

    const problemsToAppend = allGeneratedProblems.map((problem, index) => ({
      ...problem,
      id: (maxId + index + 1).toString(),
      review_status: 'pending',
      reviewed: 0,
      reviewed_on: null,
      verification_notes: null,
    }));

    const updatedDB = { problems: [...existingProblems, ...problemsToAppend] };
    await writeDatabase(updatedDB);

    return `\n✅ Successfully appended ${problemsToAppend.length} new problems.`;
  }
);

/**
 * A Genkit flow to review all problems with a 'pending' or 'disputed' status.
 */
export const reviewProblemsFlow = defineFlow(
  {
    name: 'reviewProblemsFlow',
    outputSchema: z.string(),
  },
  async () => {
    console.log('🔍 Starting review of pending problems...');
    const db = await readDatabase();
    const problemsToReview = db.problems.filter(
      (p) => p.review_status === 'pending' || p.review_status === 'disputed'
    );

    if (problemsToReview.length === 0) {
      return '✨ No problems are currently pending review.';
    }

    console.log(`Found ${problemsToReview.length} problem(s) to review.`);
    for (const problem of problemsToReview) {
      console.log(`🧐 Reviewing problem: ${problem.id} (${problem.review_status})`);
      const decision: ReviewDecision = await run(reviewProblem, { problem });
      const problemIndex = db.problems.findIndex((p) => p.id === problem.id);

      if (problemIndex !== -1) {
        const reviewedProblem = db.problems[problemIndex];

        // Update common fields
        reviewedProblem.review_status = decision.decision; // 'approve', 'correct', 'reject'
        reviewedProblem.verification_notes = decision.reasoning;
        reviewedProblem.reviewed_on = new Date().toISOString();
        reviewedProblem.reviewed = 1;
        reviewedProblem.disputed_on = null;

        // If the AI corrected the problem, replace the data
        if (decision.decision === 'correct' && decision.correctedProblem) {
          const originalId = reviewedProblem.id;
          db.problems[problemIndex] = { ...reviewedProblem, ...decision.correctedProblem, id: originalId };
          console.log(`✅ Problem ${problem.id} was auto-corrected.`);
        }
        console.log(`📝 Problem ${problem.id} review complete. Final Status: ${decision.decision}`);
      }
    }

    await writeDatabase(db);
    return '✅ Review process finished.';
  }
);
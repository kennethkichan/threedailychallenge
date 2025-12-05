import { z } from 'zod';

export const ProblemSchema = z.object({
    id: z.string(),
    question: z.string(),
    choices: z.array(z.string()),
    answer: z.string(),
    age_group: z.string(),
    review_status: z.string().optional(), // e.g., 'approved', 'disputed'
});

export const DisputeSchema = z.object({
    id: z.string(),
    problemId: z.string(),
    userId: z.string(),
    reason: z.string(),
    status: z.string(), // e.g., 'open', 'resolved'
    createdAt: z.any(), // Using any for Firestore Timestamp
});

export type Problem = z.infer<typeof ProblemSchema>;
export type Dispute = z.infer<typeof DisputeSchema>;
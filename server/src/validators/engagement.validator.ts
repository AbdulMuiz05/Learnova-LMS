import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, 'Please write a short review').max(2000),
});

export const reviewReplySchema = z.object({
  content: z.string().trim().min(2).max(2000),
});

export const questionSchema = z.object({
  lessonId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lesson'),
  content: z.string().trim().min(3, 'Question is too short').max(3000),
});

export const answerSchema = z.object({
  content: z.string().trim().min(2, 'Reply is too short').max(3000),
});

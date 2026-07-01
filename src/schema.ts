import { z } from 'zod';

export const CardHistorySchema = z.object({
  timestamp: z.number(),
  userId: z.string().nullable(),
  action: z.enum(['create', 'update']),
  diff: z.object({
    title: z.object({ old: z.string(), new: z.string() }).optional(),
    subtitle: z.object({ old: z.string(), new: z.string() }).optional(),
    content: z.object({ old: z.string(), new: z.string() }).optional(),
    details: z.object({ old: z.string(), new: z.string() }).optional(),
  }).optional()
});

export const UserCardProgressSchema = z.object({
  status: z.enum(['new', 'learning', 'review', 'suspended', 'relearning']),
  step: z.number().optional(),
  dueDate: z.string().optional(),
  interval: z.number().optional(),
  easeFactor: z.number().optional(),
  lapses: z.number().optional(),
  isLeech: z.boolean().optional(),
  algorithm: z.enum(['srs', 'fsrs']).optional(),
  stability: z.number().optional(),
  difficulty: z.number().optional(),
  reps: z.number().optional(),
  lastReview: z.string().nullable().optional(),
  history: z.array(z.string()).optional()
}).catchall(z.any());

export const CardSchema = z.object({
  id: z.string(),
  type: z.string(),
  nodeType: z.enum(['course', 'concept', 'flashcard']).optional(),
  format: z.enum(['q&a', 'cloze', 'basic']).optional(),
  parentId: z.string().optional(),
  title: z.string(),
  subtitle: z.string(),
  content: z.string(),
  details: z.string(),
  tags: z.array(z.string()),
  imageUrl: z.string().optional(),
  manualConnections: z.array(z.string()).optional(),
  suppressedConnections: z.array(z.string()).optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  progress: UserCardProgressSchema.optional(),
  subject: z.string().optional(),
  workspaceId: z.string().optional(),
  ownerUid: z.string().nullable().optional(),
  history: z.array(CardHistorySchema).optional()
});

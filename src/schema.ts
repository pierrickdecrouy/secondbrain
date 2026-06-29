import { z } from 'zod';

export const UserCardProgressSchema = z.object({
  status: z.enum(['new', 'learning', 'review', 'relearning']),
  due: z.string().optional(),
  reps: z.number().optional(),
  lapses: z.number().optional(),
  state: z.number().optional(),
  last_review: z.string().optional(),
  difficulty: z.number().optional(),
  stability: z.number().optional(),
  elapsed_days: z.number().optional(),
  scheduled_days: z.number().optional(),
  step: z.number().optional()
}).catchall(z.any());

export const CardSchema = z.object({
  id: z.string(),
  type: z.string(),
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
  workspaceId: z.string().optional()
});

import { z } from 'zod';

const shortText = z.string().trim().min(1).max(120);

export const commercialFollowupInputSchema = z.object({
  name: shortText,
  source: z.enum(['crm', 'presupuesto']),
  reason: z.string().trim().min(1).max(600),
  eventType: z.string().trim().max(120).optional(),
}).strict();

export const postEventInputSchema = z.object({
  clientName: shortText,
  eventName: shortText,
  eventType: z.string().trim().max(120).optional(),
  score: z.number().int().min(0).max(100).optional(),
  pendingTasks: z.number().int().min(0).max(10_000).optional(),
}).strict();

export const postEventMaterialSchema = z.object({
  testimonyMessage: z.string().trim().min(1).max(3_000),
  photoMessage: z.string().trim().min(1).max(3_000),
  socialPostIdea: z.string().trim().min(1).max(6_000),
}).strict();

export function serializeUntrustedPromptData(value: unknown): string {
  return JSON.stringify(value);
}

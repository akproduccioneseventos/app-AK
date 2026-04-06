// Temporarily disabled to ensure stable build
import { z } from 'genkit';

export const AnalyzeEventPlanInputSchema = z.object({
  planData: z.record(z.unknown()).describe('Event plan data as JSON object'),
});
export type AnalyzeEventPlanInput = z.infer<typeof AnalyzeEventPlanInputSchema>;

const AnalysisItemSchema = z.object({
  module: z.string(),
  status: z.enum(['Completo', 'Parcial', 'Faltante', 'Atención Requerida']),
  details: z.string(),
  suggestion: z.string().optional(),
});

export const AnalyzeEventPlanOutputSchema = z.object({
  summary: z.string(),
  items: z.array(AnalysisItemSchema),
});
export type AnalyzeEventPlanOutput = z.infer<typeof AnalyzeEventPlanOutputSchema>;


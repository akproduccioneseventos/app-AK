
import { z } from 'genkit';

export const AnalyzeEventPlanInputSchema = z.object({
  planData: z.any().describe('The entire JSON object of the event plan (FiestaEnPlanificacion).'),
});
export type AnalyzeEventPlanInput = z.infer<typeof AnalyzeEventPlanInputSchema>;

const AnalysisItemSchema = z.object({
  module: z.string().describe('The name of the module or feature (e.g., "Invitados", "Catering", "Decoración").'),
  status: z.enum(['Completo', 'Parcial', 'Faltante', 'Atención Requerida']).describe('The status of the module.'),
  details: z.string().describe('A detailed explanation of the finding, including what is missing or what needs attention.'),
  suggestion: z.string().optional().describe('An actionable suggestion for the planner or client.'),
});

export const AnalyzeEventPlanOutputSchema = z.object({
  overallSummary: z.string().describe("A high-level summary of the event plan's completeness."),
  analysisItems: z.array(AnalysisItemSchema).describe('A detailed list of findings for each module of the event plan.'),
});
export type AnalyzeEventPlanOutput = z.infer<typeof AnalyzeEventPlanOutputSchema>;

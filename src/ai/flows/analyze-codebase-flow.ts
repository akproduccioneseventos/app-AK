
'use server';
/**
 * @fileOverview An AI agent for analyzing a codebase against a specification.
 *
 * - analyzeCodebase - A function that handles the codebase analysis process.
 * - AnalyzeCodebaseInput - The input type for the analyzeCodebase function.
 * - AnalyzeCodebaseOutput - The return type for the analyzeCodebase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCodebaseInputSchema = z.object({
  specification: z.string().describe('A detailed functional specification of the desired application state, written in markdown.'),
});
export type AnalyzeCodebaseInput = z.infer<typeof AnalyzeCodebaseInputSchema>;

const AnalysisItemSchema = z.object({
  module: z.string().describe('The name of the module or feature.'),
  status: z.string().describe('A brief summary of its status (e.g., "Completo", "Faltante", "Necesita Mejora").'),
  details: z.string().describe('A detailed explanation of the finding.'),
});

const AnalyzeCodebaseOutputSchema = z.object({
  overallSummary: z.string().describe("A high-level summary of the codebase's health and alignment with the specification."),
  completedModules: z.array(AnalysisItemSchema).describe('A list of modules or features that are correctly implemented according to the specification.'),
  missingModules: z.array(AnalysisItemSchema).describe('A list of modules or features that are mentioned in the specification but are missing from the code.'),
  errorsAndBugs: z.array(AnalysisItemSchema).describe('A list of detected bugs, logical errors, or deviations from best practices.'),
  suggestions: z.array(AnalysisItemSchema).describe('A list of suggestions for improvement, refactoring, or new features not in the spec.'),
});
export type AnalyzeCodebaseOutput = z.infer<typeof AnalyzeCodebaseOutputSchema>;

export async function analyzeCodebase(input: AnalyzeCodebaseInput): Promise<AnalyzeCodebaseOutput> {
  // This feature is temporarily disabled to reduce token count and improve performance.
  throw new Error("La función de análisis de código base está desactivada temporalmente por mantenimiento.");
}

const analyzeCodebaseFlow = ai.defineFlow(
  {
    name: 'analyzeCodebaseFlow',
    inputSchema: AnalyzeCodebaseInputSchema,
    outputSchema: AnalyzeCodebaseOutputSchema,
  },
  async input => {
    // This feature is temporarily disabled.
    throw new Error("La función de análisis de código base está desactivada temporalmente por mantenimiento.");
  }
);

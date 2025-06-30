
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
  status: z.string().describe('A brief summary of its status (e.g., "Complete", "Missing", "Needs Improvement").'),
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
  return analyzeCodebaseFlow(input);
}

// I will manually create a summary of the codebase here. This is a simulation of reading the file system.
// This part will be updated as the app grows.
const codebaseSnapshot = `
- /src/app/page.tsx: Main dashboard, entry point.
- /src/app/actions/*.ts: Server actions for data manipulation (customers, invoices, presupuestos, etc.). Handles all backend logic.
- /src/data/*.json: JSON files acting as a database for all modules.
- /src/types/*.ts: TypeScript type definitions for all major entities (Customer, Invoice, Fiesta, etc.).
- /src/components/ui/*.tsx: Reusable UI components from ShadCN.
- /src/components/*: Custom components for specific features (CRM, Invoices, etc.).
- /src/app/**/page.tsx: Individual pages for each module (e.g., /customers, /invoices, /presupuestos/nuevo).
- /src/ai/flows/*.ts: Genkit AI flows for specific tasks like generating social posts.
- Key Modules Implemented:
  - CRM (Leads, Stages)
  - Customers
  - Invoices
  - Presupuestos (Quotes) with a multi-step creation process.
  - Empleados (Staff) & Roles
  - Proveedores (Suppliers)
  - Fiesta (Event) Planner: The central hub for a single event, with sub-modules for:
    - Configuration
    - Tareas (Tasks)
    - Invitados (Guests)
    - Decoración
    - Catering (Menus)
    - Personal (Staff Assignment)
    - Document Management
    - Costos/Rentabilidad (Costs/Profitability)
    - Página Pública del Evento & Portal del Cliente
    - Galería Social en Vivo
    - Gestión de Redes Sociales
- /src/app/settings/*: Pages for general app configuration.
`;


const prompt = ai.definePrompt({
  name: 'analyzeCodebasePrompt',
  input: {schema: AnalyzeCodebaseInputSchema},
  output: {schema: AnalyzeCodebaseOutputSchema},
  model: 'googleai/gemini-1.5-flash', // Specify a faster and powerful model
  prompt: `You are an expert and exceptionally thorough software architect AI for Firebase Studio. Your primary task is to conduct an exhaustive and rigorous analysis of the provided codebase structure against the user's functional specification. Your analysis must be meticulous, identifying not just major discrepancies but also subtle issues, potential bugs, and deviations from best practices.

**Current Codebase Structure (Snapshot):**
${codebaseSnapshot}

**User's Functional Specification (The "Master Prompt"):**
\`\`\`markdown
{{{specification}}}
\`\`\`

**Your Task:**
Based on the codebase snapshot and the user's specification, provide a detailed analysis. **Your entire output, including all summaries, details, and suggestions, MUST be in Spanish.** Fill out the JSON output object with your findings. Be extremely detailed in your responses.

1.  **Overall Summary:** Give a brief, high-level overview of how well the code matches the spec. Mention the overall code quality and architectural soundness based on the file structure.
2.  **Completed Modules:** List features from the spec that you can confirm are present and correctly implemented. For each, briefly explain *why* you believe it's complete, citing relevant files.
3.  **Missing Modules:** List features from the spec that seem to be completely missing from the codebase. Be specific. If a part of a module is missing, list it here.
4.  **Errors and Bugs:** This is a critical section. Be exhaustive. Identify potential bugs, logical inconsistencies, or deviations from best practices. Examples to look for:
    - Data inconsistencies (e.g., a customer is deleted but their invoices are not).
    - Missing validations (e.g., creating an item with a negative price).
    - Inefficient data handling (e.g., reading entire large JSON files repeatedly instead of filtering).
    - Security concerns (e.g., file path traversal vulnerabilities in API routes).
    - Contradictions between what a file seems to do and what the spec requires.
    For each finding, explain the potential impact.
5.  **Suggestions for Improvement:** Propose concrete improvements, refactoring opportunities, or new features. Think about:
    - Performance optimizations.
    - Code organization and reusability.
    - Better user experience flows.
    - Features that would complement the existing modules, even if not in the spec.

Your analysis must be sharp, objective, and provide actionable feedback. Do not be lenient. The goal is to produce a truly robust and production-ready application.`,
});

const analyzeCodebaseFlow = ai.defineFlow(
  {
    name: 'analyzeCodebaseFlow',
    inputSchema: AnalyzeCodebaseInputSchema,
    outputSchema: AnalyzeCodebaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid analysis. Please try again with a more detailed specification.");
    }
    return output;
  }
);

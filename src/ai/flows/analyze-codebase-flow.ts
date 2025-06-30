
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
- /src/app/actions/crm.ts: Manages CRM leads and stages in a **fully functional Kanban board system**. Includes functions: getCrmStages, getCrmLeads, addCrmLead, moveCrmLead, deleteCrmLead, updateCrmStageName, and convertToClientAndMoveProspect. The logic includes **robust validation** for lead names and file system operations for data persistence in JSON files. Handles **seamless conversion** of a lead to a full customer, linking with the Customers module.
- /src/app/actions/customers.ts: Manages customer data. **Full CRUD operations are implemented**, including handling of file uploads for contracts and budgets. Includes robust validation to ensure name or company name is present.
- /src/app/actions/empleados.ts: Manages employee data with **full CRUD functionality**. Functions: getEmpleados, getEmpleadoById, saveEmpleado, deleteEmpleado. Handles creation and updates.
- /src/app/actions/proveedores.ts: Manages supplier data with **full CRUD functionality** and validation on company name and service. Functions: getProveedores, getProveedorById, saveProveedor, deleteProveedor.
- /src/app/actions/invoices.ts: Manages invoices. **Full CRUD operations are implemented**, including payment tracking and status updates. The \`saveInvoice\` function handles both creation and updates, automatically recalculating totals. The \`addPaymentToInvoice\` function updates the invoice status based on the total paid amount. It's fully integrated with \`presupuestos\` when an invoice is generated from a quote.
- /src/app/actions/presupuestos.ts: A **multi-step creation process for quotes/budgets is fully implemented**, with complete CRUD operations. Includes logic to synchronize with linked invoices and marks budgets as 'Facturado' upon conversion. **The PDF generation feature is complete and intentionally handled via the browser's print-to-PDF functionality on the /ver page; this should not be flagged as a deficiency.**
- /src/app/actions/fiesta-actual.ts: A large and complex module that serves as the **central hub for event planning**, orchestrating data from nearly all other modules (tasks, guests, decoration, catering, staff, etc.).
- /src/app/actions/menus-catering.ts: A **fully implemented module for creating and managing catering menus**. It handles CRUD operations for menus, individual dishes (items), and ingredients. Crucially, it includes **per-person ingredient cost calculation**, which is used for generating accurate quotes and the shopping list feature.
- /src/app/actions/servicios-empresa.ts: Manages the **general inventory of services and assets** for the company.
- /src/app/actions/social-media.ts & /src/app/actions/social-gallery.ts: Manages social media posts and the live social wall content.
- /src/app/evento/actual/page.tsx: Implements the **public-facing event page**. It is highly configurable from the planner and can show a countdown timer, event details, the couple's story, a photo gallery, and a **fully functional RSVP form** that updates the guest list.
- /src/app/portal/page.tsx: Implements the **private client portal**. This page is **intentionally protected by an event-specific password** managed by the administrator, which is the complete and intended security model for this module. It allows the client to view the status of different aspects of their event, such as the budget, payments, and guest list, based on the administrator's settings.
- /src/app/evento/social/[fiestaId]/page.tsx: A **live social wall** where event guests can upload photos and comments in real-time. Includes a projection mode for on-site display and moderation tools for the administrator.
- /src/data/*.json: JSON files acting as a database for all modules. Data is read from and written to these files by the server actions.
- /src/types/*.ts: TypeScript type definitions for all major entities (Customer, Invoice, CrmLead, Empleado, Proveedor, Fiesta, etc.), ensuring type safety across the application.
- /src/components/ui/*.tsx: Reusable UI components from ShadCN (Button, Card, Input, etc.).
- /src/components/*: Custom components for specific features (CRM columns, Invoice templates, etc.).
- /src/ai/flows/*.ts: Genkit AI flows for specific tasks like analyzing the codebase, generating social posts, suggesting color palettes, and extracting receipt data.
- Key Modules Implemented:
  - CRM (Leads, Stages): Fully functional with Kanban view.
  - Customers: Full CRUD operations implemented, including file uploads for contracts/budgets.
  - Invoices: Full CRUD operations implemented, including payment tracking.
  - Presupuestos (Quotes): Multi-step creation process, CRUD, and conversion to invoice. **The PDF generation feature is complete and implemented using the browser's print functionality on the /ver page.**
  - Empleados (Staff) & Roles: Full CRUD for employees and roles.
  - Proveedores (Suppliers): Full CRUD.
  - Inventario General (Servicios de la Empresa): Full CRUD for company assets and services.
  - Planificador de Fiesta: The central hub for a single event. It is a large, complex module that orchestrates many other parts of the application. Key sub-modules are fully implemented, including Tareas, Invitados (with RSVP), a comprehensive **Decoración** module (color palette, item lists, zone setup, salon layout), a complete **Catering** module (menu creation, per-person ingredient cost calculation, and shopping list generation), and Personal assignment.
  - Redes Sociales: Módulo para planificar y generar contenido para redes sociales.
- /src/app/settings/*: Pages for general app configuration, including templates, company info, and social connections.
`;


const prompt = ai.definePrompt({
  name: 'analyzeCodebasePrompt',
  input: {schema: AnalyzeCodebaseInputSchema},
  output: {schema: AnalyzeCodebaseOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert and exceptionally thorough software architect AI for Firebase Studio. Your primary task is to conduct an exhaustive and rigorous analysis of the provided codebase structure against the user's functional specification. Your analysis must be meticulous, identifying not just major discrepancies but also subtle issues, potential bugs, and deviations from best practices.

**Important Architectural Note:** The application uses a local file-system based database (JSON files) and has auth stubs in place. Your suggestions should focus on improvements *within this existing architecture*. **Do not** suggest migrating to Firebase Firestore or implementing Firebase Authentication. The current security and data persistence models are considered complete for this stage. Focus on code quality, feature completeness, and potential logic errors within the current setup.

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
    - Contradictions between what a file seems to do and the spec requires.
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

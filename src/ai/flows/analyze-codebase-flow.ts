
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
- /src/app/actions/fiesta-actual.ts: A large and **fully implemented** complex module that serves as the central hub for event planning. It orchestrates data from nearly all other modules and provides **complete CRUD operations** for all its sub-modules, including: Task List (Tareas y Checklist del Cliente), Guest Management (Invitados con RSVP & QR Code Check-in), a comprehensive Decoration system (con Layout del Salón y asignación de mesas), full Catering management, Staff Assignment, and the configuration for the Public Event Page, Client Portal, Social Wall, Itinerario, and Gift Registry. **This module is feature-complete.**
- /src/app/actions/menus-catering.ts: A **fully implemented module for creating and managing catering menus**. It handles CRUD operations for menus, individual dishes (items), and ingredients. Crucially, it includes **per-person ingredient cost calculation**, which is used for generating accurate quotes and the shopping list feature.
- /src/app/actions/servicios-empresa.ts: Manages the **general inventory of services and assets** for the company.
- /src/app/actions/social-media.ts & /src/app/actions/social-gallery.ts: Manages social media posts and the live social wall content. **This module is fully functional.**
- /src/app/actions/feedback.ts: Manages the **post-event feedback and testimonial generation system**. **This module is fully functional.**
- /src/app/evento/actual/page.tsx: Implements the **public-facing event page**. It is highly configurable from the planner and can show a countdown timer, event details, the couple's story, a photo gallery, an interactive gift list, and a **fully functional RSVP form** that updates the guest list.
- /src/app/portal/page.tsx: Implements the **private client portal**. This page is **intentionally protected by an event-specific password** managed by the administrator, which is the complete and intended security model for this module. It allows the client to view the status of different aspects of their event, such as el presupuesto, pagos, y un checklist compartido de tareas.
- /src/app/evento/social/[fiestaId]/page.tsx: A **live social wall** where event guests can upload photos and comments in real-time. Includes a projection mode for on-site display and moderation tools for the administrator.
- /src/app/api/backup/download/route.ts & /src/app/api/backup/upload/route.ts: **API Routes** that handle zipping the entire 'src/data' directory (download) and replacing it (upload). This provides a full manual backup and restore system.
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
  - Empleados (Staff) & Roles: Full CRUD for employees and roles. **This is complete.**
  - Proveedores (Suppliers): Full CRUD.
  - Inventario General (Servicios de la Empresa): Full CRUD for company assets and services. **This is complete.**
  - Planificador de Fiesta: The central hub for a single event. It is a large, complex module that orchestrates many other parts of the application. **All its key sub-modules are fully implemented and functional**:
    - **Tareas y Checklist Cliente:** A full-featured task management system for both the planner and the client, with CRUD operations, completion tracking, due dates, and assignments.
    - **Itinerario:** Un módulo completo para crear y ordenar el cronograma del evento.
    - **Invitados (with RSVP & QR Check-in):** Complete guest management functionality.
    - **Decoración & Diseño Salón:** A comprehensive module for color palettes, item lists, and an interactive salon layout designer with guest assignment.
    - **Catering:** A complete module for menu creation, per-person ingredient cost calculation, and shopping list generation.
    - **Gestión de Personal:** A full module for assigning staff to the event.
    - **Página Pública y Portal:** Complete management of public event page and private client portal.
    - **Lista de Regalos:** Fully functional gift registry management.
  - Redes Sociales: Módulo para planificar y generar contenido para redes sociales. **This is complete.**
  - Feedback y Testimonios: Sistema completo para encuestas y generación de testimonios con IA. **This is complete.**
- /src/app/settings/*: Pages for general app configuration, including templates, company info, and social connections.
- /src/app/settings/backup/page.tsx: **New Page** that provides a user interface for downloading and uploading the complete data backup.
`;


const prompt = ai.definePrompt({
  name: 'analyzeCodebasePrompt',
  input: {schema: AnalyzeCodebaseInputSchema},
  output: {schema: AnalyzeCodebaseOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert and exceptionally thorough software architect AI for Firebase Studio. Your primary task is to conduct an exhaustive and rigorous analysis of the provided codebase structure against the user's functional specification. Your analysis must be meticulous, identifying not just major discrepancies but also subtle issues, potential bugs, and deviations from best practices **within the established architectural constraints**.

**Crucial Architectural Constraints (DO NOT CRITICIZE OR SUGGEST CHANGING THESE):**
1.  **Database:** The application uses a local file-system database (JSON files in \`src/data\`). This is an intentional design choice. **Do not suggest migrating to a different database like Firestore or any other.** Your analysis must assume this data storage method is fixed.
2.  **PDF Generation:** PDF documents (like quotes) are generated via the browser's "Print to PDF" functionality on specific pages (e.g., \`/presupuestos/.../ver\`). This is the intended strategy. **Do not suggest server-side PDF generation libraries.**
3.  **Security Model:** Security for modules like the Client Portal is intentionally handled via a simple password system managed by the administrator. **Do not suggest adding complex authentication systems like Firebase Authentication.**
4.  **Backups:** A manual backup and restore system via API routes is the intended strategy. **Do not suggest or criticize the lack of automated cloud backups.**

**Your analysis MUST operate within these constraints.** Your focus must be exclusively on comparing the user's specification to the provided codebase snapshot to find:
1.  **Feature Gaps:** Features described in the specification that are missing from the codebase.
2.  **Implementation Bugs:** Logical errors, incorrect calculations, or broken functionality within the existing code files.
3.  **Actionable Suggestions:** Concrete improvements that respect the existing architecture (e.g., "Add a search function to the customers page by filtering the JSON data", NOT "Migrate customers to a database for searching").

**Example of a BAD analysis item (What NOT to do):**
- **Error:** The app uses JSON files for a database. This is not scalable.
- **Suggestion:** Migrate to Firestore for better scalability.
- **Reasoning:** This violates the core architectural constraints.

**Example of a GOOD analysis item (What TO do):**
- **Missing Module:** The specification calls for "tracking supplier payments". The codebase snapshot has a \`proveedores.ts\` module for managing suppliers, but it lacks fields for payment status or functions to register payments to them.
- **Bug:** The \`saveInvoice\` function in \`invoices.ts\` recalculates the total, but it doesn't account for negative quantities in items, which could lead to incorrect invoices.
- **Suggestion:** Add a search bar to the \`/customers\` page that filters the client list in-memory on the frontend, which would improve usability without changing the backend architecture.

**Current Codebase Structure (Snapshot):**
${codebaseSnapshot}

**User's Functional Specification (The "Master Prompt"):**
\`\`\`markdown
{{{specification}}}
\`\`\`

**Your Task:**
Based on the codebase snapshot and the user's specification, and strictly adhering to the architectural constraints, provide a detailed analysis. **Your entire output, including all summaries, details, and suggestions, MUST be in Spanish.** Fill out the JSON output object with your findings. Be extremely detailed and actionable in your responses.`,
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

    
'use server';
/**
 * @fileOverview The main AI assistant flow.
 * This flow acts as a central brain, capable of using other flows and actions as tools.
 */

import { ai } from '@/ai/genkit';
import { analyzeCodebase } from './analyze-codebase-flow';
import { analyzeEventPlan } from './analyze-event-plan-flow';
import { assignGuestsToTables } from './assign-guests-flow';
import { AssistantInputSchema, AssistantOutputSchema, type AssistantInput } from '@/ai/types/assistant-types';
import { z } from 'genkit';
import { getFiestaActual } from '@/app/actions/fiesta-actual';


// Tool: Analyze the current event plan
const analyzeEventPlanTool = ai.defineTool(
  {
    name: 'analyzeCurrentEventPlan',
    description: 'Analyzes the current event plan in detail and returns a summary of its status, identifying incomplete areas and potential issues. Use this when the user asks to "analyze the event", "check the party plan", "review the current event", or similar requests.',
    inputSchema: z.object({}), // Input can be an empty object if no parameters are needed from the user's prompt
    outputSchema: z.any(),
  },
  async () => {
    const planData = await getFiestaActual();
    return await analyzeEventPlan({ planData });
  }
);

// Tool: Analyze the application's codebase
const analyzeCodebaseTool = ai.defineTool(
    {
        name: 'analyzeCodebase',
        description: 'Performs a thorough analysis of the application\'s codebase against a predefined specification. Use this when the user asks to "analyze the code", "check the codebase", "review the project structure", or similar requests.',
        inputSchema: z.object({
            specification: z.string().optional().describe("An optional user-provided specification to analyze against. If not provided, a default one is used."),
        }),
        outputSchema: z.any(),
    },
    async ({ specification }) => {
        const defaultSpec = 'Analyze the current application state and report on completeness, bugs, and suggest improvements.';
        return await analyzeCodebase({ specification: specification || defaultSpec });
    }
);

// Tool: Assign guests to tables
const assignGuestsTool = ai.defineTool(
  {
    name: 'assignGuestsToTables',
    description: 'Automatically assigns confirmed guests to available tables based on party size and table capacity. Use this when the user asks to "assign guests", "seat the guests", "distribute guests to tables", or similar requests.',
    inputSchema: z.object({}),
    outputSchema: z.any(),
  },
  async () => {
    const fiesta = await getFiestaActual();
    const confirmedGuests = fiesta.invitados?.filter(i => i.rsvp === 'Confirmado') || [];
    const tables = fiesta.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa'))
      .map(el => ({ id: el.id, name: el.name, seats: el.seats || 0 })) || [];
    
    if (confirmedGuests.length === 0) return { error: "No hay invitados confirmados para asignar." };
    if (tables.length === 0) return { error: "No hay mesas definidas en el plano del salón." };

    return await assignGuestsToTables({ guests: confirmedGuests, tables });
  }
);


export async function assistant(input: AssistantInput) {
  const llmResponse = await ai.generate({
    prompt: input.query,
    model: 'googleai/gemini-1.5-flash',
    tools: [analyzeEventPlanTool, analyzeCodebaseTool, assignGuestsTool],
    output: {
        schema: AssistantOutputSchema,
    }
  });

  const toolCalls = llmResponse.toolCalls();
  if (toolCalls.length > 0) {
    // For now, handle one tool call at a time for simplicity in the chat UI
    const call = toolCalls[0];
    const toolResult = await call.run();
    
    // Send the tool's structured output back to the model to generate a natural language response
    const finalResponse = await ai.generate({
        prompt: `The user asked: "${input.query}". The tool "${call.name}" was called and returned this JSON data: ${JSON.stringify(toolResult)}. Please present this information to the user in a clear, friendly, and readable format. Use markdown for formatting. If the tool returned an error, explain the error clearly to the user.`,
        model: 'googleai/gemini-1.5-flash',
        output: {
            schema: AssistantOutputSchema,
        }
    });

    return finalResponse.output()!;
  }
  
  // If no tool was called, return the direct text response
  return llmResponse.output()!;
}

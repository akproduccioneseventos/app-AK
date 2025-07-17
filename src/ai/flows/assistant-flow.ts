
'use server';
/**
 * @fileOverview The main AI assistant flow.
 * This flow acts as a central brain, capable of using other flows and actions as tools.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { analyzeCodebase } from './analyze-codebase-flow';
import { analyzeEventPlan } from './analyze-event-plan-flow';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

export const AssistantInputSchema = z.object({
  query: z.string(),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  response: z.string(),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// Tool: Analyze the current event plan
const analyzeEventPlanTool = ai.defineTool(
  {
    name: 'analyzeCurrentEventPlan',
    description: 'Analyzes the current event plan in detail and returns a summary of its status, identifying incomplete areas and potential issues. Use this when the user asks to "analyze the event", "check the party plan", "review the current event", or similar requests.',
    inputSchema: z.object({}),
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


export async function assistant(input: AssistantInput): Promise<AssistantOutput> {
  const llmResponse = await ai.generate({
    prompt: input.query,
    model: 'googleai/gemini-1.5-flash',
    tools: [analyzeEventPlanTool, analyzeCodebaseTool],
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
        prompt: `The user asked: "${input.query}". The tool "${call.name}" was called and returned this JSON data: ${JSON.stringify(toolResult)}. Please present this information to the user in a clear, friendly, and readable format. Use markdown for formatting.`,
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

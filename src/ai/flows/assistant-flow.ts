
'use server';
/**
 * @fileOverview An AI assistant flow.
 *
 * This file contains the basic structure for an AI assistant.
 * It can be expanded with tools and more complex logic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s request to the assistant.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export async function assistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: {schema: AssistantInputSchema},
  output: {schema: AssistantOutputSchema},
  model: 'googleai/gemini-1.5-flash-preview-0514',
  prompt: `You are a helpful assistant. Respond to the user's query.

Query: {{{query}}}`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid response.");
    }
    return output;
  }
);

    
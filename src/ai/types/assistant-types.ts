
import { z } from 'genkit';

export const AssistantInputSchema = z.object({
  query: z.string(),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  response: z.string().describe("The natural language response from the assistant to the user."),
  presupuestoId: z.string().optional().describe("If a quote was successfully created, this will be its ID."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

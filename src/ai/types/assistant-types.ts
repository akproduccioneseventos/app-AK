

import type { Message } from 'genkit';
import { z } from 'genkit';

export const ServiceInfoSchema = z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
});
export type ServiceInfo = z.infer<typeof ServiceInfoSchema>;

export const SelectableServiceSchema = z.object({
    id: z.string(),
    nombre: z.string(),
    precioVenta: z.number().optional(),
    unidad: z.string().optional(),
});
export type SelectableService = z.infer<typeof SelectableServiceSchema>;

export const AssistantInputSchema = z.object({
  query: z.string(),
  history: z.array(z.custom<Message>()).optional(),
  currentServices: z.array(z.object({
      id: z.string(),
      name: z.string(),
  })).optional().describe("A running list of service IDs the user has already selected."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  response: z.string().describe("The natural language response from the assistant to the user."),
  presupuestoId: z.string().optional().nullable().describe("If a quote was successfully created, this will be its ID."),
  selectableServices: z.array(SelectableServiceSchema).optional().describe("A list of services the user can select from."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


import { z } from 'genkit';

const GuestSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  partySize: z.number().optional().default(1),
  rsvp: z.string(), // We will only send confirmed guests
  tableNumber: z.string().optional().nullable(),
  companionNames: z.array(z.string()).optional(),
  checkedIn: z.boolean().optional(),
  checkInTimestamp: z.string().optional(),
  contacto: z.string().optional(),
  notes: z.string().optional(),
});

const TableSchema = z.object({
  id: z.string(),
  name: z.string(),
  seats: z.number(),
});

export const AssignGuestsInputSchema = z.object({
  guests: z.array(GuestSchema).describe("List of confirmed guests to be assigned."),
  tables: z.array(TableSchema).describe("List of available tables with their capacities."),
});
export type AssignGuestsInput = z.infer<typeof AssignGuestsInputSchema>;

export const AssignGuestsOutputSchema = z.object({
  assignments: z.array(GuestSchema).describe("The full list of guests with their 'tableNumber' field updated. Unassigned guests should have a null or empty tableNumber.")
});
export type AssignGuestsOutput = z.infer<typeof AssignGuestsOutputSchema>;

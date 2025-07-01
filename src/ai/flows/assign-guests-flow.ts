
'use server';
/**
 * @fileOverview An AI agent for assigning guests to tables.
 *
 * - assignGuestsToTables - A function that handles the guest assignment process.
 * - AssignGuestsInput - The input type for the assignGuestsToTables function.
 * - AssignGuestsOutput - The return type for the assignGuestsToTables function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Invitado } from '@/types/invitado';

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

const AssignGuestsInputSchema = z.object({
  guests: z.array(GuestSchema).describe("List of confirmed guests to be assigned."),
  tables: z.array(TableSchema).describe("List of available tables with their capacities."),
});
export type AssignGuestsInput = z.infer<typeof AssignGuestsInputSchema>;

const AssignGuestsOutputSchema = z.object({
  assignments: z.array(GuestSchema).describe("The full list of guests with their 'tableNumber' field updated. Unassigned guests should have a null or empty tableNumber.")
});
export type AssignGuestsOutput = z.infer<typeof AssignGuestsOutputSchema>;


export async function assignGuestsToTables(
  input: AssignGuestsInput
): Promise<AssignGuestsOutput> {
  return assignGuestsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assignGuestsPrompt',
  input: { schema: AssignGuestsInputSchema },
  output: { schema: AssignGuestsOutputSchema },
  prompt: `You are an expert event planner specializing in seating arrangements. You will receive a list of guest groups (some might be individuals, others parties of 2, 3, etc.) and a list of available tables with their respective seating capacities.

Your primary goal is to assign every guest to a table, respecting the following rules in order of importance:
1.  **NEVER Exceed Table Capacity:** A table's total assigned guests must not be more than its seating capacity.
2.  **Keep Groups Together:** Guests arriving in a party (partySize > 1) must be seated at the same table. If a group is too large for any single available table, you must not assign them.
3.  **Distribute Evenly:** Try to distribute the guests as evenly as possible among the tables to avoid having some tables overcrowded while others are nearly empty.
4.  **Assign All Possible:** Attempt to assign every guest. If a guest or group cannot be seated (e.g., no table has enough empty seats), leave their 'tableNumber' field as null or an empty string.

You will only receive guests who have confirmed their attendance.

The output MUST be the complete list of all guests you received, with the 'tableNumber' field updated with the name of the table they have been assigned to. Ensure every guest from the input is present in the output.

GUESTS TO ASSIGN:
{{{json guests}}}

AVAILABLE TABLES:
{{{json tables}}}
`,
});

const assignGuestsFlow = ai.defineFlow(
  {
    name: 'assignGuestsFlow',
    inputSchema: AssignGuestsInputSchema,
    outputSchema: AssignGuestsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return valid assignments.");
    }
    // Validate that all input guests are in the output
    const inputGuestIds = new Set(input.guests.map(g => g.id));
    const outputGuestIds = new Set(output.assignments.map(g => g.id));
    if (inputGuestIds.size !== outputGuestIds.size) {
        throw new Error("AI did not return all guests. Some guests were missing from the output.");
    }
    
    return output;
  }
);

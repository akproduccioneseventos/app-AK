'use server';
/**
 * @fileOverview An AI agent for suggesting color palettes for events.
 *
 * - suggestPalette - A function that suggests a color palette based on a theme.
 * - SuggestPaletteInput - The input type for the suggestPalette function.
 * - SuggestPaletteOutput - The return type for the suggestPalette function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ColorPalette as ColorPaletteType } from '@/types/fiesta';

const SuggestPaletteInputSchema = z.object({
  themeDescription: z.string().describe('A description of the event theme, e.g., "boda rústica chic", "fiesta de los 80 neón", "elegante y minimalista".'),
});
export type SuggestPaletteInput = z.infer<typeof SuggestPaletteInputSchema>;

const SuggestPaletteOutputSchema = z.object({
  primary: z.string().describe('The primary color for the palette in hex format (e.g., #FFFFFF).'),
  secondary: z.string().describe('The secondary color for the palette in hex format (e.g., #FFFFFF).'),
  accent: z.string().describe('The accent color for the palette in hex format (e.g., #FFFFFF).'),
});
export type SuggestPaletteOutput = z.infer<typeof SuggestPaletteOutputSchema>;

// Re-exporting the shared type for clarity in components that use this flow
export type ColorPalette = ColorPaletteType;


export async function suggestPalette(
  input: SuggestPaletteInput
): Promise<SuggestPaletteOutput> {
  return suggestPaletteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPalettePrompt',
  input: {schema: SuggestPaletteInputSchema},
  output: {schema: SuggestPaletteOutputSchema},
  prompt: `You are an expert event designer specializing in color theory.
Based on the user's theme description, generate a harmonious color palette consisting of a primary, a secondary, and an accent color.
The colors must be in hexadecimal format (e.g., #FCD3DE).

Theme: {{{themeDescription}}}

Respond ONLY with the JSON object containing the color palette.`,
});

const suggestPaletteFlow = ai.defineFlow(
  {
    name: 'suggestPaletteFlow',
    inputSchema: SuggestPaletteInputSchema,
    outputSchema: SuggestPaletteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

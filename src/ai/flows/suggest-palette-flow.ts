
'use server';
/**
 * @fileOverview An AI agent for suggesting color palettes for events.
 *
 * - suggestPalette - A function that suggests a color palette based on a theme.
 */

import {ai} from '@/ai/genkit';
import { SuggestPaletteInputSchema, type SuggestPaletteInput, SuggestPaletteOutputSchema, type SuggestPaletteOutput } from '@/ai/types/suggest-palette-types';

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

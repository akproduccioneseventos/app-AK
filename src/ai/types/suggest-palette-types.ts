
import { z } from 'genkit';
import type { ColorPalette as ColorPaletteType } from '@/types/fiesta';

export const SuggestPaletteInputSchema = z.object({
  themeDescription: z.string().describe('A description of the event theme, e.g., "boda rústica chic", "fiesta de los 80 neón", "elegante y minimalista".'),
});
export type SuggestPaletteInput = z.infer<typeof SuggestPaletteInputSchema>;

export const SuggestPaletteOutputSchema = z.object({
  primary: z.string().describe('The primary color for the palette in hex format (e.g., #FFFFFF).'),
  secondary: z.string().describe('The secondary color for the palette in hex format (e.g., #FFFFFF).'),
  accent: z.string().describe('The accent color for the palette in hex format (e.g., #FFFFFF).'),
});
export type SuggestPaletteOutput = z.infer<typeof SuggestPaletteOutputSchema>;

// Re-exporting the shared type for clarity in components that use this flow
export type ColorPalette = ColorPaletteType;

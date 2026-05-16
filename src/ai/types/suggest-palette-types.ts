import { z } from 'genkit';

export const SuggestPaletteInputSchema = z.object({
  eventType: z.string().default('evento'),
  mood: z.string().optional(),
  baseColor: z.string().optional(),
  season: z.string().optional(),
});
export type SuggestPaletteInput = z.infer<typeof SuggestPaletteInputSchema>;

export const SuggestedPaletteColorSchema = z.object({
  name: z.string(),
  hex: z.string(),
  usage: z.string(),
});

export const SuggestPaletteOutputSchema = z.object({
  paletteName: z.string(),
  colors: z.array(SuggestedPaletteColorSchema),
  rationale: z.string(),
});
export type SuggestPaletteOutput = z.infer<typeof SuggestPaletteOutputSchema>;

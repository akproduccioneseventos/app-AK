import { z } from 'genkit';

export const GenerateSocialPostInputSchema = z.object({
  eventType: z.string().default('evento'),
  audience: z.string().default('familias y adolescentes'),
  goal: z.string().default('mostrar la experiencia tecnologica de AK Producciones'),
  tone: z.string().default('emocional y premium'),
  eventName: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
});
export type GenerateSocialPostInput = z.infer<typeof GenerateSocialPostInputSchema>;

export const GenerateSocialPostOutputSchema = z.object({
  caption: z.string(),
  shortCaption: z.string(),
  hashtags: z.array(z.string()),
  callToAction: z.string(),
});
export type GenerateSocialPostOutput = z.infer<typeof GenerateSocialPostOutputSchema>;


import { z } from 'genkit';

export const GenerateSocialPostInputSchema = z.object({
  eventName: z.string().optional().describe('The name of the event. Can be omitted for general posts.'),
  eventType: z.string().optional().describe('The type of event (e.g., Boda, Fiesta de 15, Evento Corporativo).'),
  eventDate: z.string().optional().describe('The date of the event.'),
  style: z.enum(['divertida', 'elegante', 'promocional']).describe('The desired tone or style for the post.'),
});
export type GenerateSocialPostInput = z.infer<typeof GenerateSocialPostInputSchema>;

export const GenerateSocialPostOutputSchema = z.object({
  postText: z.string().describe('The generated social media post text, including relevant hashtags.'),
});
export type GenerateSocialPostOutput = z.infer<typeof GenerateSocialPostOutputSchema>;

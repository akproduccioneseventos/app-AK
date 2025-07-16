
import { z } from 'genkit';

export const GenerateTestimonialInputSchema = z.object({
  clientName: z.string().describe('The name of the client providing the feedback.'),
  enjoyedMost: z.string().describe('The part of the service the client enjoyed the most.'),
  toImprove: z.string().describe('What the client suggests for improvement.'),
  generalComments: z.string().optional().describe('Any other general comments from the client.'),
});
export type GenerateTestimonialInput = z.infer<typeof GenerateTestimonialInputSchema>;

export const GenerateTestimonialOutputSchema = z.object({
  testimonialText: z.string().describe('The generated marketing testimonial, written from the client\'s perspective in a warm and professional tone. It should be concise and ready for use on social media or a website.'),
});
export type GenerateTestimonialOutput = z.infer<typeof GenerateTestimonialOutputSchema>;

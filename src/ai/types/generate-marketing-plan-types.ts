import { z } from 'genkit';

// Input Schema: Define the brand identity for the AI
export const MarketingPlanInputSchema = z.object({
  brandName: z.string().describe("The name of the company or brand."),
  targetAudience: z.string().describe("A description of the ideal customer or target audience."),
  keyServices: z.string().describe("A list of the main services offered."),
  toneOfVoice: z.enum(['Profesional y Corporativo', 'Cercano y Amistoso', 'Moderno y Divertido', 'Lujoso y Exclusivo']).describe("The desired tone of voice for the social media posts."),
  mainGoal: z.string().describe("The primary objective of the social media strategy for the week (e.g., 'generar leads', 'hacerme viral', 'construir autoridad en el rubro')."),
});
export type MarketingPlanInput = z.infer<typeof MarketingPlanInputSchema>;

// Output Schema: Define the structure of the weekly content plan
const DailyPostIdeaSchema = z.object({
  day: z.string().describe("Day of the week (e.g., 'Lunes')."),
  theme: z.string().describe("The theme or topic for the day's post (e.g., 'Tip de la Semana', 'Detrás de Escena')."),
  contentIdea: z.string().describe("A concrete idea for the post content, including text and visual suggestions."),
  suggestedHashtags: z.string().describe("A few relevant hashtags for the post."),
});

export const MarketingPlanOutputSchema = z.object({
  weeklySummary: z.string().describe("A brief, high-level summary of the proposed strategy for the week, explaining how it aligns with the mainGoal."),
  dailyPlan: z.array(DailyPostIdeaSchema).describe("A list of content ideas for each day of the week, from Lunes to Domingo."),
});
export type MarketingPlanOutput = z.infer<typeof MarketingPlanOutputSchema>;

// This flow is temporarily disabled to ensure a stable build.
// Re-enable by implementing the full Genkit flow when needed.

export interface GenerateTestimonialInput {
  clientName: string;
  eventType: string;
  eventDate: string;
  rating?: number;
}

export interface GenerateTestimonialOutput {
  testimonial: string;
}

export async function generateTestimonialFlow(
  _input: GenerateTestimonialInput
): Promise<GenerateTestimonialOutput> {
  throw new Error('El módulo de generación de testimonios está temporalmente deshabilitado.');
}

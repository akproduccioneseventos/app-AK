export interface GenerateTestimonialInput {
  clientName: string;
  eventType: string;
  eventDate: string;
  rating?: number;
  highlights?: string[];
}

export interface GenerateTestimonialOutput {
  testimonial: string;
  shortQuote: string;
}

export async function generateTestimonialFlow(input: GenerateTestimonialInput): Promise<GenerateTestimonialOutput> {
  const clientName = input.clientName?.trim() || 'Nuestro cliente';
  const eventType = input.eventType?.trim() || 'evento';
  const ratingText = input.rating ? ` con una valoracion de ${input.rating}/5` : '';
  const highlights = input.highlights?.filter(Boolean).slice(0, 3).join(', ');
  const extra = highlights ? ` Lo que mas se destaco fue: ${highlights}.` : '';

  return {
    testimonial: `${clientName} celebro su ${eventType} el ${input.eventDate}${ratingText}. La experiencia AK combino organizacion, tecnologia y atencion cercana para que la fiesta se viviera simple, linda y sin estres.${extra}`,
    shortQuote: `AK hizo que nuestro ${eventType} se sintiera organizado, moderno y especial.`,
  };
}

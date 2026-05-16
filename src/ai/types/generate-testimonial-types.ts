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


// Phase 3.12: Enhanced NPS Survey
export interface FeedbackSubmission {
  id: string;
  fiestaId: string;
  fiestaNombre: string;
  clientName: string;
  enjoyedMost: string;
  toImprove: string;
  generalComments?: string;
  timestamp: string; // ISO Date String
  // NPS & ratings
  npsScore?: number; // 0-10 NPS score
  ratingComida?: number; // 1-5 star rating
  ratingMusica?: number; // 1-5 star rating
  ratingOrganizacion?: number; // 1-5 star rating
  ratingLugar?: number; // 1-5 star rating
}

export interface Testimonial {
  id: string;
  feedbackId: string; // Link back to the original feedback
  fiestaId: string;
  fiestaNombre: string;
  clientName: string;
  testimonialText: string;
  isApproved: boolean;
  createdAt: string; // ISO Date String
}

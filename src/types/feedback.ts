
export interface FeedbackSubmission {
  id: string;
  fiestaId: string;
  fiestaNombre: string;
  clientName: string;
  enjoyedMost: string;
  toImprove: string;
  generalComments?: string;
  timestamp: string; // ISO Date String
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

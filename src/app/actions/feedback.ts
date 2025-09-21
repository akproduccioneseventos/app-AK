
'use server';

import type { FeedbackSubmission, Testimonial } from '@/types/feedback';
import { readData, writeData } from '@/lib/data-service';

const FEEDBACK_FILE = 'feedback.json';
const TESTIMONIALS_FILE = 'testimonials.json';

const sortFn = (a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime();

export async function saveFeedback(submission: Omit<FeedbackSubmission, 'id' | 'timestamp'>): Promise<{ success: boolean, feedback?: FeedbackSubmission, error?: string }> {
  const allFeedback = await readData<FeedbackSubmission[]>(FEEDBACK_FILE, []);
  const newFeedback: FeedbackSubmission = {
    ...submission,
    id: `fb_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  allFeedback.push(newFeedback);
  await writeData(FEEDBACK_FILE, allFeedback, sortFn);
  return { success: true, feedback: newFeedback };
}

export async function getFeedback(): Promise<FeedbackSubmission[]> {
  return readData<FeedbackSubmission[]>(FEEDBACK_FILE, []);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return readData<Testimonial[]>(TESTIMONIALS_FILE, []);
}

export async function saveTestimonial(testimonialData: Omit<Testimonial, 'id' | 'createdAt' | 'isApproved'>): Promise<{ success: boolean, testimonial?: Testimonial, error?: string }> {
  const allTestimonials = await getTestimonials();
  
  if (allTestimonials.some(t => t.feedbackId === testimonialData.feedbackId)) {
    return { success: false, error: "Ya existe un testimonio para este feedback." };
  }

  const newTestimonial: Testimonial = {
    ...testimonialData,
    id: `testim_${Date.now()}`,
    isApproved: false,
    createdAt: new Date().toISOString(),
  };
  allTestimonials.push(newTestimonial);
  await writeData(TESTIMONIALS_FILE, allTestimonials, sortFn);
  return { success: true, testimonial: newTestimonial };
}

export async function updateTestimonialApproval(testimonialId: string, isApproved: boolean): Promise<{ success: boolean, error?: string }> {
  const allTestimonials = await getTestimonials();
  const index = allTestimonials.findIndex(t => t.id === testimonialId);
  if (index === -1) {
    return { success: false, error: "Testimonio no encontrado." };
  }
  allTestimonials[index].isApproved = isApproved;
  await writeData(TESTIMONIALS_FILE, allTestimonials, sortFn);
  return { success: true };
}

export async function deleteTestimonial(testimonialId: string): Promise<{ success: boolean, error?: string }> {
  let allTestimonials = await getTestimonials();
  const initialLength = allTestimonials.length;
  allTestimonials = allTestimonials.filter(t => t.id !== testimonialId);
  if (allTestimonials.length === initialLength) {
    return { success: false, error: "Testimonio no encontrado para eliminar." };
  }
  await writeData(TESTIMONIALS_FILE, allTestimonials);
  return { success: true };
}

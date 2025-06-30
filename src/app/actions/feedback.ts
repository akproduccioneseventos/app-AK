
'use server';

import type { FeedbackSubmission, Testimonial } from '@/types/feedback';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const FEEDBACK_FILE_PATH = path.join(DATA_DIR, 'feedback.json');
const TESTIMONIALS_FILE_PATH = path.join(DATA_DIR, 'testimonials.json');

async function ensureDataFileExists(filePath: string) {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf-8');
  }
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  await ensureDataFileExists(filePath);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return fileContent.trim() === '' ? [] : JSON.parse(fileContent);
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataFileExists(filePath);
  // Sort by date, most recent first
  const sortedData = data.sort((a: any, b: any) => 
    new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime()
  );
  await fs.writeFile(filePath, JSON.stringify(sortedData, null, 2), 'utf-8');
}

// --- Feedback Actions ---

export async function saveFeedback(submission: Omit<FeedbackSubmission, 'id' | 'timestamp'>): Promise<{ success: boolean, feedback?: FeedbackSubmission, error?: string }> {
  const allFeedback = await readJsonFile<FeedbackSubmission>(FEEDBACK_FILE_PATH);
  const newFeedback: FeedbackSubmission = {
    ...submission,
    id: `fb_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  allFeedback.push(newFeedback);
  await writeJsonFile(FEEDBACK_FILE_PATH, allFeedback);
  return { success: true, feedback: newFeedback };
}

export async function getFeedback(): Promise<FeedbackSubmission[]> {
  return readJsonFile<FeedbackSubmission>(FEEDBACK_FILE_PATH);
}

// --- Testimonial Actions ---

export async function getTestimonials(): Promise<Testimonial[]> {
  return readJsonFile<Testimonial>(TESTIMONIALS_FILE_PATH);
}

export async function saveTestimonial(testimonialData: Omit<Testimonial, 'id' | 'createdAt' | 'isApproved'>): Promise<{ success: boolean, testimonial?: Testimonial, error?: string }> {
  const allTestimonials = await readJsonFile<Testimonial>(TESTIMONIALS_FILE_PATH);
  
  // Check if a testimonial for this feedback already exists to prevent duplicates
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
  await writeJsonFile(TESTIMONIALS_FILE_PATH, allTestimonials);
  return { success: true, testimonial: newTestimonial };
}

export async function updateTestimonialApproval(testimonialId: string, isApproved: boolean): Promise<{ success: boolean, error?: string }> {
  const allTestimonials = await readJsonFile<Testimonial>(TESTIMONIALS_FILE_PATH);
  const index = allTestimonials.findIndex(t => t.id === testimonialId);
  if (index === -1) {
    return { success: false, error: "Testimonio no encontrado." };
  }
  allTestimonials[index].isApproved = isApproved;
  await writeJsonFile(TESTIMONIALS_FILE_PATH, allTestimonials);
  return { success: true };
}

export async function deleteTestimonial(testimonialId: string): Promise<{ success: boolean, error?: string }> {
  let allTestimonials = await readJsonFile<Testimonial>(TESTIMONIALS_FILE_PATH);
  const initialLength = allTestimonials.length;
  allTestimonials = allTestimonials.filter(t => t.id !== testimonialId);
  if (allTestimonials.length === initialLength) {
    return { success: false, error: "Testimonio no encontrado para eliminar." };
  }
  await writeJsonFile(TESTIMONIALS_FILE_PATH, allTestimonials);
  return { success: true };
}

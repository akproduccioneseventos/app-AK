
import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/suggest-palette-flow.ts';
import '@/ai/flows/generate-social-post-flow.ts';
import '@/ai/flows/analyze-codebase-flow.ts';
import '@/ai/flows/generate-testimonial-flow.ts';
import '@/ai/flows/assign-guests-flow.ts';
import '@/ai/flows/analyze-event-plan-flow.ts';
import '@/ai/flows/assistant-flow.ts';


// AI Type definitions - These don't need to be loaded by genkit start
// but importing them here ensures they are part of the dependency graph
// if needed elsewhere, though they are primarily for type safety in the flows.
import '@/ai/types/analyze-event-plan-types';
import '@/ai/types/assign-guests-types';
import '@/ai/types/generate-social-post-types';
import '@/ai/types/generate-testimonial-types';
import '@/ai/types/suggest-palette-types';


import { config } from 'dotenv';
config();

import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/suggest-palette-flow.ts';
import '@/ai/flows/generate-social-post-flow.ts';
import '@/ai/flows/analyze-codebase-flow.ts';


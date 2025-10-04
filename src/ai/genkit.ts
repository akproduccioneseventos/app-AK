
import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // This model will be used by default in all flows unless overridden.
  model: 'gemini-pro', 
});

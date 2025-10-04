import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // This model will be used by default in all flows unless overridden.
  model: googleAI.model('gemini-1.5-flash'), 
});

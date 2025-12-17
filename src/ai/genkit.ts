import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Using Gemini 1.5 Flash for better multi-language support
// This model has excellent free tier limits:
// - 15 requests per minute (RPM)
// - 1 million tokens per minute (TPM)
// - 1,500 requests per day (RPD)
// - Supports multi-language understanding and translation
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash', // Stable model with generous free tier
});

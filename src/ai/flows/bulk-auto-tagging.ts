

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AutoTagEntryOutputSchema, type AutoTagEntryOutput } from './auto-tagging-entries';

// Input Schema
const BulkAutoTagInputSchema = z.object({
    rawText: z.string().describe('Raw unstructured text containing multiple entries'),
});

export type BulkAutoTagInput = z.infer<typeof BulkAutoTagInputSchema>;

// Output Schema
const BulkAutoTagOutputSchema = z.object({
    results: z.array(AutoTagEntryOutputSchema).describe('List of tagged entries in the same order as input'),
});

export type BulkAutoTagOutput = z.infer<typeof BulkAutoTagOutputSchema>;

// Main export function
export async function bulkAutoTagEntries(input: BulkAutoTagInput): Promise<BulkAutoTagOutput> {
    return bulkAutoTagFlow(input);
}

// Genkit Flow for Bulk Processing
const bulkAutoTagFlow = ai.defineFlow(
    {
        name: 'bulkAutoTagFlow',
        inputSchema: BulkAutoTagInputSchema,
        outputSchema: BulkAutoTagOutputSchema,
    },
    async (input) => {
        const maxRetries = 3;
        const baseDelay = 1000;
        const maxDelay = 10000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await ai.generate({
                    model: 'googleai/gemini-2.5-flash',
                    output: { schema: BulkAutoTagOutputSchema },
                    config: {
                        temperature: 0.2, // Lower temp for bulk consistency
                        topP: 0.95,
                        maxOutputTokens: 8192, // Higher token limit for bulk response
                    },
                    prompt: buildBulkPrompt(input.rawText),
                });

                const output = result.output;

                // Basic validation: ensure we return same number of results as inputs (or close enough)
                // If undefined, fallback
                if (!output) throw new Error('No output generated');

                return output;

            } catch (error: any) {
                const isRetryableError =
                    error?.status === 503 ||
                    error?.message?.includes('503') ||
                    error?.message?.includes('overloaded') ||
                    error?.message?.includes('quota') ||
                    error?.message?.includes('resource exhausted') ||
                    error?.message?.includes('timeout');

                if (isRetryableError && attempt < maxRetries - 1) {
                    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay) + Math.random() * 500;
                    console.warn(`⏳ Bulk AI service issue. Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                console.error('Bulk AI generation failed:', error);
                throw error; // Rethrow for actions.ts to handle fallback strategies
            }
        }
        throw new Error('Bulk AI generation failed after retries');
    }
);

function buildBulkPrompt(rawText: string): string {
    const currentDate = new Date().toISOString().split('T')[0];

    return `You are an expert technical project manager and developer alias.
Your task is to parse a raw "brain dump" of text into structured, categorized entries.

# INPUT CONTEXT
The input is a raw text block that may contain:
- Mixed formatting (numbered lists, bullet points, free text).
- Task status indicators (e.g., "- done", "[x]", "fixed").
- Random noise (logs, debug output, headers).

# INPUT TEXT
"""
${rawText}
"""

# INSTRUCTIONS
1. **CRITICAL: SPLIT INTO SEPARATE ITEMS**
   - You MUST split the input text into a list of distinct entries.
   - Separate items based on:
     - Numbered lists (e.g., "1.", "2.")
     - Bullet points (e.g., "-", "*")
     - Newlines separating distinct thoughts
   - **DO NOT** combine multiple tasks into one entry.
   - **DO NOT** create a single "summary" entry.

2. **Filter Noise:**
   - IGNORE system logs, stack traces, and random terminal output.
   - IGNORE section headers unless they are actually tasks.

3. **Analyze Each Item:**
   - **Language:** Detect English, Hindi, Marathi, Hinglish.
   - **Category:** (IDEA, CODE_SNIPPET, LEARNING_NOTE, BUG_FIX, TASK, GENERAL).
   - **Completion Status:** Look for indicators like "- done", "[x]", "fixed", "completed". Set "isCompleted": true.
   - **Tags:** Extract 3-5 keywords.

# CRITICAL REQUIREMENTS
- Return a JSON object with a "results" array.
- "results" should contain ONLY valid, meaningful entries.
- If the input is just noise or empty, return an empty "results" array.
- Today is ${currentDate}.`;
}

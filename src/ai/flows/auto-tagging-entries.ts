'use server';

/**
 * @fileOverview Automatically categorizes user entries into predefined categories.
 *
 * - autoTagEntry - A function that categorizes an entry.
 * - AutoTagEntryInput - The input type for the autoTagEntry function.
 * - AutoTagEntryOutput - The return type for the autoTagEntry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoTagEntryInputSchema = z.string().describe('The content of the entry to be tagged.');
export type AutoTagEntryInput = z.infer<typeof AutoTagEntryInputSchema>;

const AutoTagEntryOutputSchema = z.object({
  category: z
    .enum(['code_snippet', 'learning_note', 'idea', 'bug_fix', 'general'])
    .describe('The predicted category of the entry.'),
});
export type AutoTagEntryOutput = z.infer<typeof AutoTagEntryOutputSchema>;

export async function autoTagEntry(input: AutoTagEntryInput): Promise<AutoTagEntryOutput> {
  return autoTagEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoTagEntryPrompt',
  input: {schema: AutoTagEntryInputSchema},
  output: {schema: AutoTagEntryOutputSchema},
  prompt: `Categorize the following entry into one of these categories: code_snippet, learning_note, idea, bug_fix, general.\n\nEntry: {{{$input}}}`,
});

const autoTagEntryFlow = ai.defineFlow(
  {
    name: 'autoTagEntryFlow',
    inputSchema: AutoTagEntryInputSchema,
    outputSchema: AutoTagEntryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';

/**
 * @fileOverview Enhances search results with AI-generated summaries for improved context.
 *
 * - enhanceSearchWithSummarization - A function that takes search results and enhances them with summaries.
 * - EnhanceSearchWithSummarizationInput - The input type for the enhanceSearchWithSummarization function.
 * - EnhanceSearchWithSummarizationOutput - The return type for the enhanceSearchWithSummarization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceSearchWithSummarizationInputSchema = z.object({
  query: z.string().describe('The natural language search query.'),
  entries: z.array(z.string()).describe('The relevant entries to summarize.'),
});
export type EnhanceSearchWithSummarizationInput = z.infer<
  typeof EnhanceSearchWithSummarizationInputSchema
>;

const EnhanceSearchWithSummarizationOutputSchema = z.array(
  z.object({
    entry: z.string().describe('The original entry.'),
    summary: z.string().describe('The AI-generated summary of the entry.'),
  })
);
export type EnhanceSearchWithSummarizationOutput = z.infer<
  typeof EnhanceSearchWithSummarizationOutputSchema
>;

export async function enhanceSearchWithSummarization(
  input: EnhanceSearchWithSummarizationInput
): Promise<EnhanceSearchWithSummarizationOutput> {
  return enhanceSearchWithSummarizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceSearchWithSummarizationPrompt',
  input: {
    schema: EnhanceSearchWithSummarizationInputSchema,
  },
  output: {schema: EnhanceSearchWithSummarizationOutputSchema},
  prompt: `You are an AI assistant that enhances search results with summaries.

  Given a search query and a list of relevant entries, generate a concise summary for each entry that captures the key information related to the query.

  Query: {{{query}}}

  Entries:
  {{#each entries}}- {{{this}}}
  {{/each}}

  Summaries:
  Output a JSON array where each element contains the original entry and its corresponding summary.
  `,
});

const enhanceSearchWithSummarizationFlow = ai.defineFlow(
  {
    name: 'enhanceSearchWithSummarizationFlow',
    inputSchema: EnhanceSearchWithSummarizationInputSchema,
    outputSchema: EnhanceSearchWithSummarizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

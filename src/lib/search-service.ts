'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Entry, EntryCategory } from '@/lib/types';

// Schema for search query understanding
const SearchQuerySchema = z.object({
    expandedQuery: z.string().describe('Expanded search query with synonyms and related terms'),
    categories: z.array(z.enum(['code_snippet', 'learning_note', 'idea', 'bug_fix', 'general', 'task']))
        .describe('Categories likely relevant to this search'),
    keywords: z.array(z.string()).describe('Key terms to search for'),
    intent: z.enum(['find', 'filter', 'summarize']).describe('What the user wants to do'),
    timeRange: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
    }).optional().describe('Time range if mentioned'),
});

// Understand and expand search query using AI
async function expandSearchQuery(query: string) {
    try {
        const result = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            output: { schema: SearchQuerySchema },
            config: { temperature: 0.3, maxOutputTokens: 512 },
            prompt: `Analyze this search query for a developer's brain dump app and expand it:

Query: "${query}"

Tasks:
1. Expand with synonyms and related technical terms
2. Identify relevant categories (code_snippet, learning_note, idea, bug_fix, task, general)
3. Extract key search terms
4. Determine user intent

Examples:
- "react hooks" → expand to include "useState", "useEffect", "custom hooks", "React"
- "yesterday's ideas" → filter by time + idea category
- "how to fix" → likely bug_fix or learning_note

Return structured analysis.`,
        });

        return result.output;
    } catch (error) {
        console.error('Search expansion failed:', error);
        return null;
    }
}

// Score how well an entry matches the search
function scoreEntry(entry: Entry, keywords: string[], categories: EntryCategory[]): number {
    let score = 0;
    const lowerContent = entry.content.toLowerCase();
    const lowerTranslated = entry.translatedContent?.toLowerCase() || '';
    const lowerTags = entry.tags.map(t => t.toLowerCase());

    // Keyword matching
    for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase();

        // Content match (highest weight)
        if (lowerContent.includes(lowerKeyword)) score += 10;
        if (lowerTranslated.includes(lowerKeyword)) score += 8;

        // Tag match (medium weight)
        if (lowerTags.some(t => t.includes(lowerKeyword))) score += 6;

        // Category match (lower weight)
        if (entry.category.includes(lowerKeyword)) score += 4;
    }

    // Category relevance boost
    if (categories.includes(entry.category)) score += 5;

    // Recency boost (newer = slightly higher)
    const ageInDays = (Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 1) score += 3;
    else if (ageInDays < 7) score += 2;
    else if (ageInDays < 30) score += 1;

    return score;
}

// Main smart search function
export async function smartSearch(
    query: string,
    entries: Entry[]
): Promise<{ results: Entry[]; expandedQuery?: string; intent?: string }> {
    if (!query.trim()) {
        return { results: entries };
    }

    // Quick basic search for short queries
    if (query.length < 3) {
        const lowerQuery = query.toLowerCase();
        const results = entries.filter(e =>
            e.content.toLowerCase().includes(lowerQuery) ||
            e.translatedContent?.toLowerCase().includes(lowerQuery) ||
            e.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
        return { results };
    }

    // AI-powered search expansion
    const expansion = await expandSearchQuery(query);

    if (!expansion) {
        // Fallback to basic search
        const lowerQuery = query.toLowerCase();
        const results = entries.filter(e =>
            e.content.toLowerCase().includes(lowerQuery) ||
            e.translatedContent?.toLowerCase().includes(lowerQuery) ||
            e.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
            e.category.replace(/_/g, ' ').includes(lowerQuery)
        );
        return { results };
    }

    // Score and sort entries
    const scoredEntries = entries.map(entry => ({
        entry,
        score: scoreEntry(entry, expansion.keywords, expansion.categories),
    }));

    // Filter entries with positive scores and sort by score
    const results = scoredEntries
        .filter(e => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(e => e.entry);

    return {
        results,
        expandedQuery: expansion.expandedQuery,
        intent: expansion.intent,
    };
}

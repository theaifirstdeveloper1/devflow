import type { Entry } from '@/lib/types';

/**
 * Client-side local search (no AI, instant)
 * This is a pure utility function for synchronous filtering.
 */
export function localSearch(query: string, entries: Entry[]): Entry[] {
    if (!query.trim()) return entries;

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 1);

    return entries.filter(entry => {
        const searchableContent = [
            entry.content,
            entry.translatedContent || '',
            entry.category.replace(/_/g, ' '),
            ...entry.tags,
            entry.reasoning || '',
        ].join(' ').toLowerCase();

        // All terms must match
        return terms.every(term => searchableContent.includes(term));
    });
}

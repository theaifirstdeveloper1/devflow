'use server';

import { autoTagEntry } from '@/ai/flows/auto-tagging-entries';
import { bulkAutoTagEntries } from '@/ai/flows/bulk-auto-tagging';
import {
    createEntry, updateEntry,
    deleteEntry,
    deleteAllEntries,
} from './entry-service';
import type { Entry } from './types';
import { revalidatePath } from 'next/cache';

/**
 * Add a new entry with AI-powered multi-language categorization
 * 
 * This function:
 * 1. Validates the content
 * 2. Calls the AI to analyze the content (any language)
 * 3. Saves to Firestore
 * 4. Returns the complete entry with all metadata
 * 
 * @param content - The raw content in any language (English, Hindi, Marathi, Hinglish)
 * @returns A complete Entry object with AI-generated metadata
 */
export async function addEntry(content: string): Promise<Entry> {
    if (!content.trim()) {
        throw new Error('Content cannot be empty.');
    }

    try {
        // Step 1: Call the enhanced multi-language AI
        const aiResult = await autoTagEntry(content);


        // Step 2: Build the complete entry with all AI-generated metadata
        const entryData: Omit<Entry, 'id'> = {
            createdAt: new Date(),
            updatedAt: new Date(),

            // Content (original + translation)
            content,
            translatedContent: aiResult.translatedContent,

            // Language detection
            detectedLanguage: aiResult.detectedLanguage,

            // Categorization
            category: aiResult.category,
            tags: aiResult.tags,

            // Task-specific fields (optional)
            dueDate: aiResult.dueDate,
            priority: aiResult.priority,
            actionItems: aiResult.actionItems,

            // Code-specific fields (optional)
            language: aiResult.language,
            codeType: aiResult.codeType,

            // Slang detection
            containsSlang: aiResult.containsSlang,
            slangTerms: aiResult.slangTerms,

            // Metadata
            confidence: aiResult.confidence,
            reasoning: aiResult.reasoning,

            // User (anonymous for now, will add auth later)
            userId: 'anonymous',
            isCompleted: false,
        };

        // Step 3: Save to Firestore
        const savedEntry = await createEntry(entryData);

        console.log(`✅ Entry saved to Firestore: ${savedEntry.id}`);

        revalidatePath('/');
        return savedEntry;

    } catch (error) {
        console.error('Failed to create entry:', error);

        // Check if it's an AI error or Firestore error
        if (error instanceof Error && error.message.includes('Firestore')) {
            // Firestore error - rethrow with context
            throw new Error(`Database error: ${error.message}`);
        }

        // AI error - create entry with fallback categorization
        console.warn('AI categorization failed, using fallback and saving to Firestore');

        const fallbackEntry: Omit<Entry, 'id'> = {
            createdAt: new Date(),
            updatedAt: new Date(),
            content,
            translatedContent: content,
            detectedLanguage: 'en', // Assume English
            category: 'general',
            tags: [],
            containsSlang: false,
            confidence: 0.3,
            reasoning: 'AI processing failed, using fallback categorization',
            userId: 'anonymous',
            isCompleted: false,
        };

        // Still try to save to Firestore
        try {
            const savedEntry = await createEntry(fallbackEntry);
            return savedEntry;
        } catch (firestoreError) {
            // Both AI and Firestore failed - this is critical
            throw new Error('Critical error: Both AI and database operations failed');
        }
    }
}

/**
 * Bulk add entries by splitting text by newlines and processing in batches.
 * 
 * @param rawContent - The raw text containing multiple entries separated by newlines
 * @returns Number of successfully saved entries
 */
export async function bulkAddEntries(rawContent: string): Promise<number> {
    if (!rawContent.trim()) return 0;

    console.log(`🚀 Starting smart bulk import...`);

    try {
        // Send raw content directly to AI for smart parsing
        const aiResults = await bulkAutoTagEntries({ rawText: rawContent });

        // Safety check: ensure we have results
        if (!aiResults.results || aiResults.results.length === 0) {
            console.warn(`⚠️ No results returned from smart bulk import`);
            return 0;
        }

        // Heuristic: If AI returns only 1 item but input was large, it likely failed to split.
        if (aiResults.results.length === 1 && rawContent.length > 200) {
            console.warn(`⚠️ AI returned single item for large input. Assuming failure to split.`);
            throw new Error('AI failed to split large input');
        }

        console.log(`Ai found ${aiResults.results.length} items. Saving...`);

        // Save each entry in parallel
        const savePromises = aiResults.results.map(async (result) => {
            const entryData: Omit<Entry, 'id'> = {
                createdAt: new Date(),
                updatedAt: new Date(),
                content: result.translatedContent || 'Empty Content',
                translatedContent: result.translatedContent,
                detectedLanguage: result.detectedLanguage,
                category: result.category,
                tags: result.tags,
                dueDate: result.dueDate,
                priority: result.priority,
                actionItems: result.actionItems,
                language: result.language,
                codeType: result.codeType,
                containsSlang: result.containsSlang ?? false, // Default if AI doesn't provide
                slangTerms: result.slangTerms,
                confidence: result.confidence ?? 0.8, // Default if AI doesn't provide
                reasoning: result.reasoning,
                userId: 'anonymous',
                isCompleted: result.isCompleted || false,
            };

            // Use original content if translated is same (optional optimization, but strict schema mapping is safer)
            // Actually, let's trust the AI output structure.

            return createEntry(entryData);
        });

        await Promise.all(savePromises);
        console.log(`✅ Smart bulk import completed. Saved ${savePromises.length} entries.`);
        revalidatePath('/');
        return savePromises.length;

    } catch (error) {
        console.error(`❌ Failed to process smart bulk import:`, error);

        // Fallback: Just save the raw blob as one entry? Or split by newlines as a backup?
        // Let's split by newline as a crude backup if smart parsing fails entirely.
        const backupEntries = rawContent.split('\n').map(e => e.trim()).filter(e => e.length > 0);
        console.log(`Falling back to newline splitting for ${backupEntries.length} items...`);

        const fallbackPromises = backupEntries.map(content => createEntry({
            createdAt: new Date(),
            updatedAt: new Date(),
            content,
            translatedContent: content,
            detectedLanguage: 'en',
            category: 'general',
            tags: ['bulk-import-failed'],
            containsSlang: false,
            confidence: 0,
            userId: 'anonymous',
            reasoning: 'Smart import failed, fallback to raw lines',
            isCompleted: false,
        }));

        await Promise.all(fallbackPromises);
        revalidatePath('/');
        return fallbackPromises.length;
    }
}

/**
 * Delete an entry by ID
 */
/**
 * Delete an entry by ID
 */
export async function deleteEntryAction(id: string): Promise<void> {
    try {
        await deleteEntry(id);
        revalidatePath('/');
        console.log(`✅ Entry deleted: ${id}`);
    } catch (error) {
        console.error('Failed to delete entry:', error);
        throw new Error('Failed to delete entry');
    }
}

/**
 * Toggle the completion status of an entry
 */
export async function toggleEntryCompletionAction(id: string, isCompleted: boolean): Promise<void> {
    try {
        await updateEntry(id, { isCompleted });
        revalidatePath('/');
        console.log(`✅ Entry completion toggled: ${id} -> ${isCompleted}`);
    } catch (error) {
        console.error('Failed to toggle completion:', error);
        throw new Error('Failed to toggle completion');
    }
}

export async function clearAllEntriesAction(): Promise<void> {
    try {
        await deleteAllEntries('anonymous');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to clear all entries:', error);
        throw new Error('Failed to clear all entries');
    }
}

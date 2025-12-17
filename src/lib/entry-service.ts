/**
 * Entry Service - CRUD operations for brain dump entries
 * 
 * Handles all Firestore operations for entries:
 * - Create entry
 * - Get entries (with pagination)
 * - Update entry
 * - Delete entry
 * - Real-time listeners
 */

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
    type QueryConstraint,
    type Unsubscribe,
    writeBatch,
} from 'firebase/firestore';
import { db } from './firebase-config';
import type { Entry } from './types';

const COLLECTION_NAME = 'entries';

/**
 * Convert Firestore document to Entry type
 */
function docToEntry(docId: string, data: any): Entry {
    return {
        id: docId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        content: data.content,
        translatedContent: data.translatedContent,
        detectedLanguage: data.detectedLanguage,
        category: data.category,
        tags: data.tags || [],
        dueDate: data.dueDate,
        priority: data.priority,
        actionItems: data.actionItems,
        language: data.language,
        codeType: data.codeType,
        containsSlang: data.containsSlang || false,
        slangTerms: data.slangTerms,
        confidence: data.confidence || 0.5,
        reasoning: data.reasoning,
        userId: data.userId,
        isCompleted: data.isCompleted || false,
    };
}

/**
 * Convert Entry to Firestore document data
 */
function entryToDoc(entry: Omit<Entry, 'id'>) {
    return {
        createdAt: Timestamp.fromDate(entry.createdAt),
        updatedAt: Timestamp.fromDate(entry.updatedAt),
        content: entry.content,
        translatedContent: entry.translatedContent,
        detectedLanguage: entry.detectedLanguage,
        category: entry.category,
        tags: entry.tags,
        dueDate: entry.dueDate || null,
        priority: entry.priority || null,
        actionItems: entry.actionItems || null,
        language: entry.language || null,
        codeType: entry.codeType || null,
        containsSlang: entry.containsSlang,
        slangTerms: entry.slangTerms || null,
        confidence: entry.confidence,
        reasoning: entry.reasoning || null,
        userId: entry.userId || 'anonymous', // For now, until we add auth
        isCompleted: entry.isCompleted || false,
    };
}

/**
 * Create a new entry in Firestore
 */
export async function createEntry(entry: Omit<Entry, 'id'>): Promise<Entry> {
    try {
        const docData = entryToDoc(entry);
        const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

        return {
            id: docRef.id,
            ...entry,
        };
    } catch (error) {
        console.error('Error creating entry:', error);
        throw new Error('Failed to create entry in Firestore');
    }
}

/**
 * Get a single entry by ID
 */
export async function getEntry(entryId: string): Promise<Entry | null> {
    try {
        const docRef = doc(db, COLLECTION_NAME, entryId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return docToEntry(docSnap.id, docSnap.data());
    } catch (error) {
        console.error('Error getting entry:', error);
        throw new Error('Failed to fetch entry from Firestore');
    }
}

/**
 * Get entries with optional filters
 * 
 * @param options - Query options
 * @returns Array of entries
 */
export async function getEntries(options?: {
    userId?: string;
    category?: string;
    limit?: number;
    orderByField?: 'createdAt' | 'updatedAt';
    orderByDirection?: 'asc' | 'desc';
}): Promise<Entry[]> {
    try {
        const constraints: QueryConstraint[] = [];

        // Add userId filter (default to 'anonymous' for now)
        if (options?.userId) {
            constraints.push(where('userId', '==', options.userId));
        } else {
            constraints.push(where('userId', '==', 'anonymous'));
        }

        // Add category filter
        if (options?.category) {
            constraints.push(where('category', '==', options.category));
        }

        // Add ordering
        const orderField = options?.orderByField || 'createdAt';
        const orderDirection = options?.orderByDirection || 'desc';
        constraints.push(orderBy(orderField, orderDirection));

        // Add limit
        if (options?.limit) {
            constraints.push(limit(options.limit));
        }

        const q = query(collection(db, COLLECTION_NAME), ...constraints);
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => docToEntry(doc.id, doc.data()));
    } catch (error) {
        console.error('Error getting entries:', error);
        throw new Error('Failed to fetch entries from Firestore');
    }
}

/**
 * Update an existing entry
 */
export async function updateEntry(
    entryId: string,
    updates: Partial<Omit<Entry, 'id' | 'createdAt'>>
): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, entryId);

        // Always update updatedAt
        const updateData = {
            ...updates,
            updatedAt: Timestamp.now(),
        };

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error('Error updating entry:', error);
        throw new Error('Failed to update entry in Firestore');
    }
}

/**
 * Delete an entry
 */
export async function deleteEntry(entryId: string): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, entryId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting entry:', error);
        throw new Error('Failed to delete entry from Firestore');
    }
}

/**
 * Subscribe to real-time updates for entries
 * 
 * @param callback - Function to call when entries change
 * @param options - Query options (same as getEntries)
 * @returns Unsubscribe function
 */
export function subscribeToEntries(
    callback: (entries: Entry[]) => void,
    options?: Parameters<typeof getEntries>[0]
): Unsubscribe {
    const constraints: QueryConstraint[] = [];

    // Add userId filter
    if (options?.userId) {
        constraints.push(where('userId', '==', options.userId));
    } else {
        constraints.push(where('userId', '==', 'anonymous'));
    }

    // Add category filter
    if (options?.category) {
        constraints.push(where('category', '==', options.category));
    }

    // Add ordering
    const orderField = options?.orderByField || 'createdAt';
    const orderDirection = options?.orderByDirection || 'desc';
    constraints.push(orderBy(orderField, orderDirection));

    // Add limit
    if (options?.limit) {
        constraints.push(limit(options.limit));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    return onSnapshot(
        q,
        (snapshot) => {
            const entries = snapshot.docs.map(doc => docToEntry(doc.id, doc.data()));
            callback(entries);
        },
        (error) => {
            console.error('Error in entries subscription:', error);
        }
    );
}

/**
 * Get entries count by category
 */
export async function getEntriesCountByCategory(userId?: string): Promise<Record<string, number>> {
    try {
        const entries = await getEntries({ userId });

        const counts: Record<string, number> = {
            code_snippet: 0,
            learning_note: 0,
            idea: 0,
            bug_fix: 0,
            general: 0,
            task: 0,
        };

        entries.forEach(entry => {
            counts[entry.category] = (counts[entry.category] || 0) + 1;
        });

        return counts;
    } catch (error) {
        console.error('Error getting category counts:', error);
        return {};
    }
}

/**
 * Delete all entries (dangerous!)
 * Uses batch writes to delete efficiently
 */
export async function deleteAllEntries(userId?: string): Promise<void> {
    try {
        const constraints: QueryConstraint[] = [];
        if (userId) {
            constraints.push(where('userId', '==', userId));
        } else {
            constraints.push(where('userId', '==', 'anonymous'));
        }

        const q = query(collection(db, COLLECTION_NAME), ...constraints);
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        // Firestore batch limit is 500
        const batchSize = 500;
        const chunks = [];

        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            chunks.push(snapshot.docs.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

    } catch (error) {
        console.error('Error deleting all entries:', error);
        throw new Error('Failed to delete all entries');
    }
}

// Language types
export type DetectedLanguage = 'en' | 'hi' | 'mr' | 'hinglish' | 'mixed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type CodeType = 'function' | 'class' | 'snippet' | 'config' | 'other';

// Entry categories - added 'task' for todos
export type EntryCategory =
  | 'code_snippet'
  | 'learning_note'
  | 'idea'
  | 'bug_fix'
  | 'general'
  | 'task';

// Slang term detected by AI
export interface SlangTerm {
  original: string;     // Original slang term (e.g., "kar diya")
  meaning: string;      // English meaning (e.g., "completed")
  confidence: number;   // AI confidence score (0-1)
}

// Main entry interface
export interface Entry {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Content
  content: string;                      // Original content (any language)
  translatedContent?: string;           // English translation if needed

  // Language & Detection
  detectedLanguage: DetectedLanguage;   // Which language was detected

  // Categorization
  category: EntryCategory;
  tags: string[];                       // Extracted tags

  // Task-specific fields (optional)
  dueDate?: string;                     // ISO date string (YYYY-MM-DD)
  priority?: Priority;
  actionItems?: string[];               // Extracted action items

  // Code-specific fields (optional)
  language?: string;                    // Programming language (e.g., 'javascript')
  codeType?: CodeType;

  // Slang detection
  containsSlang: boolean;
  slangTerms?: SlangTerm[];

  // Metadata
  confidence: number;                   // AI confidence in categorization
  reasoning?: string;                   // AI's reasoning (for debugging)

  // User info (for multi-user support later)
  userId?: string;

  // Completion status
  isCompleted: boolean;
}

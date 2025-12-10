export type EntryCategory = 'code_snippet' | 'learning_note' | 'idea' | 'bug_fix' | 'general';

export interface Entry {
  id: string;
  createdAt: Date;
  content: string;
  category: EntryCategory;
}

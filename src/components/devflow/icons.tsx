import { Code2, BookOpen, Lightbulb, Bug, Inbox, CheckSquare, type LucideProps } from 'lucide-react';
import type { EntryCategory } from '@/lib/types';

export const categoryIcons: Record<EntryCategory, React.ComponentType<LucideProps>> = {
  code_snippet: Code2,
  learning_note: BookOpen,
  idea: Lightbulb,
  bug_fix: Bug,
  general: Inbox,
  task: CheckSquare,
};

export const CategoryIcon = ({ category, ...props }: { category: EntryCategory } & LucideProps) => {
  const Icon = categoryIcons[category];
  return Icon ? <Icon {...props} /> : null;
};

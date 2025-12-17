"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Entry, Priority } from "@/lib/types";
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { CategoryIcon } from './icons';
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Globe,
  Calendar,
  Flag,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Languages,
  Clock,
  Zap,
  AlertTriangle,
  MessageCircle,
  Trash2,
  Loader2,
  CheckCircle,
  Circle
} from 'lucide-react';
import { deleteEntryAction, toggleEntryCompletionAction } from '@/lib/actions';
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface EntryCardProps {
  entry: Entry;
  onRefresh?: () => void;
  onDeleteEntry?: (entryId: string) => void;
  onToggleCompletion?: (entryId: string, isCompleted: boolean) => void;
}

// Language display config
const languageConfig: Record<string, { label: string; flag: string }> = {
  'en': { label: 'English', flag: '🇬🇧' },
  'hi': { label: 'Hindi', flag: '🇮🇳' },
  'mr': { label: 'Marathi', flag: '🇮🇳' },
  'hinglish': { label: 'Hinglish', flag: '🇮🇳' },
  'mixed': { label: 'Mixed', flag: '🌐' },
};

// Priority display config
const priorityConfig: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  'urgent': { label: 'Urgent', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: <Zap className="h-3 w-3" /> },
  'high': { label: 'High', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
  'medium': { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: <Flag className="h-3 w-3" /> },
  'low': { label: 'Low', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: <Clock className="h-3 w-3" /> },
};

// Category color config
const categoryColors: Record<string, string> = {
  'code_snippet': 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400',
  'learning_note': 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400',
  'idea': 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400',
  'bug_fix': 'bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-500/20 dark:text-red-400',
  'task': 'bg-green-500/10 text-green-600 border-green-500/30 dark:bg-green-500/20 dark:text-green-400',
  'general': 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400',
};

export function EntryCard({ entry, onRefresh, onDeleteEntry, onToggleCompletion }: EntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const timeAgo = useMemo(() =>
    formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }),
    [entry.createdAt]
  );

  const isCode = entry.category === 'code_snippet';
  const hasTranslation = entry.translatedContent && entry.translatedContent !== entry.content;
  const langConfig = languageConfig[entry.detectedLanguage] || languageConfig['en'];
  const hasTags = entry.tags && entry.tags.length > 0;
  const hasDueDate = entry.dueDate;
  const hasPriority = entry.priority;
  const hasSlang = entry.containsSlang && entry.slangTerms && entry.slangTerms.length > 0;
  const hasActionItems = entry.actionItems && entry.actionItems.length > 0;

  // Confidence indicator
  const confidenceLabel = entry.confidence >= 0.8 ? 'High' : entry.confidence >= 0.5 ? 'Medium' : 'Low';
  const confidenceColor = entry.confidence >= 0.8 ? 'text-green-500' : entry.confidence >= 0.5 ? 'text-yellow-500' : 'text-red-500';

  return (
    <TooltipProvider delayDuration={300}>
      <Card className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-xl",
        "bg-card border-border/50 hover:border-border",
        "group relative",
        entry.isCompleted && "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
      )}>
        {/* Priority indicator bar */}
        {hasPriority && entry.priority && (
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            entry.priority === 'urgent' && "bg-red-500",
            entry.priority === 'high' && "bg-orange-500",
            entry.priority === 'medium' && "bg-yellow-500",
            entry.priority === 'low' && "bg-gray-400",
          )} />
        )}

        {/* Header with category and metadata */}
        <CardHeader className="p-4 pb-2 space-y-0">
          <div className="flex items-center justify-between gap-2">
            {/* Category Badge */}
            <Badge
              variant="outline"
              className={cn(
                "capitalize font-medium text-xs px-2 py-0.5",
                categoryColors[entry.category] || categoryColors['general']
              )}
            >
              <CategoryIcon category={entry.category} className="mr-1 h-3 w-3" />
              {entry.category.replace(/_/g, ' ')}
            </Badge>

            {/* Right side metadata */}
            <div className="flex items-center gap-2">
              {/* Language indicator */}
              {entry.detectedLanguage !== 'en' && (
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-sm">{langConfig.flag}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Detected: {langConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Priority Badge */}
              {hasPriority && entry.priority && (
                <Badge
                  variant="outline"
                  className={cn("text-xs px-1.5 py-0", priorityConfig[entry.priority].color)}
                >
                  {priorityConfig[entry.priority].icon}
                  <span className="ml-1">{priorityConfig[entry.priority].label}</span>
                </Badge>
              )}

              {/* Due Date */}
              {hasDueDate && entry.dueDate && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/30">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(parseISO(entry.dueDate), 'MMM d')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Due: {format(parseISO(entry.dueDate), 'EEEE, MMMM d, yyyy')}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Slang indicator */}
              {hasSlang && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-pink-500/10 text-pink-600 border-pink-500/30">
                      <MessageCircle className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Slang Detected:</p>
                    <ul className="text-xs space-y-1">
                      {entry.slangTerms?.slice(0, 3).map((term, i) => (
                        <li key={i}>
                          <span className="font-mono">{term.original}</span>
                          <span className="text-muted-foreground"> → {term.meaning}</span>
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Main Content */}
        <CardContent className="p-4 pt-2">
          {/* Main Content */}
          <div className={cn("prose prose-sm dark:prose-invert max-w-none mb-4", entry.isCompleted && "line-through text-muted-foreground")}>
            {isCode ? (
              <div className="bg-muted/50 p-3 rounded-lg overflow-x-auto border border-border/50">
                <pre><code className="font-mono text-sm text-foreground">{entry.content}</code></pre>
                {entry.language && (
                  <span className="mt-2 inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {entry.language}
                  </span>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            )}
          </div>

          {/* Translation (if different from original) */}
          {hasTranslation && (
            <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-1.5">
                <Languages className="h-3 w-3" />
                <span className="font-medium">Translation</span>
              </div>
              <p className={cn("text-sm text-blue-900 dark:text-blue-100", entry.isCompleted && "line-through text-muted-foreground")}>
                {entry.translatedContent}
              </p>
            </div>
          )}

          {/* Action Items (for tasks) */}
          {hasActionItems && (
            <div className="mt-3 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1.5">
                Action Items
              </div>
              <ul className="text-sm text-green-900 dark:text-green-100 space-y-1">
                {entry.actionItems?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {hasTags && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entry.tags.slice(0, isExpanded ? undefined : 4).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
              {!isExpanded && entry.tags.length > 4 && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  +{entry.tags.length - 4} more
                </button>
              )}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-muted-foreground border-t border-border/30 bg-muted/30">
          <div className="flex items-center gap-3">
            <time dateTime={new Date(entry.createdAt).toISOString()} className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </time>

            {/* Confidence indicator (subtle) */}
            <Tooltip>
              <TooltipTrigger>
                <span className={cn("flex items-center gap-1", confidenceColor)}>
                  <Sparkles className="h-3 w-3" />
                  <span className="opacity-75">{Math.round(entry.confidence * 100)}%</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI Confidence: {confidenceLabel}</p>
                {entry.reasoning && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">{entry.reasoning}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Expand/Collapse for long entries */}
          {(entry.tags.length > 4 || (entry.reasoning && entry.reasoning.length > 50)) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mr-auto"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  More
                </>
              )}
            </button>
          )}

          {/* Toggle Done Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newIsCompleted = !entry.isCompleted;

              // Optimistic update
              onToggleCompletion?.(entry.id, newIsCompleted);

              // Server action in background
              startTransition(async () => {
                try {
                  await toggleEntryCompletionAction(entry.id, newIsCompleted);
                } catch (error) {
                  console.error('Failed to toggle completion:', error);
                  // Revert on error
                  onToggleCompletion?.(entry.id, !newIsCompleted);
                  // Refetch to ensure consistency
                  onRefresh?.();
                }
              });
            }}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1 transition-colors ml-auto mr-2",
              entry.isCompleted ? "text-green-500 hover:text-muted-foreground" : "text-muted-foreground hover:text-green-500"
            )}
            title={entry.isCompleted ? "Mark as Undone" : "Mark as Done"}
          >
            {entry.isCompleted ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this entry?')) {
                // Optimistic delete
                onDeleteEntry?.(entry.id);

                // Server action in background
                startTransition(async () => {
                  try {
                    await deleteEntryAction(entry.id);
                  } catch (error) {
                    console.error('Failed to delete entry:', error);
                    // Refetch on error to restore
                    onRefresh?.();
                  }
                });
              }
            }}
            disabled={isPending}
            className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
            aria-label="Delete Entry"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </button>
        </CardFooter>
      </Card>
    </TooltipProvider >
  );
}

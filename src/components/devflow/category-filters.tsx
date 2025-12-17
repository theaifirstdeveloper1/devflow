"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EntryCategory } from "@/lib/types";
import {
    Code2,
    BookOpen,
    Lightbulb,
    Bug,
    CheckSquare,
    Layers,
    Sparkles
} from "lucide-react";

// Category configuration with icons and colors
export const categoryConfig: Record<EntryCategory | 'all', {
    label: string;
    icon: React.ReactNode;
    color: string;
    activeColor: string;
}> = {
    'all': {
        label: 'All',
        icon: <Layers className="h-3.5 w-3.5" />,
        color: 'bg-muted hover:bg-muted/80 text-muted-foreground',
        activeColor: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    'idea': {
        label: 'Ideas',
        icon: <Lightbulb className="h-3.5 w-3.5" />,
        color: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
        activeColor: 'bg-amber-500 text-white hover:bg-amber-600',
    },
    'task': {
        label: 'Tasks',
        icon: <CheckSquare className="h-3.5 w-3.5" />,
        color: 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
        activeColor: 'bg-green-500 text-white hover:bg-green-600',
    },
    'code_snippet': {
        label: 'Code',
        icon: <Code2 className="h-3.5 w-3.5" />,
        color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
        activeColor: 'bg-purple-500 text-white hover:bg-purple-600',
    },
    'learning_note': {
        label: 'Learning',
        icon: <BookOpen className="h-3.5 w-3.5" />,
        color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
        activeColor: 'bg-blue-500 text-white hover:bg-blue-600',
    },
    'bug_fix': {
        label: 'Bug Fix',
        icon: <Bug className="h-3.5 w-3.5" />,
        color: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
        activeColor: 'bg-red-500 text-white hover:bg-red-600',
    },
    'general': {
        label: 'General',
        icon: <Sparkles className="h-3.5 w-3.5" />,
        color: 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
        activeColor: 'bg-gray-500 text-white hover:bg-gray-600',
    },
};

interface CategoryFiltersProps {
    selectedCategory: EntryCategory | 'all';
    onCategoryChange: (category: EntryCategory | 'all') => void;
    entryCounts?: Record<EntryCategory | 'all', number>;
}

export function CategoryFilters({
    selectedCategory,
    onCategoryChange,
    entryCounts
}: CategoryFiltersProps) {
    const categories: (EntryCategory | 'all')[] = [
        'all',
        'idea',
        'task',
        'code_snippet',
        'learning_note',
        'bug_fix',
        'general',
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
                const config = categoryConfig[category];
                const isActive = selectedCategory === category;
                const count = entryCounts?.[category];

                return (
                    <button
                        key={category}
                        onClick={() => onCategoryChange(category)}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                            "border focus:outline-none focus:ring-2 focus:ring-primary/50",
                            isActive ? config.activeColor : config.color,
                            isActive && "shadow-sm"
                        )}
                    >
                        {config.icon}
                        <span>{config.label}</span>
                        {count !== undefined && count > 0 && (
                            <span className={cn(
                                "ml-1 px-1.5 py-0.5 text-xs rounded-full",
                                isActive
                                    ? "bg-white/20 text-inherit"
                                    : "bg-background text-muted-foreground"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

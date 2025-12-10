"use client";

import { useRef, useTransition, type KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CornerDownLeft, Loader2 } from 'lucide-react';
import { addEntry } from '@/lib/actions';
import type { Entry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface QuickCaptureProps {
  onEntryAdded: (entry: Entry) => void;
}

export function QuickCapture({ onEntryAdded }: QuickCaptureProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    const content = textAreaRef.current?.value;
    if (!content || !content.trim() || isPending) return;

    startTransition(async () => {
      try {
        const newEntry = await addEntry(content);
        onEntryAdded(newEntry);
        if (formRef.current) {
          formRef.current.reset();
        }
        textAreaRef.current?.focus();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save your entry. Please try again.",
          variant: "destructive",
        });
        console.error(error);
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form ref={formRef} className="relative" onSubmit={(e) => e.preventDefault()}>
      <Textarea
        ref={textAreaRef}
        name="content"
        rows={5}
        className="w-full resize-none bg-card p-4 pr-28 shadow-md text-base border-border focus-visible:ring-primary"
        placeholder="Dump your thoughts, code, or ideas here..."
        onKeyDown={handleKeyDown}
        disabled={isPending}
      />
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        <p className="text-xs text-muted-foreground hidden sm:block">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>Enter
          </kbd>
        </p>
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={isPending}
          aria-label="Save Entry"
        >
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <CornerDownLeft />
          )}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useRef, useTransition, useState, type KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CornerDownLeft, Loader2, Layers, Zap } from 'lucide-react';
import { addEntry, bulkAddEntries } from '@/lib/actions';
import type { Entry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { VoiceInputButton } from './voice-input-button';

interface QuickCaptureProps {
  onEntryAdded: (entry: Entry) => void;
}

export function QuickCapture({ onEntryAdded }: QuickCaptureProps) {
  const [isPending, startTransition] = useTransition();
  const [isBulkMode, setIsBulkMode] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    const content = textAreaRef.current?.value;
    if (!content || !content.trim() || isPending) return;

    startTransition(async () => {
      try {
        if (isBulkMode) {
          const count = await bulkAddEntries(content);
          toast({
            title: "Bulk Import Complete",
            description: `Successfully processed and tagged ${count} entries.`,
          });
          // For bulk, we might not want to return a single entry to onEntryAdded immediately
          // or we could fetch latest. For now, let's just reset.
          // Ideally onEntryAdded should support array or we just refresh context.
          // Since onEntryAdded takes one Entry, and we added many, we might simply NOT call it 
          // and let the parent re-fetch or rely on real-time subscription if active.
          // But to be safe and trigger some update, let's pass a dummy or last one if possible?
          // Actually, passing nothing might be better if the parent just appends. 
          // Let's assume parent relies on subscription or we need to refresh.
          // Given the prop signature, we can't pass array.
          // Let's just reset form.
        } else {
          const newEntry = await addEntry(content);
          onEntryAdded(newEntry);
        }

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
      <div className="absolute top-[-30px] right-0 flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="bulk-mode"
            checked={isBulkMode}
            onCheckedChange={setIsBulkMode}
          />
          <Label htmlFor="bulk-mode" className="text-xs font-medium text-muted-foreground flex items-center gap-1 cursor-pointer">
            {isBulkMode ? <Layers className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {isBulkMode ? 'Bulk Mode' : 'Quick Mode'}
          </Label>
        </div>
      </div>

      <Textarea
        ref={textAreaRef}
        name="content"
        rows={isBulkMode ? 10 : 5}
        className="w-full resize-none bg-card p-4 pr-28 shadow-md text-base border-border focus-visible:ring-primary transition-all duration-200"
        placeholder={isBulkMode
          ? "Paste multiple lines here...\nEach line will be treated as a separate entry.\n\nExample:\nBuy milk\nFix bug in navigation\nconsole.log('debug')"
          : "Dump your thoughts, code, or ideas here..."
        }
        onKeyDown={handleKeyDown}
        disabled={isPending}
      />
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        {/* Voice Input Button */}
        <VoiceInputButton
          onTranscript={(text) => {
            if (textAreaRef.current) {
              const currentValue = textAreaRef.current.value;
              const separator = isBulkMode ? '\n' : ' ';
              const newValue = currentValue
                ? `${currentValue}${separator}${text}`
                : text;
              textAreaRef.current.value = newValue;
              textAreaRef.current.focus();
            }
          }}
          className="relative"
        />

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

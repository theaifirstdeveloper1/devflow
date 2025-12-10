"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Entry } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { CategoryIcon } from './icons';
import { useMemo } from "react";

interface EntryCardProps {
  entry: Entry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const timeAgo = useMemo(() => formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }), [entry.createdAt]);

  const isCode = entry.category === 'code_snippet';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg bg-card">
      <CardContent className="p-4">
        {isCode ? (
          <div className="bg-muted/50 p-3 rounded-md overflow-x-auto">
            <pre><code className="font-code text-sm text-foreground">{entry.content}</code></pre>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">{entry.content}</p>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-3 flex justify-between items-center text-xs text-muted-foreground">
        <time dateTime={new Date(entry.createdAt).toISOString()}>{timeAgo}</time>
        <Badge variant="outline" className="capitalize bg-card">
          <CategoryIcon category={entry.category} className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          {entry.category.replace(/_/g, ' ')}
        </Badge>
      </CardFooter>
    </Card>
  );
}

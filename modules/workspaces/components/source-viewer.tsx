"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen02Icon,
  Cancel01Icon,
  ExternalLinkIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Source } from "./source-panel";

type SourceViewerProps = {
  source: Source | null;
  excerpt?: string | null;
  onClose: () => void;
};

export default function SourceViewer({
  source,
  excerpt = null,
  onClose,
}: SourceViewerProps) {
  if (!source) {
    return (
      <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
        <div className="flex size-6 items-center justify-center bg-muted text-muted-foreground">
          <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium">Source viewer</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Select a source or a citation to read it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-56 shrink-0 flex-col border-b bg-background">
      <div className="flex h-10 shrink-0 items-center gap-3 px-4">
        <div className="flex size-6 items-center justify-center bg-muted text-muted-foreground">
          <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{source.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {excerpt ? "Cited excerpt" : "Extracted text"}
          </p>
        </div>
        {source.originalUrl ? (
          <Button
            size="icon-xs"
            variant="ghost"
            nativeButton={false}
            render={
              <a href={source.originalUrl} target="_blank" rel="noreferrer" />
            }
          >
            <HugeiconsIcon icon={ExternalLinkIcon} strokeWidth={2} />
            <span className="sr-only">Open original source</span>
          </Button>
        ) : null}
        <Button size="icon-xs" variant="ghost" type="button" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          <span className="sr-only">Close source viewer</span>
        </Button>
      </div>
      <ScrollArea className="h-40 border-t">
        <SourceText text={source.extractedText || "No extracted text yet."} excerpt={excerpt} />
      </ScrollArea>
    </div>
  );
}

function SourceText({ text, excerpt }: { text: string; excerpt: string | null }) {
  if (!excerpt) {
    return (
      <p className="whitespace-pre-wrap px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {text}
      </p>
    );
  }

  const index = text.indexOf(excerpt);
  if (index === -1) {
    return (
      <div className="space-y-3 py-3">
        <div className="bg-muted/50 px-4 py-2">
          <p className="text-[11px] font-medium">Cited excerpt</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">{excerpt}</p>
        </div>
        <p className="whitespace-pre-wrap px-4 text-xs leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {text.slice(0, index)}
      <mark className="bg-primary/20 text-foreground">{excerpt}</mark>
      {text.slice(index + excerpt.length)}
    </p>
  );
}

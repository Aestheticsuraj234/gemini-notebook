"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Source } from "./source-panel";

type SourceViewerProps = {
  source: Source | null;
  onClose: () => void;
};

export default function SourceViewer({ source, onClose }: SourceViewerProps) {
  if (!source) {
    return (
      <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
        <div className="flex size-6 items-center justify-center bg-muted text-muted-foreground">
          <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium">Source viewer</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Select a source to read its extracted text.
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
          <p className="truncate text-[11px] text-muted-foreground">Extracted text</p>
        </div>
        <Button size="icon-xs" variant="ghost" type="button" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          <span className="sr-only">Close source viewer</span>
        </Button>
      </div>
      <ScrollArea className="h-40 border-t">
        <p className="whitespace-pre-wrap px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {source.extractedText || "No extracted text yet."}
        </p>
      </ScrollArea>
    </div>
  );
}

"use client";

import type { Route } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  BookOpen02Icon,
  ExternalLinkIcon,
} from "@hugeicons/core-free-icons";

import MarkdownContent from "@/components/markdown-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Source } from "./source-panel";

type SourcePreviewProps = {
  workspaceId: string;
  workspaceTitle: string;
  source: Source;
  excerpt?: string | null;
};

export default function SourcePreview({
  workspaceId,
  workspaceTitle,
  source,
  excerpt = null,
}: SourcePreviewProps) {
  const text = source.extractedText.trim();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Button
          size="icon-xs"
          variant="ghost"
          nativeButton={false}
          render={<Link href={`/workspaces/${workspaceId}` as Route} />}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          <span className="sr-only">Back to {workspaceTitle}</span>
        </Button>
        <div className="flex size-7 shrink-0 items-center justify-center bg-muted text-muted-foreground">
          <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{source.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {workspaceTitle}
            {" · "}
            {sourceKindLabel(source)}
          </p>
        </div>
        <SourceStatusBadge source={source} />
        {source.originalUrl ? (
          <Button
            size="icon-xs"
            variant="ghost"
            nativeButton={false}
            render={<a href={source.originalUrl} target="_blank" rel="noreferrer" />}
          >
            <HugeiconsIcon icon={ExternalLinkIcon} strokeWidth={2} />
            <span className="sr-only">Open original source</span>
          </Button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-6">
          {excerpt ? (
            <div className="space-y-1 bg-primary/10 px-4 py-3">
              <p className="text-[11px] font-medium tracking-wide uppercase">Cited excerpt</p>
              <p className="text-sm leading-relaxed">{excerpt}</p>
            </div>
          ) : null}

          {source.status === "FAILED" ? (
            <p className="text-sm text-destructive">
              {source.errorMessage ?? "This source could not be processed."}
            </p>
          ) : source.status === "PROCESSING" ? (
            <p className="text-sm text-muted-foreground">This source is still being indexed.</p>
          ) : text ? (
            <MarkdownContent>{text}</MarkdownContent>
          ) : (
            <p className="text-sm text-muted-foreground">No extracted text yet.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function sourceKindLabel(source: Source) {
  if (source.kind === "WEBSITE") {
    if (source.originalUrl) {
      try {
        return new URL(source.originalUrl).hostname.replace(/^www\./, "");
      } catch {
        return "Website";
      }
    }
    return "Website";
  }

  if (source.kind === "FILE") {
    return "File";
  }

  return "Text";
}

function SourceStatusBadge({ source }: { source: Source }) {
  if (source.status === "READY") {
    return <Badge variant="success">Ready</Badge>;
  }

  if (source.status === "FAILED") {
    return <Badge variant="destructive">Failed</Badge>;
  }

  return <Badge variant="outline">Indexing</Badge>;
}

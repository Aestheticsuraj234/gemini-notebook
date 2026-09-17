"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpenTextIcon } from "@hugeicons/core-free-icons";

import type { ArtifactItem } from "@/lib/artifact-types";

import MarkdownContent from "@/components/markdown-content";
import SourceRefChip from "./source-ref-chip";

type SummaryRendererProps = {
  artifact: Extract<ArtifactItem, { type: "SUMMARY" }>;
  onOpenSource: (sourceId: string) => void;
};

export default function SummaryRenderer({ artifact, onOpenSource }: SummaryRendererProps) {
  const overview = artifact.content.overview ?? "";
  const keyPoints = artifact.content.keyPoints ?? [];

  if (!overview && keyPoints.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={BookOpenTextIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No summary content</EmptyTitle>
          <EmptyDescription>This summary did not include any grounded points.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-5">
      {overview ? <MarkdownContent className="text-sm">{overview}</MarkdownContent> : null}

      {keyPoints.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Key points
          </p>
          <ul className="space-y-2">
            {keyPoints.map((point, index) => (
              <li key={`${point.sourceRef}-${index}`} className="flex gap-3 bg-muted/30 px-3 py-2.5">
                <span className="mt-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <MarkdownContent className="text-xs">{point.text}</MarkdownContent>
                  <SourceRefChip
                    sourceRef={point.sourceRef}
                    sourceTitle={point.sourceTitle}
                    sourceIds={artifact.sourceIds}
                    onOpenSource={onOpenSource}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

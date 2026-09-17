"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Note01Icon } from "@hugeicons/core-free-icons";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ArtifactItem } from "@/lib/artifact-types";

import MarkdownContent from "@/components/markdown-content";
import SourceRefChip from "./source-ref-chip";

type StudyGuideRendererProps = {
  artifact: Extract<ArtifactItem, { type: "STUDY_GUIDE" }>;
  onOpenSource: (sourceId: string) => void;
};

export default function StudyGuideRenderer({
  artifact,
  onOpenSource,
}: StudyGuideRendererProps) {
  const sections = artifact.content.sections ?? [];

  if (sections.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Note01Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No study guide sections</EmptyTitle>
          <EmptyDescription>This guide did not include any grounded sections.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <section key={`${section.title}-${index}`} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium leading-snug">{section.title}</h3>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <MarkdownContent className="text-xs text-muted-foreground">
            {section.content}
          </MarkdownContent>
          <SourceRefChip
            sourceRef={section.sourceRef}
            sourceTitle={section.sourceTitle}
            sourceIds={artifact.sourceIds}
            onOpenSource={onOpenSource}
          />
        </section>
      ))}
    </div>
  );
}

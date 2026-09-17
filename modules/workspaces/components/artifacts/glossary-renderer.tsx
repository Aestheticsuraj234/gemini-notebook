"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { TextFontIcon } from "@hugeicons/core-free-icons";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

type GlossaryRendererProps = {
  artifact: Extract<ArtifactItem, { type: "GLOSSARY" }>;
  onOpenSource: (sourceId: string) => void;
};

export default function GlossaryRenderer({ artifact, onOpenSource }: GlossaryRendererProps) {
  const terms = artifact.content.terms ?? [];

  if (terms.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No glossary terms</EmptyTitle>
          <EmptyDescription>This glossary did not include any grounded terms.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Accordion multiple className="w-full">
      {terms.map((item, index) => (
        <AccordionItem key={`${item.term}-${index}`} value={`${item.term}-${index}`}>
          <AccordionTrigger>{item.term}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <MarkdownContent className="text-xs text-muted-foreground">
                {item.definition}
              </MarkdownContent>
              <SourceRefChip
                sourceRef={item.sourceRef}
                sourceTitle={item.sourceTitle}
                sourceIds={artifact.sourceIds}
                onOpenSource={onOpenSource}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

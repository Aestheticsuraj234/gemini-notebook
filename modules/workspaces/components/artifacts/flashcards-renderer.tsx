"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Cards01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import type { ArtifactItem } from "@/lib/artifact-types";
import { cn } from "@/lib/utils";

import SourceRefChip from "./source-ref-chip";

type FlashcardsRendererProps = {
  artifact: Extract<ArtifactItem, { type: "FLASHCARDS" }>;
  onOpenSource: (sourceId: string) => void;
};

export default function FlashcardsRenderer({
  artifact,
  onOpenSource,
}: FlashcardsRendererProps) {
  const cards = artifact.content.cards ?? [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Cards01Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No flashcards</EmptyTitle>
          <EmptyDescription>This set did not include any grounded cards.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  function goTo(nextIndex: number) {
    setIndex(nextIndex);
    setFlipped(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Progress value={progress} className="gap-2">
        <p className="text-[11px] text-muted-foreground">
          Card {index + 1} of {cards.length}
        </p>
      </Progress>

      <button
        type="button"
        onClick={() => setFlipped((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" && index < cards.length - 1) {
            event.preventDefault();
            goTo(index + 1);
          }
          if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            goTo(index - 1);
          }
        }}
        className="group relative min-h-52 flex-1 [perspective:1200px]"
      >
        <div
          className={cn(
            "relative h-full min-h-52 w-full transition-transform duration-300 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border bg-muted/20 px-6 text-center backface-hidden">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Front
            </p>
            <p className="text-sm leading-relaxed">{card.front}</p>
            <p className="text-[11px] text-muted-foreground">Click to flip</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border bg-muted/40 px-6 text-center [transform:rotateY(180deg)] backface-hidden">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Back
            </p>
            <p className="text-sm leading-relaxed">{card.back}</p>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Previous
        </Button>
        <SourceRefChip
          sourceRef={card.sourceRef}
          sourceTitle={card.sourceTitle}
          sourceIds={artifact.sourceIds}
          onOpenSource={onOpenSource}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={index === cards.length - 1}
          onClick={() => goTo(index + 1)}
        >
          Next
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

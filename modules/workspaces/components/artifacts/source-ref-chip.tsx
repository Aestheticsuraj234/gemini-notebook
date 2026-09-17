"use client";

import { toast } from "sonner";

import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { resolveArtifactSourceId } from "./studio";

type SourceRefChipProps = {
  sourceRef: string;
  sourceTitle: string;
  sourceIds: string[];
  compact?: boolean;
  onOpenSource: (sourceId: string) => void;
};

export default function SourceRefChip({
  sourceRef,
  sourceTitle,
  sourceIds,
  compact = false,
  onOpenSource,
}: SourceRefChipProps) {
  function openSource() {
    const sourceId = resolveArtifactSourceId(sourceIds, sourceRef);
    if (!sourceId) {
      toast.error("That source is no longer available");
      return;
    }

    onOpenSource(sourceId);
  }

  return (
    <button
      type="button"
      onClick={openSource}
      className={cn(
        badgeVariants({ variant: "outline" }),
        "cursor-pointer align-baseline",
        compact && "h-4 px-1.5 text-[10px]",
      )}
    >
      {compact ? sourceRef : `${sourceRef} · ${sourceTitle}`}
    </button>
  );
}

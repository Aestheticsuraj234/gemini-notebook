"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ExternalLinkIcon } from "@hugeicons/core-free-icons";

import { badgeVariants } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { ChatCitation } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

type ChatCitationChipProps = {
  citation: ChatCitation;
  originalUrl?: string | null;
  compact?: boolean;
  onOpen: (sourceId: string, excerpt: string) => void;
};

export default function ChatCitationChip({
  citation,
  originalUrl,
  compact = false,
  onOpen,
}: ChatCitationChipProps) {
  return (
    <HoverCard>
      <HoverCardTrigger
        className={cn(
          badgeVariants({ variant: "outline" }),
          "cursor-pointer align-baseline",
          compact && "h-4 px-1.5 text-[10px]",
        )}
        onClick={() => onOpen(citation.sourceId, citation.excerpt)}
      >
        {compact ? citation.refId : `${citation.refId} · ${citation.sourceTitle}`}
      </HoverCardTrigger>
      <HoverCardContent className="w-72 space-y-2">
        <p className="font-medium">{citation.sourceTitle}</p>
        <p className="text-muted-foreground">{citation.excerpt}</p>
        {originalUrl ? (
          <a
            href={originalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            <HugeiconsIcon icon={ExternalLinkIcon} strokeWidth={2} className="size-3" />
            Open original
          </a>
        ) : (
          <p className="text-muted-foreground">Click to open this source.</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

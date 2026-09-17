"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  File01Icon,
  Globe02Icon,
  Layers01Icon,
  Note01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { MAX_SOURCES_PER_WORKSPACE } from "@/lib/limit";
import { cn } from "@/lib/utils";

import AddSourceDialog from "./add-source-dialog";

export type Source = {
  id: string;
  title: string;
  kind: "TEXT" | "FILE" | "WEBSITE";
  status: "PROCESSING" | "READY" | "FAILED";
  errorMessage: string | null;
  extractedText: string;
  originalUrl: string | null;
  createdAt: string;
};

type SourcePanelProps = {
  sources: Source[];
  loading: boolean;
  saving: boolean;
  selectedSourceId: string | null;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
  onSelect: (sourceId: string) => void;
  onCreateText: (title: string, text: string) => Promise<boolean>;
  onDelete: (sourceId: string) => void;
};

const kindIcons = {
  TEXT: Note01Icon,
  FILE: File01Icon,
  WEBSITE: Globe02Icon,
};

export default function SourcePanel({
  sources,
  loading,
  saving,
  selectedSourceId,
  addOpen,
  onAddOpenChange,
  onSelect,
  onCreateText,
  onDelete,
}: SourcePanelProps) {
  const atLimit = sources.length >= MAX_SOURCES_PER_WORKSPACE;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Layers01Icon}
            strokeWidth={2}
            className="size-3.5 text-muted-foreground"
          />
          <span className="text-xs font-medium">Sources</span>
          <Badge variant="secondary">
            {sources.length}/{MAX_SOURCES_PER_WORKSPACE}
          </Badge>
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          type="button"
          disabled={atLimit}
          onClick={() => onAddOpenChange(true)}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          <span className="sr-only">Add source</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : sources.length === 0 ? (
          <div className="h-full p-3 pt-0">
            <button
              type="button"
              onClick={() => onAddOpenChange(true)}
              className="flex h-full w-full flex-col items-center justify-center gap-3 border border-dashed bg-muted/20 px-4 text-center transition-colors hover:bg-muted/40"
            >
              <div className="flex size-9 items-center justify-center bg-muted text-muted-foreground">
                <HugeiconsIcon icon={Note01Icon} strokeWidth={2} className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">Add your first source</p>
                <p className="max-w-[180px] text-[11px] leading-relaxed text-muted-foreground">
                  Paste notes to start grounding this notebook.
                </p>
              </div>
            </button>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2 pt-0">
              {sources.map((source) => {
                const selected = source.id === selectedSourceId;

                return (
                  <div
                    key={source.id}
                    className={cn(
                      "group flex items-start gap-2 px-2 py-2 transition-colors",
                      selected ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(source.id)}
                      className="flex min-w-0 flex-1 items-start gap-2 text-left"
                    >
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                        <HugeiconsIcon
                          icon={kindIcons[source.kind]}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{source.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {source.kind === "TEXT" ? "Text" : source.kind === "FILE" ? "File" : "Website"}
                          {" · "}
                          {source.status === "READY"
                            ? "Ready"
                            : source.status === "FAILED"
                              ? source.errorMessage ?? "Failed"
                              : "Processing"}
                        </p>
                      </div>
                    </button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      type="button"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => onDelete(source.id)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                      <span className="sr-only">Delete {source.title}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <AddSourceDialog
        open={addOpen}
        saving={saving}
        onOpenChange={onAddOpenChange}
        onCreateText={onCreateText}
      />
    </div>
  );
}

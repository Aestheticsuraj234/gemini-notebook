"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen02Icon,
  Delete02Icon,
  File01Icon,
  Globe02Icon,
  Layers01Icon,
  Note01Icon,
  PlusSignIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { MAX_SOURCES_PER_WORKSPACE } from "@/lib/limit";
import { cn } from "@/lib/utils";

import AddSourceDialog, { type SourceTab } from "./add-source-dialog";

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
  workspaceId: string;
  sources: Source[];
  loading: boolean;
  saving: boolean;
  selectedSourceId: string | null;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
  onSelect: (sourceId: string) => void;
  onCreateText: (title: string, text: string) => Promise<boolean>;
  onCreateFiles: (files: File[]) => Promise<boolean>;
  onCreateWebsite: (url: string, title?: string) => Promise<boolean>;
  onDelete: (sourceId: string) => void;
  onRetry: (sourceId: string) => void;
};

const kindIcons = {
  TEXT: Note01Icon,
  FILE: File01Icon,
  WEBSITE: Globe02Icon,
};

const addActions = [
  { tab: "text" as const, label: "Paste text", icon: Note01Icon },
  { tab: "files" as const, label: "Upload files", icon: File01Icon },
  { tab: "website" as const, label: "Add website", icon: Globe02Icon },
];

export default function SourcePanel({
  workspaceId,
  sources,
  loading,
  saving,
  selectedSourceId,
  addOpen,
  onAddOpenChange,
  onSelect,
  onCreateText,
  onCreateFiles,
  onCreateWebsite,
  onDelete,
  onRetry,
}: SourcePanelProps) {
  const [addTab, setAddTab] = useState<SourceTab>("text");
  const remainingSlots = Math.max(0, MAX_SOURCES_PER_WORKSPACE - sources.length);
  const atLimit = remainingSlots === 0;

  function openAdd(tab: SourceTab = "text") {
    setAddTab(tab);
    onAddOpenChange(true);
  }

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
          title={atLimit ? "Source limit reached" : "Add source"}
          onClick={() => openAdd("text")}
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
            <div className="flex h-full flex-col items-center justify-center gap-4 border border-dashed bg-muted/20 px-3 text-center">
              <div className="flex items-center">
                {addActions.map((action, index) => (
                  <div
                    key={action.tab}
                    className={cn(
                      "flex size-8 items-center justify-center border border-background bg-muted text-muted-foreground",
                      index > 0 && "-ml-1.5",
                    )}
                  >
                    <HugeiconsIcon icon={action.icon} strokeWidth={2} className="size-3.5" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">Add your first source</p>
                <p className="max-w-[200px] text-[11px] leading-relaxed text-muted-foreground">
                  Paste notes, upload a file, or add a webpage to ground this notebook.
                </p>
              </div>
              <div className="flex w-full flex-col gap-1.5">
                {addActions.map((action) => (
                  <Button
                    key={action.tab}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => openAdd(action.tab)}
                  >
                    <HugeiconsIcon icon={action.icon} strokeWidth={2} />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
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
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <p className="truncate text-[11px] text-muted-foreground">
                            {sourceKindLabel(source)}
                          </p>
                          <SourceStatusBadge source={source} />
                        </div>
                      </div>
                    </button>
                    {source.status === "FAILED" ? (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        type="button"
                        onClick={() => onRetry(source.id)}
                      >
                        <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                        <span className="sr-only">Retry {source.title}</span>
                      </Button>
                    ) : null}
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/workspaces/${workspaceId}/sources/${source.id}` as Route}
                        />
                      }
                    >
                      <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />
                      <span className="sr-only">Preview {source.title}</span>
                    </Button>
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
        remainingSlots={remainingSlots}
        defaultTab={addTab}
        onOpenChange={onAddOpenChange}
        onCreateText={onCreateText}
        onCreateFiles={onCreateFiles}
        onCreateWebsite={onCreateWebsite}
      />
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
    return (
      <Badge variant="destructive" title={source.errorMessage ?? "Failed"}>
        Failed
      </Badge>
    );
  }

  return <Badge variant="outline">Indexing</Badge>;
}

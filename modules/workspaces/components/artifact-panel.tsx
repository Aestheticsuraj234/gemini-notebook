"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, SparklesIcon } from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { ARTIFACT_TYPE_LABELS, type ArtifactItem, type ArtifactType } from "@/lib/artifact-types";
import { cn } from "@/lib/utils";

import { STUDIO_ITEMS, studioIcon } from "./artifacts/studio";

type ArtifactPanelProps = {
  artifacts: ArtifactItem[];
  loading: boolean;
  selectedArtifactId: string | null;
  generatingType: ArtifactType | null;
  generatingStatus: string | null;
  readySourceCount: number;
  deletingId: string | null;
  onGenerate: (type: ArtifactType) => void;
  onSelect: (artifactId: string) => void;
  onDelete: (artifactId: string) => void;
};

export default function ArtifactPanel({
  artifacts,
  loading,
  selectedArtifactId,
  generatingType,
  generatingStatus,
  readySourceCount,
  deletingId,
  onGenerate,
  onSelect,
  onDelete,
}: ArtifactPanelProps) {
  const canGenerate = readySourceCount > 0 && !generatingType;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={SparklesIcon}
            strokeWidth={2}
            className="size-3.5 text-muted-foreground"
          />
          <span className="text-xs font-medium">Artifacts</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {readySourceCount === 0
            ? "No ready sources"
            : `${readySourceCount} source${readySourceCount === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-3 pt-0">
              <div className="grid grid-cols-2 gap-1.5">
                {STUDIO_ITEMS.map((item) => {
                  const generating = generatingType === item.type;

                  return (
                    <div key={item.type} className="flex flex-col gap-2 bg-muted/30 p-2.5">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                          <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{item.label}</p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {generating ? (generatingStatus ?? "Generating...") : item.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        disabled={!canGenerate}
                        onClick={() => onGenerate(item.type)}
                      >
                        {generating ? <Spinner className="size-3" /> : null}
                        {generating ? "Generating" : "Generate"}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <p className="px-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Saved
                </p>
                {artifacts.length === 0 ? (
                  <div className="border border-dashed bg-muted/20 px-3 py-6 text-center">
                    <p className="text-xs font-medium">No artifacts yet</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {readySourceCount === 0
                        ? "Add a ready source, then generate a summary, quiz, or study guide."
                        : "Generate from your sources to start building this studio."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {artifacts.map((artifact) => {
                      const selected = artifact.id === selectedArtifactId;

                      return (
                        <div
                          key={artifact.id}
                          className={cn(
                            "group flex items-start gap-2 px-2 py-2 transition-colors",
                            selected ? "bg-muted" : "hover:bg-muted/50",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(artifact.id)}
                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                          >
                            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                              <HugeiconsIcon
                                icon={studioIcon(artifact.type)}
                                strokeWidth={2}
                                className="size-3.5"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{artifact.title}</p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {ARTIFACT_TYPE_LABELS[artifact.type]}
                                </p>
                                <ArtifactStatusBadge artifact={artifact} />
                              </div>
                            </div>
                          </button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            type="button"
                            disabled={deletingId === artifact.id}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => onDelete(artifact.id)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                            <span className="sr-only">Delete {artifact.title}</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

function ArtifactStatusBadge({ artifact }: { artifact: ArtifactItem }) {
  if (artifact.status === "FAILED") {
    return (
      <Badge variant="destructive" title={artifact.errorMessage ?? "Failed"}>
        Failed
      </Badge>
    );
  }

  return <Badge variant="success">Ready</Badge>;
}

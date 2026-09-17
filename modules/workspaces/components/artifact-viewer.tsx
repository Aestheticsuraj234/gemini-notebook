"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { ARTIFACT_TYPE_LABELS, type ArtifactItem, type ArtifactType } from "@/lib/artifact-types";

import ArtifactRenderer from "./artifacts/artifact-renderer";
import { studioIcon } from "./artifacts/studio";

type ArtifactViewerProps = {
  artifact: ArtifactItem | null;
  generatingType?: ArtifactType | null;
  generatingStatus?: string | null;
  deleting?: boolean;
  retrying?: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  onOpenSource: (sourceId: string) => void;
};

export default function ArtifactViewer({
  artifact,
  generatingType = null,
  generatingStatus = null,
  deleting = false,
  retrying = false,
  onClose,
  onDelete,
  onRetry,
  onOpenSource,
}: ArtifactViewerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const type = artifact?.type ?? generatingType;

  if (!artifact && !generatingType) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-2 px-3">
        {type ? (
          <div className="flex size-6 shrink-0 items-center justify-center bg-muted text-muted-foreground">
            <HugeiconsIcon icon={studioIcon(type)} strokeWidth={2} className="size-3.5" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {artifact?.title ?? (type ? `Generating ${ARTIFACT_TYPE_LABELS[type].toLowerCase()}` : "Artifact")}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {artifact
              ? new Date(artifact.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : (generatingStatus ?? "Working...")}
          </p>
        </div>
        {type ? <Badge variant="secondary">{ARTIFACT_TYPE_LABELS[type]}</Badge> : null}
        {artifact && onDelete ? (
          <Button
            size="icon-xs"
            variant="ghost"
            type="button"
            disabled={deleting}
            onClick={() => setConfirmDelete(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            <span className="sr-only">Delete artifact</span>
          </Button>
        ) : null}
        <Button size="icon-xs" variant="ghost" type="button" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          <span className="sr-only">Close artifact</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        {artifact ? (
          <ScrollArea className="h-full">
            <div className="h-full px-4 py-4">
              <ArtifactRenderer
                key={artifact.id}
                artifact={artifact}
                onOpenSource={onOpenSource}
                onRetry={onRetry ?? (() => undefined)}
                retrying={retrying}
              />
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Spinner className="text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-xs font-medium">
                Generating {type ? ARTIFACT_TYPE_LABELS[type].toLowerCase() : "artifact"}
              </p>
              <p className="text-[11px] text-muted-foreground">{generatingStatus ?? "Working..."}</p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this artifact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from the studio. You can generate it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                onDelete?.();
                setConfirmDelete(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

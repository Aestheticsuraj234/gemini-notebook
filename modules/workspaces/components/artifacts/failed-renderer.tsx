"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ARTIFACT_TYPE_LABELS, type ArtifactItem } from "@/lib/artifact-types";

type FailedRendererProps = {
  artifact: ArtifactItem;
  onRetry: () => void;
  retrying?: boolean;
};

export default function FailedRenderer({
  artifact,
  onRetry,
  retrying = false,
}: FailedRendererProps) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-md">
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
        <AlertTitle>Could not generate {ARTIFACT_TYPE_LABELS[artifact.type].toLowerCase()}</AlertTitle>
        <AlertDescription>
          <p>{artifact.errorMessage ?? "Something went wrong while generating this artifact."}</p>
          <div className="mt-3">
            <Button size="sm" variant="outline" type="button" disabled={retrying} onClick={onRetry}>
              {retrying ? "Generating..." : "Try again"}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

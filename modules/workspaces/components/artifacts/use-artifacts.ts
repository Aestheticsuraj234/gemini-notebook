"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { ArtifactItem, ArtifactType } from "@/lib/artifact-types";
import type { ArtifactStreamEvent } from "@/lib/chat-stream-types";

type UseArtifactsOptions = {
  workspaceId: string;
  sourceIds: string[];
};

export function useArtifacts({ workspaceId, sourceIds }: UseArtifactsOptions) {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingType, setGeneratingType] = useState<ArtifactType | null>(null);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const requestIdRef = useRef(0);

  const loadArtifacts = useCallback(async () => {
    const response = await fetch(`/api/workspaces/${workspaceId}/artifacts`);
    if (!response.ok) {
      toast.error("Could not load artifacts");
      return;
    }

    setArtifacts(await response.json());
  }, [workspaceId]);

  useEffect(() => {
    requestIdRef.current += 1;
    setSelectedArtifactId(null);
    setGeneratingType(null);
    setGeneratingStatus(null);
    setViewerOpen(false);
    setLoading(true);
    loadArtifacts().finally(() => setLoading(false));
  }, [loadArtifacts]);

  const selectedArtifact =
    artifacts.find((artifact) => artifact.id === selectedArtifactId) ?? null;

  function selectArtifact(artifactId: string) {
    setSelectedArtifactId(artifactId);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
  }

  async function generate(type: ArtifactType) {
    if (generatingType || sourceIds.length === 0) {
      if (sourceIds.length === 0) {
        toast.error("Add a ready source before generating");
      }
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setSelectedArtifactId(null);
    setViewerOpen(true);
    setGeneratingType(type);
    setGeneratingStatus("Starting...");

    const response = await fetch(`/api/workspaces/${workspaceId}/artifacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        sourceIds,
      }),
    });

    if (!response.ok || !response.body) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (requestId === requestIdRef.current) {
        toast.error(data?.error ?? "Could not generate artifact");
        setGeneratingType(null);
        setGeneratingStatus(null);
      }
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let receivedDone = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (requestId !== requestIdRef.current) {
        await reader.cancel().catch(() => undefined);
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        const line = rawEvent.replace(/^data: /, "").trim();
        if (!line) {
          continue;
        }

        let event: ArtifactStreamEvent;
        try {
          event = JSON.parse(line) as ArtifactStreamEvent;
        } catch {
          continue;
        }

        if (event.type === "status") {
          setGeneratingStatus(event.label);
        }

        if (event.type === "error") {
          toast.error(event.message);
        }

        if (event.type === "done") {
          receivedDone = true;
          setArtifacts((current) => [
            event.artifact,
            ...current.filter((artifact) => artifact.id !== event.artifact.id),
          ]);
          setSelectedArtifactId(event.artifact.id);
          setViewerOpen(true);

          if (event.artifact.status === "FAILED") {
            toast.error(event.artifact.errorMessage ?? "Could not generate artifact");
          }
        }
      }
    }

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (!receivedDone) {
      toast.error("Could not generate artifact");
    }

    setGeneratingType(null);
    setGeneratingStatus(null);
  }

  async function remove(artifactId: string) {
    setDeletingId(artifactId);
    const response = await fetch(
      `/api/workspaces/${workspaceId}/artifacts/${artifactId}`,
      { method: "DELETE" },
    );
    setDeletingId(null);

    if (!response.ok) {
      toast.error("Could not delete artifact");
      return;
    }

    setArtifacts((current) => current.filter((artifact) => artifact.id !== artifactId));
    if (selectedArtifactId === artifactId) {
      setSelectedArtifactId(null);
      setViewerOpen(false);
    }
    toast.success("Artifact deleted");
  }

  return {
    artifacts,
    selectedArtifact,
    selectedArtifactId,
    loading,
    generatingType,
    generatingStatus,
    deletingId,
    isViewing: viewerOpen && Boolean(selectedArtifact || generatingType),
    selectArtifact,
    closeViewer,
    generate,
    remove,
  };
}

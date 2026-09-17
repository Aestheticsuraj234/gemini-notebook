"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import ArtifactPanel from "./artifact-panel";
import ArtifactViewer from "./artifact-viewer";
import { useArtifacts } from "./artifacts/use-artifacts";
import ChatPanel from "./chat-panel";
import SourcePanel, { type Source } from "./source-panel";

type WorkspaceViewProps = {
  workspaceId: string;
  workspaceTitle: string;
};

export default function WorkspaceView({
  workspaceId,
  workspaceTitle,
}: WorkspaceViewProps) {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  async function loadSources() {
    const response = await fetch(`/api/workspaces/${workspaceId}/sources`);
    if (!response.ok) {
      toast.error("Could not load sources");
      return;
    }

    setSources(await response.json());
  }

  useEffect(() => {
    loadSources().finally(() => setLoading(false));
  }, [workspaceId]);

  async function createTextSource(title: string, text: string) {
    setSaving(true);
    const response = await fetch(`/api/workspaces/${workspaceId}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error(data.error ?? "Could not add source");
      return false;
    }

    const created = (await response.json()) as Source;
    toast.success("Source added");
    await loadSources();
    setSelectedSourceId(created.id);
    return true;
  }

  async function createFileSources(files: File[]) {
    if (files.length === 0) {
      return false;
    }

    setSaving(true);
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch(`/api/workspaces/${workspaceId}/sources/upload`, {
      method: "POST",
      body: formData,
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? "Could not upload files");
      return false;
    }

    const data = (await response.json()) as { sources: Source[]; skippedCount: number };
    if (data.sources.length === 0) {
      toast.error(
        data.skippedCount > 0
          ? "This workspace is at the source limit"
          : "Could not upload files",
      );
      return false;
    }

    if (data.skippedCount > 0) {
      toast.message(
        `${data.sources.length} added, ${data.skippedCount} skipped at the source limit`,
      );
    } else if (data.sources.every((source) => source.status === "FAILED")) {
      toast.error("Could not process the selected files");
    } else if (data.sources.some((source) => source.status === "FAILED")) {
      toast.message("Sources added. Some files need a retry.");
    } else {
      toast.success(data.sources.length === 1 ? "File added" : `${data.sources.length} files added`);
    }

    await loadSources();
    setSelectedSourceId(data.sources[0]?.id ?? null);
    return true;
  }

  async function createWebsiteSource(url: string, title?: string) {
    setSaving(true);
    const response = await fetch(`/api/workspaces/${workspaceId}/sources/website`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        title: title || undefined,
      }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? "Could not add website");
      return false;
    }

    const created = (await response.json()) as Source;
    if (created.status === "FAILED") {
      toast.error(created.errorMessage ?? "Could not scrape this webpage");
    } else {
      toast.success("Website added");
    }

    await loadSources();
    setSelectedSourceId(created.id);
    return true;
  }

  async function deleteSource(sourceId: string) {
    const response = await fetch(
      `/api/workspaces/${workspaceId}/sources/${sourceId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      toast.error("Could not delete source");
      return;
    }

    if (selectedSourceId === sourceId) {
      setSelectedSourceId(null);
    }

    toast.success("Source deleted");
    await loadSources();
  }

  async function retrySource(sourceId: string) {
    const response = await fetch(
      `/api/workspaces/${workspaceId}/sources/${sourceId}/retry`,
      { method: "POST" },
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? "Could not retry source");
      return;
    }

    toast.success("Source re-indexed");
    await loadSources();
  }

  function selectSource(sourceId: string) {
    setSelectedSourceId(sourceId);
  }

  function openSource(sourceId: string, excerpt?: string) {
    const params = new URLSearchParams();
    if (excerpt) {
      params.set("excerpt", excerpt);
    }
    const query = params.toString();
    router.push(
      `/workspaces/${workspaceId}/sources/${sourceId}${query ? `?${query}` : ""}` as Route,
    );
  }

  const readySourceIds = sources
    .filter((source) => source.status === "READY")
    .map((source) => source.id);
  const chatSourceIds =
    selectedSourceId && readySourceIds.includes(selectedSourceId)
      ? [selectedSourceId]
      : readySourceIds;
  const {
    artifacts,
    selectedArtifact,
    selectedArtifactId,
    loading: artifactsLoading,
    generatingType,
    generatingStatus,
    deletingId,
    isViewing,
    selectArtifact,
    closeViewer,
    generate,
    remove,
  } = useArtifacts({
    workspaceId,
    sourceIds: readySourceIds,
  });

  return (
    <div
      data-workspace-id={workspaceId}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1 bg-border"
        defaultLayout={{ sources: 22, chat: 48, artifacts: 30 }}
      >
        <ResizablePanel id="sources" minSize="16%">
          <SourcePanel
            workspaceId={workspaceId}
            sources={sources}
            loading={loading}
            saving={saving}
            selectedSourceId={selectedSourceId}
            addOpen={addOpen}
            onAddOpenChange={setAddOpen}
            onSelect={selectSource}
            onCreateText={createTextSource}
            onCreateFiles={createFileSources}
            onCreateWebsite={createWebsiteSource}
            onDelete={deleteSource}
            onRetry={retrySource}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="chat" minSize="30%">
          {isViewing ? (
            <ArtifactViewer
              artifact={selectedArtifact}
              generatingType={generatingType}
              generatingStatus={generatingStatus}
              deleting={selectedArtifactId === deletingId}
              retrying={Boolean(generatingType && selectedArtifact?.type === generatingType)}
              onClose={closeViewer}
              onDelete={selectedArtifact ? () => void remove(selectedArtifact.id) : undefined}
              onRetry={
                selectedArtifact ? () => void generate(selectedArtifact.type) : undefined
              }
              onOpenSource={(sourceId) => {
                if (!sources.some((source) => source.id === sourceId)) {
                  toast.error("That source is no longer available");
                  return;
                }
                openSource(sourceId);
              }}
            />
          ) : (
            <ChatPanel
              workspaceId={workspaceId}
              workspaceTitle={workspaceTitle}
              sourceIds={chatSourceIds}
              sources={sources}
              onOpenSource={openSource}
            />
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="artifacts" minSize="18%">
          <ArtifactPanel
            artifacts={artifacts}
            loading={artifactsLoading}
            selectedArtifactId={selectedArtifactId}
            generatingType={generatingType}
            generatingStatus={generatingStatus}
            readySourceCount={readySourceIds.length}
            deletingId={deletingId}
            onGenerate={(type) => void generate(type)}
            onSelect={selectArtifact}
            onDelete={(artifactId) => void remove(artifactId)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

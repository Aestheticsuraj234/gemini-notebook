"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import ArtifactPanel from "./artifact-panel";
import ChatPanel from "./chat-panel";
import SourcePanel, { type Source } from "./source-panel";
import SourceViewer from "./source-viewer";

type WorkspaceViewProps = {
  workspaceId: string;
  workspaceTitle: string;
};

export default function WorkspaceView({
  workspaceId,
  workspaceTitle,
}: WorkspaceViewProps) {
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

  const selectedSource =
    sources.find((source) => source.id === selectedSourceId) ?? null;

  return (
    <div
      data-workspace-id={workspaceId}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <SourceViewer
        source={selectedSource}
        onClose={() => setSelectedSourceId(null)}
      />

      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1 bg-border"
        defaultLayout={{ sources: 22, chat: 48, artifacts: 30 }}
      >
        <ResizablePanel id="sources" minSize="16%">
          <SourcePanel
            sources={sources}
            loading={loading}
            saving={saving}
            selectedSourceId={selectedSourceId}
            addOpen={addOpen}
            onAddOpenChange={setAddOpen}
            onSelect={setSelectedSourceId}
            onCreateText={createTextSource}
            onDelete={deleteSource}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="chat" minSize="30%">
          <ChatPanel workspaceTitle={workspaceTitle} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="artifacts" minSize="18%">
          <ArtifactPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

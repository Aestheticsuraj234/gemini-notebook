import prisma from "@/lib/db";


export type SourceLabel = {
  refId: string;
  sourceId: string;
  sourceTitle: string;
};

export type LoadedArtifactContext = {
  context: string;
  sourceLabels: SourceLabel[];
};

export class ArtifactContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArtifactContextError";
  }
}

export async function loadArtifactContext(workspaceId: string, sourceIds: string[]) {
  const uniqueSourceIds = [...new Set(sourceIds)];
  const sources = await prisma.source.findMany({
    where: {
      workspaceId,
      status: "READY",
      id: { in: uniqueSourceIds },
    },
    select: {
      id: true,
      title: true,
      extractedText: true,
    },
  });

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const orderedSources = uniqueSourceIds.map((sourceId) => sourceById.get(sourceId));
  if (orderedSources.some((source) => !source)) {
    throw new ArtifactContextError("One or more selected sources are unavailable");
  }

  const sourceLabels: SourceLabel[] = [];
  const blocks: string[] = [];

  for (const [index, source] of orderedSources.entries()) {
    const refId = `S${index + 1}`;
    sourceLabels.push({
      refId,
      sourceId: source!.id,
      sourceTitle: source!.title,
    });
    blocks.push(`[${refId}] ${source!.title}\n${source!.extractedText}`);
  }

  const context = blocks.join("\n\n");

  return { context, sourceLabels } satisfies LoadedArtifactContext;
}

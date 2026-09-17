import { indexSource } from "../ai/index-source";
import prisma from "../db";
import { MAX_SOURCES_PER_WORKSPACE } from "../limit";


type SourceKind = "TEXT" | "FILE" | "WEBSITE";

const sourceSelect = {
    id: true,
    title: true,
    kind: true,
    status: true,
    errorMessage: true,
    extractedText: true,
    originalUrl: true,
    createdAt: true,
  } as const;
  

export type ProcessedSource = {
    id: string;
    title: string;
    kind: string;
    status: string;
    errorMessage: string | null;
    extractedText: string;
    originalUrl: string | null;
    createdAt: Date;
  };

  function serializeSource(source: ProcessedSource) {
    return {
      ...source,
      createdAt: source.createdAt.toISOString(),
    };
  }
  
  
  function validateExtractedText(extractedText: string) {
    const trimmed = extractedText.trim();
    if (!trimmed) {
      throw new Error("No selectable text found");
    }
    return trimmed;
  }

  export async function getWorkspaceSourceCount(workspaceId: string) {
    const count = await prisma.source.count({
      where: {
        workspaceId,
      },
    });
    return count;
  }

  export async function assertWorkspaceSourceCapacity(workspaceId: string, additional = 1) {
    const sourceCount = await getWorkspaceSourceCount(workspaceId);
    if (sourceCount + additional > MAX_SOURCES_PER_WORKSPACE) {
      throw new Error(`This workspace already has ${MAX_SOURCES_PER_WORKSPACE} sources.`);
    }
  }

  async function markSourceFailed(sourceId: string, message: string) {
    return prisma.source.update({
      where: { id: sourceId },
      data: { status: "FAILED", errorMessage: message },
      select: sourceSelect,
    });
  }

  export async function createAndIndexSource(input: {
    workspaceId: string;
    title: string;
    kind: SourceKind;
    extractedText: string;
    originalUrl?: string | null;
  }) {
    await assertWorkspaceSourceCapacity(input.workspaceId);
  
    const source = await prisma.source.create({
      data: {
        workspaceId: input.workspaceId,
        title: input.title.trim(),
        kind: input.kind,
        extractedText: validateExtractedText(input.extractedText),
        originalUrl: input.originalUrl ?? null,
        status: "PROCESSING",
      },
      select: sourceSelect,
    });
  
   
  
    try {
      await indexSource(source.id);
    } catch {
      // indexSource marks the source FAILED before rethrowing.
    }

    return prisma.source.findUniqueOrThrow({
      where: { id: source.id },
      select: sourceSelect,
    });
  }

  export async function createFailedSource(input: {
    workspaceId: string;
    title: string;
    kind: SourceKind;
    originalUrl?: string | null;
    errorMessage: string;
  }) {
    await assertWorkspaceSourceCapacity(input.workspaceId);
  
    return prisma.source.create({
      data: {
        workspaceId: input.workspaceId,
        title: input.title.trim(),
        kind: input.kind,
        extractedText: "",
        originalUrl: input.originalUrl ?? null,
        status: "FAILED",
        errorMessage: input.errorMessage,
      },
      select: sourceSelect,
    });
  }


  export {serializeSource , sourceSelect}
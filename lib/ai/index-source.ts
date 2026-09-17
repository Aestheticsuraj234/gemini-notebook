import { deleteSourceVectors, upsertSourceChunks } from "@/lib/ai/vector-store";
import prisma from "../db";

export async function indexSource(sourceId: string) {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        extractedText: true,
      },
    });
  
    if (!source) {
      throw new Error("Source not found");
    }
  
    try {
      await deleteSourceVectors(source.workspaceId, source.id);
      await upsertSourceChunks({
        workspaceId: source.workspaceId,
        sourceId: source.id,
        sourceTitle: source.title,
        extractedText: source.extractedText,
      });
  
      await prisma.source.update({
        where: { id: source.id },
        data: { status: "READY", errorMessage: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Indexing failed";
      await prisma.source.update({
        where: { id: source.id },
        data: { status: "FAILED", errorMessage: message },
      });
      throw error;
    }
  }
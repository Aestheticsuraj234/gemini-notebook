import { NextResponse } from "next/server";
import { z } from "zod";

import { runArtifactGraphStream } from "@/lib/ai/artifact-graph";
import { ArtifactContextError } from "@/lib/ai/artifacts/load-context";
import type { ArtifactGenerationResult } from "@/lib/ai/artifacts/schemas";
import { QuizValidationError } from "@/lib/ai/artifacts/validate-quiz";
import { ARTIFACT_TYPE_LABELS, type ArtifactItem, type ArtifactType } from "@/lib/artifact-types";
import type { ArtifactStreamEvent } from "@/lib/chat-stream-types";
import prisma from "@/lib/db";
import { getSessionUser } from "@/modules/auth/actions";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import { notFoundResponse, unauthorizedResponse } from "../route";

const createArtifactSchema = z.object({
  type: z.enum(["SUMMARY", "FLASHCARDS", "QUIZ", "STUDY_GUIDE", "GLOSSARY"]),
  sourceIds: z.array(z.string().min(1)).min(1, "Select at least one source"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

const artifactSelect = {
  id: true,
  type: true,
  title: true,
  content: true,
  sourceIds: true,
  status: true,
  errorMessage: true,
  createdAt: true,
} as const;

function serializeArtifact(artifact: {
  id: string;
  type: ArtifactType;
  title: string;
  content: unknown;
  sourceIds: unknown;
  status: "READY" | "FAILED";
  errorMessage: string | null;
  createdAt: Date;
}): ArtifactItem {
  return {
    id: artifact.id,
    type: artifact.type,
    title: artifact.title,
    content: artifact.content,
    sourceIds: artifact.sourceIds as string[],
    status: artifact.status,
    errorMessage: artifact.errorMessage,
    createdAt: artifact.createdAt.toISOString(),
  } as ArtifactItem;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { id: workspaceId } = await context.params;
  const workspace = await getOwnedWorkspace(workspaceId, user.id);
  if (!workspace) {
    return notFoundResponse();
  }

  const artifacts = await prisma.artifact.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: artifactSelect,
  });

  return NextResponse.json(artifacts.map(serializeArtifact));
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { id: workspaceId } = await context.params;
  const workspace = await getOwnedWorkspace(workspaceId, user.id);
  if (!workspace) {
    return notFoundResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createArtifactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const uniqueSourceIds = [...new Set(parsed.data.sourceIds)];
  const readySources = await prisma.source.findMany({
    where: {
      workspaceId,
      status: "READY",
      id: { in: uniqueSourceIds },
    },
    select: { id: true },
  });

  if (readySources.length !== uniqueSourceIds.length) {
    return NextResponse.json({ error: "One or more selected sources are unavailable" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const title = `${ARTIFACT_TYPE_LABELS[parsed.data.type]} · ${new Date().toLocaleDateString()}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: ArtifactStreamEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        const graphStream = runArtifactGraphStream({
          workspaceId,
          sourceIds: uniqueSourceIds,
          artifactType: parsed.data.type,
        });

        let content: ArtifactGenerationResult;

        while (true) {
          const next = await graphStream.next();
          if (next.done) {
            content = next.value;
            break;
          }
          send(next.value);
        }

        const artifact = await prisma.artifact.create({
          data: {
            workspaceId,
            type: parsed.data.type,
            title,
            content,
            sourceIds: uniqueSourceIds,
            status: "READY",
          },
          select: artifactSelect,
        });

        send({ type: "done", artifact: serializeArtifact(artifact) });
      } catch (error) {
        const message =
          error instanceof ArtifactContextError ||
          error instanceof QuizValidationError ||
          error instanceof Error
            ? error.message
            : "Could not generate artifact";

        const failed = await prisma.artifact.create({
          data: {
            workspaceId,
            type: parsed.data.type,
            title,
            content: {},
            sourceIds: uniqueSourceIds,
            status: "FAILED",
            errorMessage: message,
          },
          select: artifactSelect,
        });

        send({ type: "done", artifact: serializeArtifact(failed) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

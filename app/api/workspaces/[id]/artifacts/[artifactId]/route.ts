import { NextResponse } from "next/server";

import type { ArtifactItem, ArtifactType } from "@/lib/artifact-types";
import prisma from "@/lib/db";
import { getSessionUser } from "@/modules/auth/actions";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import { notFoundResponse, unauthorizedResponse } from "../../route";

type RouteContext = {
  params: Promise<{ id: string; artifactId: string }>;
};

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

  const { id: workspaceId, artifactId } = await context.params;
  const workspace = await getOwnedWorkspace(workspaceId, user.id);
  if (!workspace) {
    return notFoundResponse();
  }

  const artifact = await prisma.artifact.findFirst({
    where: { id: artifactId, workspaceId },
    select: {
      id: true,
      type: true,
      title: true,
      content: true,
      sourceIds: true,
      status: true,
      errorMessage: true,
      createdAt: true,
    },
  });

  if (!artifact) {
    return notFoundResponse();
  }

  return NextResponse.json(serializeArtifact(artifact));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { id: workspaceId, artifactId } = await context.params;
  const workspace = await getOwnedWorkspace(workspaceId, user.id);
  if (!workspace) {
    return notFoundResponse();
  }

  const artifact = await prisma.artifact.findFirst({
    where: { id: artifactId, workspaceId },
    select: { id: true },
  });

  if (!artifact) {
    return notFoundResponse();
  }

  await prisma.artifact.delete({ where: { id: artifact.id } });

  return NextResponse.json({ ok: true });
}

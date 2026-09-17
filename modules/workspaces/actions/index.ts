"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function getOwnedWorkspace(workspaceId: string, userId: string) {
    return prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
      select: { id: true, title: true, createdAt: true },
    });
  }

export async function getOwnedSource(workspaceId: string, sourceId: string, userId: string) {
  const workspace = await getOwnedWorkspace(workspaceId, userId);
  if (!workspace) {
    return null;
  }

  const source = await prisma.source.findFirst({
    where: { id: sourceId, workspaceId },
    select: {
      id: true,
      title: true,
      kind: true,
      status: true,
      errorMessage: true,
      extractedText: true,
      originalUrl: true,
      createdAt: true,
    },
  });

  if (!source) {
    return null;
  }

  return {
    workspace,
    source: {
      ...source,
      createdAt: source.createdAt.toISOString(),
    },
  };
}

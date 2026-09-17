import { NextResponse } from "next/server";

import { indexSource } from "@/lib/ai/index-source";
import { serializeSource, sourceSelect } from "@/lib/sources/process-source";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import { getSessionUser } from "@/modules/auth/actions";
import { notFoundResponse, unauthorizedResponse } from "../../../route";
import prisma from "@/lib/db";


type RouteContext = {
    params: Promise<{ id: string; sourceId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
    const user = await getSessionUser();
    if (!user) {
        return unauthorizedResponse();
    }

    const { id: workspaceId, sourceId } = await context.params;

    const workspace = await getOwnedWorkspace(workspaceId, user.id);
    if (!workspace) {
        return unauthorizedResponse();
    }

    const source = await prisma.source.findFirst({
        where: { id: sourceId, workspaceId },
        select: {
            id: true,
            status: true,
            kind: true,
            title: true,
            originalUrl: true,
            extractedText: true,
          },
    });

    if (!source) {
        return notFoundResponse();
    }


  if (source.status !== "FAILED") {
    return NextResponse.json({ error: "Only failed sources can be retried" }, { status: 400 });
  }

  if (source.kind === "FILE" && !source.extractedText.trim()) {
    return NextResponse.json({ error: "Re-upload this file to try again" }, { status: 400 });
  }

  await prisma.source.update({
    where: { id: source.id },
    data: { status: "PROCESSING", errorMessage: null },
  });
    await indexSource(source.id);

    const updatedSource = await prisma.source.findUniqueOrThrow({
        where: { id: source.id },
        select: sourceSelect,
      });

    return NextResponse.json(serializeSource(updatedSource));
}
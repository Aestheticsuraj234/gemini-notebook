import { NextResponse } from "next/server";
import { z } from "zod";

import { retrieveChunks } from "@/lib/ai/vector-store";
import { getSessionUser } from "@/modules/auth/actions";
import { notFoundResponse, unauthorizedResponse } from "../route";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import prisma from "@/lib/db";

const retrieveRequestSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
  sourceIds: z.array(z.string().min(1)).min(1, "Select at least one source"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  const parsed = retrieveRequestSchema.safeParse(body);
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

  

  try {
    const chunks = await retrieveChunks({
      workspaceId,
      sourceIds: uniqueSourceIds,
      question: parsed.data.question,
    });

    return NextResponse.json({ chunks });
  } catch {
    return NextResponse.json({ error: "Could not retrieve chunks" }, { status: 500 });
  }
}

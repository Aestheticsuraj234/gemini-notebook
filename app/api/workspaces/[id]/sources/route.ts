import { NextResponse } from "next/server";
import { z } from "zod";

import { createAndIndexSource, serializeSource } from "@/lib/sources/process-source";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import { getSessionUser } from "@/modules/auth/actions";
import { notFoundResponse, unauthorizedResponse } from "../route";
import prisma from "@/lib/db";


const createSourceSchema = z.object({
    title: z.string().min(1),
    text:z.string().optional(),
})

type RouteContext = {
    params: Promise<{ id: string }>;
};

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
  
    const sources = await prisma.source.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
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
  
    return NextResponse.json(
      sources.map((source) => ({
        ...source,
        createdAt: source.createdAt.toISOString(),
      })),
    );
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
  
    const parsed = createSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
  
    try {
      const source = await createAndIndexSource({
        workspaceId,
        title: parsed.data.title,
        kind: "TEXT",
        extractedText: parsed.data.text ?? "",
      });

      return NextResponse.json(serializeSource(source), { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create source";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
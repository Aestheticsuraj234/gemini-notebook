import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/modules/auth/actions";
import prisma from "@/lib/db";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFoundResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}


const updateWorkspaceSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(100),
  });

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    const user = await getSessionUser();
    if (!user) {
      return unauthorizedResponse();
    }
  
    const { id } = await context.params;
  
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  
    const parsed = updateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
  
    const existing = await prisma.workspace.findFirst({
      where: { id: id, userId: user.id },
      select:{id:true, title:true, createdAt:true}
    });

    if (!existing) {
      return notFoundResponse();
    }
  
    const workspace = await prisma.workspace.update({
      where: { id: existing.id },
      data: { title: parsed.data.title },
      select: { id: true, title: true, createdAt: true },
    });
  
    return NextResponse.json(workspace);
  }

  export async function DELETE(request: Request, context: RouteContext) {
    const user = await getSessionUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    const existing = await prisma.workspace.findFirst({
      where: { id: id, userId: user.id },
      select:{id:true, title:true, createdAt:true}
    });

    if (!existing) {
      return notFoundResponse();
    }

    await prisma.workspace.delete({ where: { id: existing.id } });
    return NextResponse.json({ message: "Workspace deleted" });
  }
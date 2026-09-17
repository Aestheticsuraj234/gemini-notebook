import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser} from "@/modules/auth/actions";
import prisma from "@/lib/db";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFoundResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}


const createWorkspaceSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(100),
  });


export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) {
      return unauthorizedResponse();
    }
  
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  
    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
  
    const workspace = await prisma.workspace.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
      },
      select: { id: true, title: true, createdAt: true },
    });
  
    return NextResponse.json(workspace, { status: 201 });
  }  


export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const workspaces = await prisma.workspace.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json(workspaces);
}

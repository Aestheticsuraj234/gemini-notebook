import { NextResponse } from "next/server";

import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import { getSessionUser } from "@/modules/auth/actions";
import { notFoundResponse, unauthorizedResponse } from "../../route";
import prisma from "@/lib/db";


type RouteContext = {
    params: Promise<{ id: string; sourceId: string }>;
  };


export async function DELETE(request: Request, context: RouteContext) {
    const user = await getSessionUser();
    if (!user) {
        return unauthorizedResponse();
    }
    const { id: workspaceId, sourceId } = await context.params;

    const workspace = await getOwnedWorkspace(workspaceId, user?.id);
    if (!workspace) {
        return unauthorizedResponse();
    }

    const source = await prisma.source.findUnique({
        where: { id: sourceId, workspaceId },
    });

    if (!source) {
        return notFoundResponse();
    }

    // TODO: Deletsource vectors as well 
    await prisma.source.delete({
        where: { id: sourceId, workspaceId },
    });

    return NextResponse.json(null, { status: 204 });
}
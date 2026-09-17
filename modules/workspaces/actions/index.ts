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

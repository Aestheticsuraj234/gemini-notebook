import { NextResponse } from "next/server";

import { SourceExtractionError, extractFileSource } from "@/lib/sources/extract-file";
import {
  assertWorkspaceSourceCapacity,
  createAndIndexSource,
  createFailedSource,
  getWorkspaceSourceCount,
  serializeSource,
} from "@/lib/sources/process-source";
import { getSessionUser } from "@/modules/auth/actions";
import { unauthorizedResponse } from "../../route";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import { notFoundResponse } from "../../route";
import { MAX_SOURCES_PER_WORKSPACE } from "@/lib/limit";

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const entries = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (entries.length === 0) {
    return NextResponse.json({ error: "Select at least one file" }, { status: 400 });
  }

  const remainingSlots = MAX_SOURCES_PER_WORKSPACE - (await getWorkspaceSourceCount(workspaceId));
  if (remainingSlots <= 0) {
    return NextResponse.json(
      { error: `This workspace already has ${MAX_SOURCES_PER_WORKSPACE} sources.` },
      { status: 400 },
    );
  }

  const files = entries.slice(0, remainingSlots);
  const skippedCount = entries.length - files.length;
  const sources = [];

  for (const file of files) {
    try {
      const extracted = await extractFileSource(file);
      const source = await createAndIndexSource({
        workspaceId,
        title: extracted.title,
        kind: "FILE",
        extractedText: extracted.extractedText,
      });
      sources.push(serializeSource(source));
    } catch (error) {
      const message =
        error instanceof SourceExtractionError || error instanceof Error
          ? error.message
          : "Could not process file";

      if (error instanceof Error && error.message.includes("already has")) {
        break;
      }

      try {
        await assertWorkspaceSourceCapacity(workspaceId);
        const failed = await createFailedSource({
          workspaceId,
          title: file.name,
          kind: "FILE",
          errorMessage: message,
        });
        sources.push(serializeSource(failed));
      } catch {
        break;
      }
    }
  }

  return NextResponse.json(
    {
      sources,
      skippedCount,
    },
    { status: 201 },
  );
}

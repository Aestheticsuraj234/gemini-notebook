import { NextResponse } from "next/server";
import { z } from "zod";

import { SourceExtractionError } from "@/lib/sources/extract-file";
import { extractWebsiteSource } from "@/lib/sources/extract-website";
import { createAndIndexSource, createFailedSource, serializeSource } from "@/lib/sources/process-source";
import { getSessionUser } from "@/modules/auth/actions";
import { notFoundResponse, unauthorizedResponse } from "../../route";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";


const websiteSourceSchema = z.object({
  url: z.string().trim().min(1, "URL is required"),
  title: z.string().trim().max(100).optional(),
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

  const parsed = websiteSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const extracted = await extractWebsiteSource(parsed.data.url, parsed.data.title);
    const source = await createAndIndexSource({
      workspaceId,
      title: extracted.title,
      kind: "WEBSITE",
      extractedText: extracted.extractedText,
      originalUrl: extracted.originalUrl,
    });

    return NextResponse.json(serializeSource(source), { status: 201 });
  } catch (error) {
    const message =
      error instanceof SourceExtractionError || error instanceof Error
        ? error.message
        : "Could not scrape this webpage";

    if (message.includes("already has")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const failed = await createFailedSource({
      workspaceId,
      title: parsed.data.title ?? parsed.data.url,
      kind: "WEBSITE",
      originalUrl: parsed.data.url,
      errorMessage: message,
    });

    return NextResponse.json(serializeSource(failed), { status: 201 });
  }
}

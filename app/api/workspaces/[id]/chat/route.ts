import { NextResponse } from "next/server";
import { z } from "zod";

import type { ChatCitation } from "@/lib/chat-types";
import {
  consumeGroundedAnswerStream,
  createNoContextResult,
  prepareStandaloneQuestion,
  retrieveLabeledDocuments,
} from "@/lib/ai/rag-chat";
import {
  createConversationMessage,
  getConversationMessages,
  getOrCreateWorkspaceConversation,
  getRecentConversationMessages,
} from "@/lib/conversation";
import { getSessionUser } from "@/modules/auth/actions";
import { notFoundResponse, unauthorizedResponse } from "../route";
import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import prisma from "@/lib/db";

const chatRequestSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
  sourceIds: z.array(z.string().min(1)).min(1, "Select at least one source"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeMessage(message: {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: unknown;
  createdAt: Date;
}) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    citations: (message.citations as ChatCitation[] | null) ?? null,
    createdAt: message.createdAt.toISOString(),
  };
}

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

  const conversation = await getOrCreateWorkspaceConversation(workspaceId);
  const messages = await getConversationMessages(conversation.id);

  return NextResponse.json({
    messages: messages.map(serializeMessage),
  });
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

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
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
    return NextResponse.json(
      { error: "One or more selected sources are unavailable" },
      { status: 400 },
    );
  }

  const conversation = await getOrCreateWorkspaceConversation(workspaceId);
  const recentMessages = await getRecentConversationMessages(conversation.id);
  const userMessage = await createConversationMessage({
    conversationId: conversation.id,
    role: "USER",
    content: parsed.data.question,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: unknown) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        send({ type: "user", message: serializeMessage(userMessage) });

        const standaloneQuestion = await prepareStandaloneQuestion(
          parsed.data.question,
          recentMessages,
        );
        const documents = await retrieveLabeledDocuments({
          workspaceId,
          sourceIds: uniqueSourceIds,
          question: standaloneQuestion,
        });

        if (documents.length === 0) {
          const result = createNoContextResult();
          send({ type: "token", text: result.answer });
          const assistantMessage = await createConversationMessage({
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: result.answer,
            citations: result.citations,
          });
          send({ type: "done", message: serializeMessage(assistantMessage) });
          return;
        }

        const result = await consumeGroundedAnswerStream(
          standaloneQuestion,
          documents,
          (token) => send({ type: "token", text: token }),
        );
        const assistantMessage = await createConversationMessage({
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: result.answer,
          citations: result.citations,
        });
        send({ type: "done", message: serializeMessage(assistantMessage) });
      } catch {
        send({ type: "error", error: "Could not stream a reply" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

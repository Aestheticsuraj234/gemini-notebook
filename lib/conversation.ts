import { RecentChatMessage } from "./ai/rag-chat";
import type { ChatCitation } from "./chat-types";
import prisma from "./db";

const conversationSelect = {
  id: true,
  workspaceId: true,
  title: true,
  createdAt: true,
} as const;

const messageSelect = {
  id: true,
  role: true,
  content: true,
  citations: true,
  createdAt: true,
} as const;

export async function getOrCreateWorkspaceConversation(workspaceId: string) {
  return prisma.conversation.upsert({
    where: { workspaceId },
    create: { workspaceId, title: "Chat" },
    update: {},
    select: conversationSelect,
  });
}

export async function getRecentConversationMessages(
  conversationId: string,
  limit = 6,
) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      role: true,
      content: true,
    },
  });

  return messages.reverse() satisfies RecentChatMessage[];
}

export async function getConversationMessages(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: messageSelect,
  });
}

export async function createConversationMessage(input: {
  conversationId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: ChatCitation[] | null;
}) {
  return prisma.message.create({
    data: {
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      citations: input.citations ?? undefined,
    },
    select: messageSelect,
  });
}

  
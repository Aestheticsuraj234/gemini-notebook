import type { ChatMessageItem } from "@/lib/chat-types";

export type ChatStreamEvent =
  | { type: "user"; message: ChatMessageItem }
  | { type: "status"; label: string }
  | { type: "token"; value: string }
  | { type: "done"; userMessage: ChatMessageItem; assistantMessage: ChatMessageItem }
  | { type: "error"; message: string };


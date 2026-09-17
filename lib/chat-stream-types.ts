import type { ChatMessageItem } from "@/lib/chat-types";
import { ArtifactItem } from "./artifact-types";

export type ChatStreamEvent =
  | { type: "user"; message: ChatMessageItem }
  | { type: "status"; label: string }
  | { type: "token"; value: string }
  | { type: "done"; userMessage: ChatMessageItem; assistantMessage: ChatMessageItem }
  | { type: "error"; message: string };

  export type ArtifactStreamEvent =
  | { type: "status"; label: string }
  | { type: "done"; artifact: ArtifactItem }
  | { type: "error"; message: string };

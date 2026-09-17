export type ChatCitation = {
  refId: string;
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  excerpt: string;
};

export type ChatMessageItem = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: ChatCitation[] | null;
  createdAt: string;
};

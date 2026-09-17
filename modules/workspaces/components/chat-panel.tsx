"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { MessageSquareIcon, SentIcon } from "@hugeicons/core-free-icons";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import type { ChatCitation, ChatMessageItem } from "@/lib/chat-types";

import ChatCitationChip from "./chat-citation";
import type { Source } from "./source-panel";

type ChatPanelProps = {
  workspaceId: string;
  workspaceTitle: string;
  sourceIds: string[];
  sources: Source[];
  onOpenSource: (sourceId: string, excerpt?: string) => void;
};

type StreamEvent =
  | { type: "user"; message: ChatMessageItem }
  | { type: "token"; text: string }
  | { type: "done"; message: ChatMessageItem }
  | { type: "error"; error: string };

const STREAMING_ID = "streaming";

export default function ChatPanel({
  workspaceId,
  workspaceTitle,
  sourceIds,
  sources,
  onOpenSource,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    const response = await fetch(`/api/workspaces/${workspaceId}/chat`);
    if (!response.ok) {
      toast.error("Could not load chat");
      return;
    }

    const data = (await response.json()) as { messages: ChatMessageItem[] };
    setMessages(data.messages);
  }

  useEffect(() => {
    loadMessages().finally(() => setLoading(false));
  }, [workspaceId]);

  async function sendQuestion() {
    const nextQuestion = question.trim();
    if (!nextQuestion || sending) {
      return;
    }
    if (sourceIds.length === 0) {
      toast.error("Add a ready source before chatting");
      return;
    }

    setQuestion("");
    setSending(true);

    const response = await fetch(`/api/workspaces/${workspaceId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: nextQuestion,
        sourceIds,
      }),
    });

    if (!response.ok || !response.body) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? "Could not send question");
      setQuestion(nextQuestion);
      setSending(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamingContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        const line = rawEvent.replace(/^data: /, "").trim();
        if (!line) {
          continue;
        }

        const event = JSON.parse(line) as StreamEvent;

        if (event.type === "user") {
          setMessages((current) => [...current, event.message]);
        }

        if (event.type === "token") {
          streamingContent += event.text;
          const content = streamingContent;
          setMessages((current) => {
            const withoutDraft = current.filter((message) => message.id !== STREAMING_ID);
            return [
              ...withoutDraft,
              {
                id: STREAMING_ID,
                role: "ASSISTANT",
                content,
                citations: null,
                createdAt: new Date().toISOString(),
              },
            ];
          });
        }

        if (event.type === "done") {
          setMessages((current) => [
            ...current.filter((message) => message.id !== STREAMING_ID),
            event.message,
          ]);
        }

        if (event.type === "error") {
          toast.error(event.error);
        }
      }
    }

    setSending(false);
  }

  const canSend = sourceIds.length > 0 && question.trim().length > 0 && !sending;
  const sourceCountLabel =
    sourceIds.length === 0
      ? "No ready sources"
      : `${sourceIds.length} source${sourceIds.length === 1 ? "" : "s"}`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <HugeiconsIcon
            icon={MessageSquareIcon}
            strokeWidth={2}
            className="size-3.5 text-muted-foreground"
          />
          <span className="truncate text-xs font-medium">{workspaceTitle}</span>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">{sourceCountLabel}</span>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={MessageSquareIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Ask this notebook</EmptyTitle>
              <EmptyDescription>
                {sourceIds.length === 0
                  ? "Add a ready source first, then ask a question."
                  : "Ask a question about the selected sources."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-4 px-4 py-4">
                  {messages.map((message, index) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={index === messages.length - 1}
                    >
                      <ChatMessage
                        message={message}
                        sources={sources}
                        onOpenSource={onOpenSource}
                      />
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        )}
      </div>

      <div className="shrink-0 p-3">
        <InputGroup className="h-auto bg-muted/30">
          <InputGroupTextarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendQuestion();
              }
            }}
            placeholder={
              sourceIds.length === 0
                ? "Ask a question after you add sources..."
                : "Ask a question about your sources..."
            }
            rows={2}
            disabled={sending || sourceIds.length === 0}
          />
          <InputGroupAddon align="block-end" className="justify-between">
            <InputGroupText>
              {sourceCountLabel}
              <span>
                <Kbd>Enter</Kbd> to send
              </span>
            </InputGroupText>
            <InputGroupButton
              size="icon-xs"
              variant="default"
              disabled={!canSend}
              onClick={() => void sendQuestion()}
            >
              {sending ? <Spinner /> : <HugeiconsIcon icon={SentIcon} strokeWidth={2} />}
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  sources,
  onOpenSource,
}: {
  message: ChatMessageItem;
  sources: Source[];
  onOpenSource: (sourceId: string, excerpt?: string) => void;
}) {
  const isUser = message.role === "USER";
  const isStreaming = message.id === STREAMING_ID;
  const citations = message.citations ?? [];

  return (
    <Message align={isUser ? "end" : "start"}>
      <MessageContent>
        <Bubble variant={isUser ? "default" : "muted"} align={isUser ? "end" : "start"}>
          <BubbleContent>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <AssistantContent
                content={message.content}
                citations={citations}
                sources={sources}
                onOpenSource={onOpenSource}
              />
            )}
          </BubbleContent>
        </Bubble>
        {!isUser && citations.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {citations.map((citation) => (
              <ChatCitationChip
                key={`${message.id}-${citation.refId}`}
                citation={citation}
                originalUrl={sourceUrl(sources, citation.sourceId)}
                onOpen={onOpenSource}
              />
            ))}
          </div>
        ) : null}
        <MessageFooter>
          {isStreaming
            ? "Thinking..."
            : new Date(message.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}

function AssistantContent({
  content,
  citations,
  sources,
  onOpenSource,
}: {
  content: string;
  citations: ChatCitation[];
  sources: Source[];
  onOpenSource: (sourceId: string, excerpt?: string) => void;
}) {
  if (citations.length === 0) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  const citationByRef = new Map(citations.map((citation) => [citation.refId, citation]));
  const parts = content.split(/(\bS\d+\b)/g);

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const citation = citationByRef.get(part);
        if (!citation) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
          <ChatCitationChip
            key={`${part}-${index}`}
            citation={citation}
            originalUrl={sourceUrl(sources, citation.sourceId)}
            compact
            onOpen={onOpenSource}
          />
        );
      })}
    </div>
  );
}

function sourceUrl(sources: Source[], sourceId: string) {
  return sources.find((source) => source.id === sourceId)?.originalUrl ?? null;
}

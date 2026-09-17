import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { ChatCitation } from "@/lib/chat-types";
import type { ChatStreamEvent } from "@/lib/chat-stream-types";

import {
    createNoContextResult,
    generateGroundedAnswer,
    prepareStandaloneQuestion,
    retrieveLabeledDocuments,
    streamGroundedAnswer,
    type LabeledDocument,
    type RecentChatMessage,
  } from "./rag-chat";

  const ChatGraphState = Annotation.Root({
    question: Annotation<string>,
    recentMessages: Annotation<RecentChatMessage[]>,
    standaloneQuestion: Annotation<string>,
    workspaceId: Annotation<string>,
    sourceIds: Annotation<string[]>,
    documents: Annotation<LabeledDocument[]>,
    answer: Annotation<string>,
    citations: Annotation<ChatCitation[]>,
  });

  export type ChatGraphStateType = typeof ChatGraphState.State;

  async function prepareQuestionNode(state: ChatGraphStateType) {
    const standaloneQuestion = await prepareStandaloneQuestion(state.question, state.recentMessages);
    return { standaloneQuestion };
  }

  async function retrieveSourcesNode(state: ChatGraphStateType) {
    const documents = await retrieveLabeledDocuments({
      workspaceId: state.workspaceId,
      sourceIds: state.sourceIds,
      question: state.standaloneQuestion,
    });
  
    return { documents };
  }

  function routeAfterRetrieve(state: ChatGraphStateType) {
    return state.documents.length > 0 ? "answerQuestion" : "noContext";
  }

  async function answerQuestionNode(state: ChatGraphStateType) {
    const result = await generateGroundedAnswer(state.standaloneQuestion, state.documents);
    return {
      answer: result.answer,
      citations: result.citations,
    };
  }
  
  function noContextNode(_state: ChatGraphStateType) {
    const result = createNoContextResult();
    return {
      answer: result.answer,
      citations: result.citations,
    };
  }

  const chatGraph = new StateGraph(ChatGraphState)
  .addNode("prepareQuestion", prepareQuestionNode)
  .addNode("retrieveSources", retrieveSourcesNode)
  .addNode("answerQuestion", answerQuestionNode)
  .addNode("noContext", noContextNode)
  .addEdge(START, "prepareQuestion")
  .addEdge("prepareQuestion", "retrieveSources")
  .addConditionalEdges("retrieveSources", routeAfterRetrieve, ["answerQuestion", "noContext"])
  .addEdge("answerQuestion", END)
  .addEdge("noContext", END)
  .compile();

  export type ChatGraphInput = {
    question: string;
    recentMessages: RecentChatMessage[];
    workspaceId: string;
    sourceIds: string[];
  };
  
  export type ChatGraphResult = {
    content: string;
    citations: ChatCitation[];
    standaloneQuestion: string;
    documents: LabeledDocument[];
  };

  export async function* runChatGraphStream(
    input: ChatGraphInput,
  ): AsyncGenerator<ChatStreamEvent, ChatGraphResult> {
    yield { type: "status", label: "Preparing question" };
    const standaloneQuestion = await prepareStandaloneQuestion(input.question, input.recentMessages);
  
    yield { type: "status", label: "Finding sources" };
    const documents = await retrieveLabeledDocuments({
      workspaceId: input.workspaceId,
      sourceIds: input.sourceIds,
      question: standaloneQuestion,
    });
  
    if (documents.length === 0) {
      const result = createNoContextResult();
      yield { type: "token", value: result.answer };
      return {
        content: result.answer,
        citations: result.citations,
        standaloneQuestion,
        documents,
      };
    }
  
    yield { type: "status", label: "Writing answer" };
    const answerStream = streamGroundedAnswer(standaloneQuestion, documents);
    let content = "";
    let citations: ChatCitation[] = [];
  
    while (true) {
      const next = await answerStream.next();
      if (next.done) {
        content = next.value.answer;
        citations = next.value.citations;
        break;
      }
      yield { type: "token", value: next.value };
    }
  
    return {
      content,
      citations,
      standaloneQuestion,
      documents,
    };
  }

  export async function runChatGraph(input: ChatGraphInput): Promise<ChatGraphResult> {
    const result = await chatGraph.invoke({
      question: input.question,
      recentMessages: input.recentMessages,
      standaloneQuestion: input.question,
      workspaceId: input.workspaceId,
      sourceIds: input.sourceIds,
      documents: [],
      answer: "",
      citations: [],
    });
  
    return {
      content: result.answer,
      citations: result.citations,
      standaloneQuestion: result.standaloneQuestion,
      documents: result.documents,
    };
  }
  
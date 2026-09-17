import { Annotation, END, START, StateGraph } from "@langchain/langgraph";


import { ARTIFACT_TYPE_LABELS, type ArtifactType } from "@/lib/artifact-types";
import type { ArtifactStreamEvent } from "@/lib/chat-stream-types";

import {
  generateFlashcardsArtifact,
  generateGlossaryArtifact,
  generateQuizArtifact,
  generateStudyGuideArtifact,
  generateSummaryArtifact,
reviseQuizArtifact,
} from "./artifacts/generators";
import { loadArtifactContext, type SourceLabel } from "./artifacts/load-context";
import type { ArtifactGenerationResult, ResolvedQuizArtifactContent } from "./artifacts/schemas";
import {
  createInvalidQuizFixture,
  QuizValidationError,
  validateQuiz,
} from "@/lib/ai/artifacts/validate-quiz";

const ArtifactGraphState = Annotation.Root({
    workspaceId: Annotation<string>,
    sourceIds: Annotation<string[]>,
    artifactType: Annotation<ArtifactType>,
    context: Annotation<string>,
    sourceLabels: Annotation<SourceLabel[]>,
    result: Annotation<ArtifactGenerationResult | null>,
    validationFeedback: Annotation<string>,
    revisionCount: Annotation<number>,
    quizValid: Annotation<boolean>,
  });

export type ArtifactGraphStateType = typeof ArtifactGraphState.State;

async function loadContextNode(state: ArtifactGraphStateType) {
    const loaded = await loadArtifactContext(state.workspaceId, state.sourceIds);
    return {
      context: loaded.context,
      sourceLabels: loaded.sourceLabels,
    };
  }

  function routeByArtifactType(state: ArtifactGraphStateType) {
    switch (state.artifactType) {
      case "SUMMARY":
        return "generateSummary";
      case "FLASHCARDS":
        return "generateFlashcards";
      case "QUIZ":
        return "generateQuiz";
      case "STUDY_GUIDE":
        return "generateStudyGuide";
      case "GLOSSARY":
        return "generateGlossary";
      default:
        return "generateSummary";
    }
  }

  async function generateSummaryNode(state: ArtifactGraphStateType) {
    const result = await generateSummaryArtifact(state.context, state.sourceLabels);
    return { result };
  }
  
  async function generateFlashcardsNode(state: ArtifactGraphStateType) {
    const result = await generateFlashcardsArtifact(state.context, state.sourceLabels);
    return { result };
  }

  async function generateQuizNode(state: ArtifactGraphStateType) {
    if (process.env.ARTIFACT_QUIZ_INVALID_FIXTURE === "true" && state.revisionCount === 0) {
      return { result: createInvalidQuizFixture(state.sourceLabels) };
    }
  
    const result = await generateQuizArtifact(state.context, state.sourceLabels);
    return { result };
  }

  async function generateStudyGuideNode(state: ArtifactGraphStateType) {
    const result = await generateStudyGuideArtifact(state.context, state.sourceLabels);
    return { result };
  }

  async function generateGlossaryNode(state: ArtifactGraphStateType) {
    const result = await generateGlossaryArtifact(state.context, state.sourceLabels);
    return { result };
  }

  function validateQuizNode(state: ArtifactGraphStateType) {
    const quiz = state.result as ResolvedQuizArtifactContent;
    const validation = validateQuiz(quiz);
  
    return {
      quizValid: validation.valid,
      validationFeedback: validation.feedback,
    };
  }

  function routeAfterQuizValidation(state: ArtifactGraphStateType) {
    if (state.quizValid) {
      return END;
    }
  
    if (state.revisionCount < 1) {
      return "reviseQuiz";
    }
  
    return "quizValidationFailed";
  }

  async function reviseQuizNode(state: ArtifactGraphStateType) {
    const result = await reviseQuizArtifact(
      state.context,
      state.sourceLabels,
      state.result as ResolvedQuizArtifactContent,
      state.validationFeedback,
    );
  
    return {
      result,
      revisionCount: state.revisionCount + 1,
    };
  }

  async function quizValidationFailedNode(state: ArtifactGraphStateType) {
    throw new QuizValidationError(
      `Could not produce a valid quiz after one revision. ${state.validationFeedback}`,
    );
  }

  const artifactGraph = new StateGraph(ArtifactGraphState)
  .addNode("loadContext", loadContextNode)
  .addNode("generateSummary", generateSummaryNode)
  .addNode("generateFlashcards", generateFlashcardsNode)
  .addNode("generateQuiz", generateQuizNode)
  .addNode("validateQuiz", validateQuizNode)
  .addNode("reviseQuiz", reviseQuizNode)
  .addNode("quizValidationFailed", quizValidationFailedNode)
  .addNode("generateStudyGuide", generateStudyGuideNode)
  .addNode("generateGlossary", generateGlossaryNode)
  .addEdge(START, "loadContext")
  .addConditionalEdges("loadContext", routeByArtifactType, [
    "generateSummary",
    "generateFlashcards",
    "generateQuiz",
    "generateStudyGuide",
    "generateGlossary",
  ])
  .addEdge("generateSummary", END)
  .addEdge("generateFlashcards", END)
  .addEdge("generateQuiz", "validateQuiz")
  .addConditionalEdges("validateQuiz", routeAfterQuizValidation, ["reviseQuiz", "quizValidationFailed", END])
  .addEdge("reviseQuiz", "validateQuiz")
  .addEdge("quizValidationFailed", END)
  .addEdge("generateStudyGuide", END)
  .addEdge("generateGlossary", END)
  .compile();

  export type ArtifactGraphInput = {
    workspaceId: string;
    sourceIds: string[];
    artifactType: ArtifactType;
  };

  const ARTIFACT_NODE_LABELS: Record<string, string> = {
    loadContext: "Loading sources",
    generateSummary: "Generating summary",
    generateFlashcards: "Generating flashcards",
    generateQuiz: "Generating quiz",
    validateQuiz: "Validating quiz",
    reviseQuiz: "Revising quiz",
    generateStudyGuide: "Generating study guide",
    generateGlossary: "Generating glossary",
  };
  
  function createInitialArtifactState(input: ArtifactGraphInput): ArtifactGraphStateType {
    return {
      workspaceId: input.workspaceId,
      sourceIds: input.sourceIds,
      artifactType: input.artifactType,
      context: "",
      sourceLabels: [],
      result: null,
      validationFeedback: "",
      revisionCount: 0,
      quizValid: false,
    };
  }

  export async function* runArtifactGraphStream(
    input: ArtifactGraphInput,
  ): AsyncGenerator<ArtifactStreamEvent, ArtifactGenerationResult> {
    yield {
      type: "status",
      label: `Generating ${ARTIFACT_TYPE_LABELS[input.artifactType].toLowerCase()}`,
    };
  
    let finalResult: ArtifactGenerationResult | null = null;
  
    for await (const update of await artifactGraph.stream(createInitialArtifactState(input), {
      streamMode: "updates",
    })) {
      for (const [nodeName, nodeState] of Object.entries(update)) {
        const label = ARTIFACT_NODE_LABELS[nodeName];
        if (label) {
          yield { type: "status", label };
        }
  
        if (
          nodeState &&
          typeof nodeState === "object" &&
          "result" in nodeState &&
          nodeState.result
        ) {
          finalResult = nodeState.result as ArtifactGenerationResult;
        }
      }
    }
  
    if (!finalResult) {
      throw new Error("Artifact generation did not produce a result");
    }
  
    return finalResult;
  }
  
  export async function runArtifactGraph(input: ArtifactGraphInput) {
    const result = await artifactGraph.invoke(createInitialArtifactState(input));
  
    if (!result.result) {
      throw new Error("Artifact generation did not produce a result");
    }
  
    return result.result;
  }
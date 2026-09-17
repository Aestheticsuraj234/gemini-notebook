import type {
    ResolvedFlashcardsArtifactContent,
    ResolvedGlossaryArtifactContent,
    ResolvedQuizArtifactContent,
    ResolvedStudyGuideArtifactContent,
    ResolvedSummaryArtifactContent,
  } from "@/lib/ai/artifacts/schemas";

export type ArtifactType = "SUMMARY" | "FLASHCARDS" | "QUIZ" | "STUDY_GUIDE" | "GLOSSARY";

type ArtifactBase = {
    id: string;
    title: string;
    sourceIds: string[];
    status: "READY" | "FAILED";
    errorMessage: string | null;
    createdAt: string;
  };


export type ArtifactItem =
| (ArtifactBase & { type: "SUMMARY"; content: ResolvedSummaryArtifactContent })
| (ArtifactBase & { type: "FLASHCARDS"; content: ResolvedFlashcardsArtifactContent })
| (ArtifactBase & { type: "QUIZ"; content: ResolvedQuizArtifactContent })
| (ArtifactBase & { type: "STUDY_GUIDE"; content: ResolvedStudyGuideArtifactContent })
| (ArtifactBase & { type: "GLOSSARY"; content: ResolvedGlossaryArtifactContent });

export const ARTIFACT_TYPES: ArtifactType[] = [
  "SUMMARY",
  "FLASHCARDS",
  "QUIZ",
  "STUDY_GUIDE",
  "GLOSSARY",
];

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  SUMMARY: "Summary",
  FLASHCARDS: "Flashcards",
  QUIZ: "Quiz",
  STUDY_GUIDE: "Study guide",
  GLOSSARY: "Glossary",
};

export const ARTIFACT_TYPE_DESCRIPTIONS: Record<ArtifactType, string> = {
  SUMMARY: "Overview and grounded key points.",
  FLASHCARDS: "Flip cards to review core facts.",
  QUIZ: "Five multiple-choice questions.",
  STUDY_GUIDE: "Structured notes by section.",
  GLOSSARY: "Key terms and definitions.",
};
  
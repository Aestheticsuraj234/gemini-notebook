import { z } from "zod";

const sourceRefSchema = z
  .string()
  .min(1)
  .describe("Source reference label such as S1 or S2 from the provided context");

export const summaryArtifactSchema = z.object({
  overview: z.string(),
  keyPoints: z.array(
    z.object({
      text: z.string(),
      sourceRef: sourceRefSchema,
    }),
  ),
});

export const flashcardsArtifactSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
      sourceRef: sourceRefSchema,
    }),
  ),
});

export const quizArtifactSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z
          .array(z.string())
          .min(4)
          .max(4)
          .describe("Exactly four multiple-choice options"),
        answerIndex: z.number().int().min(0).max(3),
        explanation: z.string(),
        sourceRef: sourceRefSchema,
      }),
    )
    .min(5)
    .max(5)
    .describe("Exactly five quiz questions"),
});

export const studyGuideArtifactSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      sourceRef: sourceRefSchema,
    }),
  ),
});

export const glossaryArtifactSchema = z.object({
  terms: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
      sourceRef: sourceRefSchema,
    }),
  ),
});

export type SummaryArtifactContent = z.infer<typeof summaryArtifactSchema>;
export type FlashcardsArtifactContent = z.infer<typeof flashcardsArtifactSchema>;
export type QuizArtifactContent = z.infer<typeof quizArtifactSchema>;
export type StudyGuideArtifactContent = z.infer<typeof studyGuideArtifactSchema>;
export type GlossaryArtifactContent = z.infer<typeof glossaryArtifactSchema>;

export type ResolvedSummaryArtifactContent = {
  overview: string;
  keyPoints: Array<{ text: string; sourceRef: string; sourceTitle: string }>;
};

export type ResolvedFlashcardsArtifactContent = {
  cards: Array<{ front: string; back: string; sourceRef: string; sourceTitle: string }>;
};

export type ResolvedQuizArtifactContent = {
  questions: Array<{
    question: string;
    options: [string, string, string, string];
    answerIndex: number;
    explanation: string;
    sourceRef: string;
    sourceTitle: string;
  }>;
};

export type ResolvedStudyGuideArtifactContent = {
  sections: Array<{ title: string; content: string; sourceRef: string; sourceTitle: string }>;
};

export type ResolvedGlossaryArtifactContent = {
  terms: Array<{ term: string; definition: string; sourceRef: string; sourceTitle: string }>;
};

export type ArtifactGenerationResult =
  | SummaryArtifactContent
  | FlashcardsArtifactContent
  | QuizArtifactContent
  | StudyGuideArtifactContent
  | GlossaryArtifactContent;

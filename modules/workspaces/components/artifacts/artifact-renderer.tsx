"use client";

import type { ArtifactItem } from "@/lib/artifact-types";

import FailedRenderer from "./failed-renderer";
import FlashcardsRenderer from "./flashcards-renderer";
import GlossaryRenderer from "./glossary-renderer";
import QuizRenderer from "./quiz-renderer";
import StudyGuideRenderer from "./study-guide-renderer";
import SummaryRenderer from "./summary-renderer";

type ArtifactRendererProps = {
  artifact: ArtifactItem;
  onOpenSource: (sourceId: string) => void;
  onRetry: () => void;
  retrying?: boolean;
};

export default function ArtifactRenderer({
  artifact,
  onOpenSource,
  onRetry,
  retrying,
}: ArtifactRendererProps) {
  if (artifact.status === "FAILED") {
    return <FailedRenderer artifact={artifact} onRetry={onRetry} retrying={retrying} />;
  }

  switch (artifact.type) {
    case "SUMMARY":
      return <SummaryRenderer artifact={artifact} onOpenSource={onOpenSource} />;
    case "FLASHCARDS":
      return <FlashcardsRenderer artifact={artifact} onOpenSource={onOpenSource} />;
    case "QUIZ":
      return <QuizRenderer artifact={artifact} onOpenSource={onOpenSource} />;
    case "STUDY_GUIDE":
      return <StudyGuideRenderer artifact={artifact} onOpenSource={onOpenSource} />;
    case "GLOSSARY":
      return <GlossaryRenderer artifact={artifact} onOpenSource={onOpenSource} />;
  }
}

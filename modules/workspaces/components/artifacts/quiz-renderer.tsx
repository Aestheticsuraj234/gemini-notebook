"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Quiz01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import type { ArtifactItem } from "@/lib/artifact-types";
import { cn } from "@/lib/utils";

import MarkdownContent from "@/components/markdown-content";
import SourceRefChip from "./source-ref-chip";

type QuizRendererProps = {
  artifact: Extract<ArtifactItem, { type: "QUIZ" }>;
  onOpenSource: (sourceId: string) => void;
};

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export default function QuizRenderer({ artifact, onOpenSource }: QuizRendererProps) {
  const questions = artifact.content.questions ?? [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => questions.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(() => questions.map(() => false));
  const [finished, setFinished] = useState(false);

  const score = useMemo(
    () =>
      questions.reduce((total, question, questionIndex) => {
        return answers[questionIndex] === question.answerIndex ? total + 1 : total;
      }, 0),
    [answers, questions],
  );

  if (questions.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Quiz01Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No quiz questions</EmptyTitle>
          <EmptyDescription>This quiz did not include any grounded questions.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  function restart() {
    setIndex(0);
    setAnswers(questions.map(() => null));
    setRevealed(questions.map(() => false));
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {score} / {questions.length} correct
          </p>
          <p className="text-xs text-muted-foreground">
            Review each question, or try the quiz again.
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {questions.map((question, questionIndex) => {
            const selected = answers[questionIndex];
            const correct = selected === question.answerIndex;

            return (
              <div key={question.question} className="space-y-2 border bg-muted/20 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium leading-relaxed">
                    {questionIndex + 1}. {question.question}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-medium",
                      correct ? "text-foreground" : "text-destructive",
                    )}
                  >
                    {correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <MarkdownContent className="text-[11px] text-muted-foreground">
                  {question.explanation}
                </MarkdownContent>
                <SourceRefChip
                  sourceRef={question.sourceRef}
                  sourceTitle={question.sourceTitle}
                  sourceIds={artifact.sourceIds}
                  onOpenSource={onOpenSource}
                />
              </div>
            );
          })}
        </div>
        <Button type="button" onClick={restart}>
          Try again
        </Button>
      </div>
    );
  }

  const question = questions[index];
  const selected = answers[index];
  const isRevealed = revealed[index];
  const progress = ((index + 1) / questions.length) * 100;

  function checkAnswer() {
    if (selected === null) {
      return;
    }

    setRevealed((current) => current.map((value, currentIndex) => (currentIndex === index ? true : value)));
  }

  function nextQuestion() {
    if (index === questions.length - 1) {
      setFinished(true);
      return;
    }

    setIndex((current) => current + 1);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Progress value={progress} className="gap-2">
        <p className="text-[11px] text-muted-foreground">
          Question {index + 1} of {questions.length}
        </p>
      </Progress>

      <div className="space-y-1">
        <p className="text-sm font-medium leading-relaxed">{question.question}</p>
      </div>

      <div className="grid gap-2">
        {question.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex;
          const isCorrect = optionIndex === question.answerIndex;

          return (
            <button
              key={option}
              type="button"
              disabled={isRevealed}
              onClick={() =>
                setAnswers((current) =>
                  current.map((value, currentIndex) => (currentIndex === index ? optionIndex : value)),
                )
              }
              className={cn(
                "flex items-start gap-2.5 border px-3 py-2.5 text-left text-xs transition-colors",
                !isRevealed && isSelected && "border-foreground/30 bg-muted",
                !isRevealed && !isSelected && "hover:bg-muted/50",
                isRevealed && isCorrect && "border-foreground/40 bg-muted",
                isRevealed && isSelected && !isCorrect && "border-destructive/40 bg-destructive/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center border text-[10px] font-medium",
                  isRevealed && isCorrect && "border-foreground bg-foreground text-background",
                  isRevealed && isSelected && !isCorrect && "border-destructive text-destructive",
                )}
              >
                {isRevealed && isCorrect ? (
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" />
                ) : (
                  OPTION_LABELS[optionIndex]
                )}
              </span>
              <span className="min-w-0 flex-1 leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>

      {isRevealed ? (
        <div className="space-y-2 border bg-muted/20 px-3 py-3">
          <p className="text-xs font-medium">
            {selected === question.answerIndex ? "Correct" : "Not quite"}
          </p>
          <MarkdownContent className="text-xs text-muted-foreground">{question.explanation}</MarkdownContent>
          <SourceRefChip
            sourceRef={question.sourceRef}
            sourceTitle={question.sourceTitle}
            sourceIds={artifact.sourceIds}
            onOpenSource={onOpenSource}
          />
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-end gap-2">
        {isRevealed ? (
          <Button type="button" onClick={nextQuestion}>
            {index === questions.length - 1 ? "See results" : "Next question"}
          </Button>
        ) : (
          <Button type="button" disabled={selected === null} onClick={checkAnswer}>
            Check answer
          </Button>
        )}
      </div>
    </div>
  );
}

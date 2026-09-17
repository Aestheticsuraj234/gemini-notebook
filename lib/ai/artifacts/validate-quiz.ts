import type { ResolvedQuizArtifactContent } from "./schemas";

export class QuizValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizValidationError";
  }
}

export type QuizValidationResult = {
  valid: boolean;
  feedback: string;
};

export function validateQuiz(content: ResolvedQuizArtifactContent): QuizValidationResult {
  const issues: string[] = [];

  if (content.questions.length !== 5) {
    issues.push(`Expected exactly 5 questions, got ${content.questions.length}.`);
  }

  content.questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;

    if (!question.question.trim()) {
      issues.push(`${label} text must not be empty.`);
    }

    if (question.options.length !== 4) {
      issues.push(`${label} must have exactly 4 options.`);
    }

    question.options.forEach((option, optionIndex) => {
      if (!option.trim()) {
        issues.push(`${label} option ${optionIndex + 1} must not be empty.`);
      }
    });

    if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) {
      issues.push(`${label} answerIndex must be an integer from 0 to 3.`);
    }
  });

  return {
    valid: issues.length === 0,
    feedback: issues.join(" "),
  };
}

export function createInvalidQuizFixture(sourceLabels: Array<{ refId: string; sourceTitle: string }>) {
  const sourceRef = sourceLabels[0]?.refId ?? "S1";
  const sourceTitle = sourceLabels[0]?.sourceTitle ?? "Source";

  return {
    questions: [
      {
        question: "What is the main topic?",
        options: ["Option A", "Option B", "Option C", ""] as [string, string, string, string],
        answerIndex: 0,
        explanation: "The first option is correct.",
        sourceRef,
        sourceTitle,
      },
      {
        question: "Which detail appears in the sources?",
        options: ["Detail 1", "Detail 2", "Detail 3", "Detail 4"] as [string, string, string, string],
        answerIndex: 1,
        explanation: "The second option matches the source.",
        sourceRef,
        sourceTitle,
      },
      {
        question: "What concept is emphasized?",
        options: ["Concept A", "Concept B", "Concept C", "Concept D"] as [string, string, string, string],
        answerIndex: 2,
        explanation: "The third option is supported by the text.",
        sourceRef,
        sourceTitle,
      },
      {
        question: "Which statement is accurate?",
        options: ["Statement A", "Statement B", "Statement C", "Statement D"] as [string, string, string, string],
        answerIndex: 3,
        explanation: "The fourth option is correct.",
        sourceRef,
        sourceTitle,
      },
    ],
  } satisfies ResolvedQuizArtifactContent;
}

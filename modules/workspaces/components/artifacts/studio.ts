import {
  BookOpenTextIcon,
  Cards01Icon,
  Note01Icon,
  Quiz01Icon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";

import {
  ARTIFACT_TYPE_DESCRIPTIONS,
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_TYPES,
  type ArtifactType,
} from "@/lib/artifact-types";

export const STUDIO_ITEMS = ARTIFACT_TYPES.map((type) => ({
  type,
  label: ARTIFACT_TYPE_LABELS[type],
  description: ARTIFACT_TYPE_DESCRIPTIONS[type],
  icon: studioIcon(type),
}));

export function studioIcon(type: ArtifactType) {
  switch (type) {
    case "SUMMARY":
      return BookOpenTextIcon;
    case "FLASHCARDS":
      return Cards01Icon;
    case "QUIZ":
      return Quiz01Icon;
    case "STUDY_GUIDE":
      return Note01Icon;
    case "GLOSSARY":
      return TextFontIcon;
  }
}

export function resolveArtifactSourceId(sourceIds: string[], sourceRef: string) {
  const match = /^S(\d+)$/.exec(sourceRef);
  if (!match) {
    return null;
  }

  const index = Number(match[1]) - 1;
  if (!Number.isInteger(index) || index < 0) {
    return null;
  }

  return sourceIds[index] ?? null;
}

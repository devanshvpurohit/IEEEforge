export interface PaperBuilderDraft {
  title: string;
  techStack: string;
  topics: string;
  roughExplanation: string;
  results: string;
  comparison: string;
  extraNotes: string;
}

export interface BuilderImage {
  id: string;
  mimeType: string;
  data: string;
  filename: string;
  caption: string;
}

export const EMPTY_BUILDER_DRAFT: PaperBuilderDraft = {
  title: "",
  techStack: "",
  topics: "",
  roughExplanation: "",
  results: "",
  comparison: "",
  extraNotes: "",
};

export function hasBuilderContent(draft: PaperBuilderDraft): boolean {
  return Boolean(
    draft.title.trim() ||
      draft.techStack.trim() ||
      draft.topics.trim() ||
      draft.roughExplanation.trim() ||
      draft.results.trim() ||
      draft.comparison.trim()
  );
}

export function isBuilderReadyForConvert(draft: PaperBuilderDraft): boolean {
  return Boolean(
    draft.title.trim() &&
      draft.roughExplanation.trim() &&
      (draft.results.trim() || draft.techStack.trim())
  );
}

export function buildContentFromBuilder(draft: PaperBuilderDraft): string {
  const parts: string[] = ["# Research brief for IEEE paper generation", ""];

  if (draft.title.trim()) parts.push(`## Title\n${draft.title.trim()}`);
  if (draft.techStack.trim()) parts.push(`## Tech stack / tools\n${draft.techStack.trim()}`);
  if (draft.topics.trim()) parts.push(`## Topics & domain\n${draft.topics.trim()}`);
  if (draft.roughExplanation.trim()) {
    parts.push(`## Problem, approach & methodology\n${draft.roughExplanation.trim()}`);
  }
  if (draft.results.trim()) parts.push(`## Results & findings\n${draft.results.trim()}`);
  if (draft.comparison.trim()) {
    parts.push(`## Comparison & evaluation\n${draft.comparison.trim()}`);
  }
  if (draft.extraNotes.trim()) parts.push(`## Additional notes\n${draft.extraNotes.trim()}`);

  return parts.join("\n\n");
}

export const BUILDER_STORAGE_KEY = "ieeeforge-paper-builder";

export function loadBuilderDraft(): PaperBuilderDraft {
  if (typeof window === "undefined") return { ...EMPTY_BUILDER_DRAFT };
  try {
    const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
    if (!raw) return { ...EMPTY_BUILDER_DRAFT };
    return { ...EMPTY_BUILDER_DRAFT, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_BUILDER_DRAFT };
  }
}

export function saveBuilderDraft(draft: PaperBuilderDraft): void {
  localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(draft));
}

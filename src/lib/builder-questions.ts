import type { PaperBuilderDraft } from "@/lib/paper-builder";

export type BuilderFieldKey = keyof PaperBuilderDraft;

export interface BuilderQuestion {
  id: string;
  field: BuilderFieldKey;
  question: string;
  placeholder: string;
  suggested_answer?: string;
}

export type WorkflowPath = "document" | "assistant" | "both";

export interface BuilderQuestionSet {
  intro: string;
  path_recommendation: WorkflowPath;
  questions: BuilderQuestion[];
}

export const FALLBACK_QUESTION_SET: BuilderQuestionSet = {
  intro:
    "I'll ask a few questions to shape your IEEE paper. Answer in your own words — you can edit any suggestion.",
  path_recommendation: "both",
  questions: [
    {
      id: "title",
      field: "title",
      question: "What is the title of your research paper?",
      placeholder: "Concise IEEE-style title",
    },
    {
      id: "topics",
      field: "topics",
      question: "What research area and main topics does this work cover?",
      placeholder: "e.g. machine learning, IoT, cybersecurity",
    },
    {
      id: "tech",
      field: "techStack",
      question: "Which technologies, tools, datasets, or frameworks did you use?",
      placeholder: "Languages, libraries, hardware, datasets…",
    },
    {
      id: "approach",
      field: "roughExplanation",
      question: "Describe the problem, your approach, and methodology.",
      placeholder: "Problem statement, architecture, methods…",
    },
    {
      id: "results",
      field: "results",
      question: "What results, metrics, or findings did you obtain?",
      placeholder: "Numbers, experiments, outcomes…",
    },
    {
      id: "comparison",
      field: "comparison",
      question: "How does your work compare to baselines or prior studies?",
      placeholder: "Benchmarks, ablations, related work…",
    },
    {
      id: "extra",
      field: "extraNotes",
      question: "Anything else the paper should include?",
      placeholder: "Limitations, future work, ethics…",
    },
  ],
};

export function normalizeQuestionSet(raw: Record<string, unknown>): BuilderQuestionSet {
  const validFields = new Set<BuilderFieldKey>([
    "title",
    "techStack",
    "topics",
    "roughExplanation",
    "results",
    "comparison",
    "extraNotes",
  ]);

  const questions = (Array.isArray(raw.questions) ? raw.questions : [])
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const q = item as Record<string, unknown>;
      const field = String(q.field ?? "extraNotes") as BuilderFieldKey;
      const safeField = validFields.has(field) ? field : "extraNotes";
      const question = String(q.question ?? "").trim();
      if (!question) return null;
      
      const bq: BuilderQuestion = {
        id: String(q.id ?? `q-${index}`),
        field: safeField,
        question,
        placeholder: String(q.placeholder ?? "Your answer…").trim(),
      };
      
      const suggested = String(q.suggested_answer ?? "").trim();
      if (suggested) {
        bq.suggested_answer = suggested;
      }
      
      return bq;
    })
    .filter((q): q is BuilderQuestion => q !== null);

  const path = String(raw.path_recommendation ?? "both");
  const path_recommendation: WorkflowPath =
    path === "document" || path === "assistant" ? path : "both";

  return {
    intro:
      String(raw.intro ?? "").trim() || FALLBACK_QUESTION_SET.intro,
    path_recommendation,
    questions: questions.length > 0 ? questions : FALLBACK_QUESTION_SET.questions,
  };
}

export function applySuggestedAnswers(
  draft: PaperBuilderDraft,
  questions: BuilderQuestion[]
): PaperBuilderDraft {
  const next = { ...draft };
  for (const q of questions) {
    if (q.suggested_answer && !next[q.field].trim()) {
      next[q.field] = q.suggested_answer;
    }
  }
  return next;
}

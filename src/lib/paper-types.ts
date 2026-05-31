export interface IEEESection {
  title: string;
  content: string;
}

export interface PaperFigure {
  number: number;
  caption: string;
  sectionTitle?: string;
  mimeType?: string;
  data?: string;
}

export interface IEEEPaper {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  sections: IEEESection[];
  references: string[];
  figures: PaperFigure[];
}

export interface PaperStats {
  sectionCount: number;
  totalWords: number;
  referenceCount: number;
  figureCount: number;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeSection(item: unknown, index: number): IEEESection | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const title = asString(record.title, `Section ${index + 1}`);
  let content = asString(record.content);
  if (!content || content === "..." || /^\.{3,}$/.test(content)) return null;
  content = content.replace(/\.\.\.\s*$/g, "").trim();
  return { title, content };
}

function normalizeFigure(item: unknown, index: number): PaperFigure | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const caption = asString(record.caption);
  if (!caption) return null;
  return {
    number: typeof record.number === "number" ? record.number : index + 1,
    caption,
    sectionTitle: asString(record.section_title || record.sectionTitle) || undefined,
    mimeType: asString(record.mimeType) || undefined,
    data: asString(record.data) || undefined,
  };
}

const PLACEHOLDER_PATTERNS = [
  /^\.{3,}$/i,
  /^\[content\]$/i,
  /^tbd$/i,
  /^to be (written|added|completed)/i,
  /^lorem ipsum/i,
];

export function isPlaceholderContent(text: string): boolean {
  const t = text.trim();
  if (t.length < 20) return PLACEHOLDER_PATTERNS.some((p) => p.test(t));
  return false;
}

export function normalizePaper(raw: Record<string, unknown>): IEEEPaper {
  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .map((s, i) => normalizeSection(s, i))
    .filter((s): s is IEEESection => s !== null && !isPlaceholderContent(s.content));

  const references = asStringArray(raw.references).filter((r) => !isPlaceholderContent(r));

  const figures = (Array.isArray(raw.figures) ? raw.figures : [])
    .map((f, i) => normalizeFigure(f, i))
    .filter((f): f is PaperFigure => f !== null);

  return {
    title: asString(raw.title, "Untitled IEEE Paper"),
    authors: asStringArray(raw.authors),
    abstract: asString(raw.abstract),
    keywords: asStringArray(raw.keywords),
    sections,
    references,
    figures,
  };
}

/** Safe paper object for UI/export (handles legacy API responses missing fields). */
export function ensurePaper(input: unknown): IEEEPaper {
  if (!input || typeof input !== "object") {
    return normalizePaper({});
  }

  const record = input as Record<string, unknown>;
  const normalized = normalizePaper(record);

  const partial = input as Partial<IEEEPaper>;
  return {
    title: asString(partial.title, normalized.title),
    authors: Array.isArray(partial.authors) ? partial.authors : normalized.authors,
    abstract: asString(partial.abstract, normalized.abstract),
    keywords: Array.isArray(partial.keywords) ? partial.keywords : normalized.keywords,
    sections: Array.isArray(partial.sections) ? partial.sections : normalized.sections,
    references: Array.isArray(partial.references)
      ? partial.references
      : normalized.references,
    figures: Array.isArray(partial.figures) ? partial.figures : normalized.figures,
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function getPaperStats(paper: IEEEPaper): PaperStats {
  const safe = ensurePaper(paper);
  const sectionWords = safe.sections.reduce((sum, s) => sum + countWords(s.content), 0);
  const abstractWords = countWords(safe.abstract);
  return {
    sectionCount: safe.sections.length,
    totalWords: sectionWords + abstractWords,
    referenceCount: safe.references.length,
    figureCount: safe.figures.length,
  };
}

export function expectedMinWords(sourceWordCount: number): number {
  if (sourceWordCount < 800) return 900;
  if (sourceWordCount < 2500) return 1800;
  if (sourceWordCount < 6000) return 3500;
  return 5000;
}

export function formatPaperAsText(paper: IEEEPaper): string {
  const safe = ensurePaper(paper);
  const lines: string[] = [];

  lines.push(safe.title.toUpperCase());
  lines.push("");

  if (safe.authors.length > 0) {
    lines.push(safe.authors.join("; "));
    lines.push("");
  }

  lines.push("Abstract—");
  lines.push(safe.abstract);
  lines.push("");

  if (safe.keywords.length > 0) {
    lines.push(`Index Terms—${safe.keywords.join(", ")}`);
    lines.push("");
  }

  for (const section of safe.sections) {
    lines.push(section.title.toUpperCase());
    lines.push("");
    lines.push(section.content);
    lines.push("");

    const sectionFigures = safe.figures.filter(
      (f) =>
        !f.sectionTitle ||
        section.title.toLowerCase().includes(f.sectionTitle.toLowerCase()) ||
        f.sectionTitle.toLowerCase().includes(section.title.toLowerCase())
    );
    for (const fig of sectionFigures) {
      lines.push(`[Figure ${fig.number}] ${fig.caption}`);
      lines.push("");
    }
  }

  const unplaced = safe.figures.filter(
    (f) => !safe.sections.some((s) => f.sectionTitle?.includes(s.title.slice(0, 8)))
  );
  if (unplaced.length > 0) {
    lines.push("FIGURES");
    lines.push("");
    for (const fig of unplaced) {
      lines.push(`Figure ${fig.number}. ${fig.caption}`);
    }
    lines.push("");
  }

  if (safe.references.length > 0) {
    lines.push("REFERENCES");
    lines.push("");
    for (const ref of safe.references) {
      lines.push(ref);
    }
  }

  return lines.join("\n").trim() + "\n";
}

export function formatSectionPreview(content: string, maxChars = 500): string {
  if (content.length <= maxChars) return content;
  const slice = content.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxChars)}…`;
}

export function attachImagesToPaper(
  paper: IEEEPaper,
  images: Array<{ mimeType: string; data: string; caption?: string }>
): IEEEPaper {
  const safe = ensurePaper(paper);
  if (images.length === 0) return safe;

  const figures: PaperFigure[] = images.map((img, index) => {
    const fromAi = safe.figures[index];
    return {
      number: index + 1,
      caption: fromAi?.caption || img.caption || `Figure ${index + 1}`,
      sectionTitle: fromAi?.sectionTitle,
      mimeType: img.mimeType,
      data: img.data,
    };
  });

  return { ...safe, figures };
}

import mammoth from "mammoth";

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text?.trim() ?? "";
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Could not read this PDF (${detail}). Try exporting as DOCX or TXT.`);
  }
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() ?? "";
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Could not read this DOCX (${detail}).`);
  }
}

export async function parseTxt(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8").trim();
}

export function getMetadata(content: string) {
  const trimmed = content.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  return {
    word_count: words.length,
    char_count: content.length,
    estimated_pages: Math.max(1, Math.ceil(words.length / 500)),
  };
}

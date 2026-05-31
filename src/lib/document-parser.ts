import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function parsePdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parseTxt(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

export function getMetadata(content: string) {
  const words = content.trim().split(/\s+/);
  return {
    word_count: words.length,
    char_count: content.length,
    estimated_pages: Math.max(1, Math.ceil(words.length / 500)),
  };
}

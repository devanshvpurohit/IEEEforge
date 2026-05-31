"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, ExternalLink, Loader2, RefreshCw, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiSettings } from "@/lib/settings-storage";

interface ResearchPaper {
  title: string;
  authors: string;
  venue: string;
  year: string;
  relevance: string;
  url: string;
}

interface ResearchPapersProps {
  settings: AiSettings;
  topics?: string;
  domain?: string;
  title?: string;
  visible?: boolean;
}

function PaperSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-white/8 bg-white/[0.02] space-y-2 animate-pulse">
      <div className="h-4 bg-white/10 rounded-lg w-3/4" />
      <div className="h-3 bg-white/6 rounded-lg w-1/2" />
      <div className="h-3 bg-white/6 rounded-lg w-full" />
      <div className="h-3 bg-white/6 rounded-lg w-4/5" />
    </div>
  );
}

function validatePaper(paper: unknown): paper is ResearchPaper {
  if (!paper || typeof paper !== "object") return false;
  const p = paper as Record<string, unknown>;
  return (
    typeof p.title === "string" &&
    typeof p.authors === "string" &&
    typeof p.venue === "string" &&
    typeof p.year === "string" &&
    typeof p.relevance === "string" &&
    typeof p.url === "string"
  );
}

export default function ResearchPapers({ settings, topics, domain, title, visible = true }: ResearchPapersProps) {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/research/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          gemini_key: settings.provider === "gemini" ? settings.geminiKey.trim() : undefined,
          gemini_model: settings.geminiModel,
          ollama_model: settings.ollamaModel,
          topics,
          domain,
          title,
        }),
      });
      const data = await res.json() as { papers?: unknown[]; error?: string; warning?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not fetch papers");
      
      // Validate and filter papers
      const validPapers = (data.papers ?? []).filter(validatePaper);
      if (validPapers.length === 0 && data.papers && data.papers.length > 0) {
        throw new Error("Received invalid paper data format");
      }
      
      setPapers(validPapers);
      setFetched(true);
      
      // Show warning if using fallback papers
      if (data.warning) {
        setError(data.warning);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load related papers";
      setError(message);
      console.error("Research papers error:", err);
    } finally {
      setLoading(false);
    }
  }, [settings, topics, domain, title]);

  const handleDownload = () => {
    if (papers.length === 0) return;
    
    // Format as BibTeX
    const bibtex = papers.map((paper, i) => {
      const key = `paper${i + 1}`;
      const year = paper.year || "2024";
      const cleanTitle = paper.title.replace(/[{}]/g, '');
      const cleanAuthors = paper.authors.replace(/ et al\./g, '');
      
      return `@article{${key},
  title={${cleanTitle}},
  author={${cleanAuthors}},
  journal={${paper.venue}},
  year={${year}},
  url={${paper.url}}
}`;
    }).join('\n\n');
    
    // Also create a plain text version
    const plainText = `Related Research Papers\n${'='.repeat(50)}\n\n` +
      papers.map((paper, i) => 
        `[${i + 1}] ${paper.title}\n` +
        `    Authors: ${paper.authors}\n` +
        `    Venue: ${paper.venue}\n` +
        `    Year: ${paper.year}\n` +
        `    URL: ${paper.url}\n` +
        `    Relevance: ${paper.relevance}\n`
      ).join('\n');
    
    // Download both formats
    const blob1 = new Blob([bibtex], { type: 'text/plain' });
    const url1 = URL.createObjectURL(blob1);
    const a1 = document.createElement('a');
    a1.href = url1;
    a1.download = 'references.bib';
    a1.click();
    URL.revokeObjectURL(url1);
    
    setTimeout(() => {
      const blob2 = new Blob([plainText], { type: 'text/plain' });
      const url2 = URL.createObjectURL(blob2);
      const a2 = document.createElement('a');
      a2.href = url2;
      a2.download = 'research-papers.txt';
      a2.click();
      URL.revokeObjectURL(url2);
    }, 100);
  };

  useEffect(() => {
    if (!visible || (!topics && !domain && !title)) return;
    if (fetched) return;
    void fetchPapers();
  }, [visible, topics, domain, title, fetched, fetchPapers]);

  if (!visible) return null;

  const hasTrigger = !!(topics || domain || title);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen size={18} className="text-[#D4AF37]" />
              Related Research Papers
            </CardTitle>
            <CardDescription>
              AI-curated papers relevant to your research topic
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {papers.length > 0 && !loading && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 shrink-0"
                onClick={handleDownload}
                title="Download as BibTeX and TXT"
              >
                <Download size={13} />
                Download
              </Button>
            )}
            {fetched && !loading && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 shrink-0"
                onClick={() => { setFetched(false); void fetchPapers(); }}
              >
                <RefreshCw size={13} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasTrigger && !loading && (
          <div className="text-sm text-white/40 text-center py-8 border border-dashed border-white/10 rounded-2xl">
            Complete the paper assistant or upload a document to see related papers.
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
              <Loader2 size={14} className="animate-spin text-[#D4AF37]" />
              Finding related IEEE papers…
            </div>
            {Array.from({ length: 4 }).map((_, i) => <PaperSkeleton key={i} />)}
          </div>
        )}

        {error && papers.length === 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Could not load papers</p>
              <p className="text-xs text-red-400 mt-1">{error}</p>
              <button
                onClick={() => void fetchPapers()}
                className="text-xs text-red-300 underline mt-2 hover:text-white"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {error && papers.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-950/40 border border-amber-500/20 rounded-2xl text-sm text-amber-300 mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Using Example Papers</p>
              <p className="text-xs text-amber-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && papers.length > 0 && (
          <div className="space-y-3">
            {papers.map((paper, i) => (
              <a
                key={i}
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full shrink-0">
                        [{i + 1}]
                      </span>
                      <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#f0c93a] transition-colors">
                        {paper.title}
                      </p>
                    </div>
                    <p className="text-xs text-white/50 mb-1">
                      {paper.authors} · <span className="text-[#D4AF37]/70">{paper.venue}</span> · {paper.year}
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {paper.relevance}
                    </p>
                  </div>
                  <ExternalLink
                    size={14}
                    className="shrink-0 text-white/20 group-hover:text-[#D4AF37] transition-colors mt-1"
                  />
                </div>
              </a>
            ))}
            <p className="text-xs text-white/30 text-center pt-2">
              AI-suggested references · verify before citing · Download as BibTeX for citations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

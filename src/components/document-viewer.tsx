"use client";

import { useState } from "react";
import { FileText, Copy, Trash2, ChevronDown, ChevronUp, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentViewerProps {
  filename: string;
  wordCount: number;
  estimatedPages: number;
  content: string;
  onClear?: () => void;
}

export default function DocumentViewer({
  filename,
  wordCount,
  estimatedPages,
  content,
  onClear,
}: DocumentViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const preview = content.slice(0, 800);
  const displayText = expanded ? content : preview;
  const hasMore = content.length > 800;

  const ext = filename.split(".").pop()?.toUpperCase() ?? "DOC";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{filename}</CardTitle>
              <CardDescription className="text-xs">
                Uploaded document
              </CardDescription>
            </div>
          </div>
          {onClear && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-white/30 hover:text-red-400 h-8 w-8"
              onClick={onClear}
              title="Remove document"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Words", value: wordCount.toLocaleString() },
            { label: "Pages", value: estimatedPages },
            { label: "Format", value: ext },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-xl bg-[#0a0a0a] border border-white/8 text-center"
            >
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Content preview */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <Eye size={12} />
              Document content
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-white/40 hover:text-white"
              onClick={handleCopy}
            >
              {copied ? (
                <><Check size={12} className="text-green-400" /> Copied</>
              ) : (
                <><Copy size={12} /> Copy</>
              )}
            </Button>
          </div>

          <div className="relative rounded-xl bg-[#070707] border border-white/8 overflow-hidden">
            <pre className="text-xs text-white/60 leading-relaxed p-4 whitespace-pre-wrap font-mono overflow-x-auto max-h-[240px] overflow-y-auto">
              {displayText}
              {!expanded && hasMore && "…"}
            </pre>

            {/* Fade overlay when collapsed */}
            {!expanded && hasMore && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#070707] to-transparent pointer-events-none" />
            )}
          </div>

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1.5 text-xs gap-1 text-white/40 hover:text-white"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <><ChevronUp size={13} /> Show less</>
              ) : (
                <><ChevronDown size={13} /> Show all {content.length.toLocaleString()} characters</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

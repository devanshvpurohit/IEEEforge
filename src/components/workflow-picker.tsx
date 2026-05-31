"use client";

import { FileSearch, MessageSquare, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowPath } from "@/lib/builder-questions";

interface WorkflowPickerProps {
  value: WorkflowPath | null;
  onChange: (path: WorkflowPath) => void;
}

const OPTIONS: {
  id: WorkflowPath;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "document",
    title: "Analyze my document",
    description: "Upload PDF, DOCX, or TXT — extract text and run AI readiness analysis.",
    icon: <FileSearch size={22} className="text-black" />,
  },
  {
    id: "assistant",
    title: "Paper assistant (Q&A)",
    description: "Answer AI-generated questions from scratch — no file required.",
    icon: <MessageSquare size={22} className="text-black" />,
  },
  {
    id: "both",
    title: "Both (recommended)",
    description: "Upload a report, then answer tailored questions before generating the full IEEE paper.",
    icon: <Layers size={22} className="text-black" />,
  },
];

export default function WorkflowPicker({ value, onChange }: WorkflowPickerProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>What do you want to do?</CardTitle>
        <CardDescription>Choose a path — you can change this anytime</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`text-left p-5 rounded-2xl border transition-all ${
              value === opt.id
                ? "border-[#D4AF37] bg-[#D4AF37]/15 ring-1 ring-[#D4AF37]"
                : "border-white/10 bg-[#0a0a0a] hover:border-white/25"
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37] flex items-center justify-center mb-4">
              {opt.icon}
            </div>
            <h3 className="font-bold text-white mb-2">{opt.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{opt.description}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

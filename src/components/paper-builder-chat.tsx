"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, MessageSquare, RefreshCw, Send, X, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EMPTY_BUILDER_DRAFT,
  isBuilderReadyForConvert,
  loadBuilderDraft,
  saveBuilderDraft,
  type BuilderImage,
  type PaperBuilderDraft,
} from "@/lib/paper-builder";
import {
  applySuggestedAnswers,
  FALLBACK_QUESTION_SET,
  type BuilderQuestion,
  type BuilderQuestionSet,
} from "@/lib/builder-questions";
import type { AiSettings } from "@/lib/settings-storage";
import { estimateConvertTime } from "@/lib/time-estimate";

interface PaperBuilderChatProps {
  settings: AiSettings;
  disabled?: boolean;
  isGenerating?: boolean;
  visible?: boolean;
  documentContent?: string;
  documentFilename?: string;
  documentSummary?: string;
  researchDomain?: string;
  reloadToken?: number;
  onGenerate: (draft: PaperBuilderDraft, images: BuilderImage[]) => void;
}

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  questionIndex?: number;
  isIntro?: boolean;
  isSuggestion?: boolean;
}

const MAX_IMAGE_BYTES = 1_200_000;

async function fileToBuilderImage(file: File): Promise<BuilderImage> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`"${file.name}" is too large. Use images under 1.2MB each.`);
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return {
    id: `${Date.now()}-${file.name}`,
    mimeType: file.type || "image/png",
    data: btoa(binary),
    filename: file.name,
    caption: "",
  };
}

export default function PaperBuilderChat({
  settings,
  disabled,
  isGenerating,
  visible = true,
  documentContent,
  documentFilename,
  documentSummary,
  researchDomain,
  reloadToken = 0,
  onGenerate,
}: PaperBuilderChatProps) {
  const [draft, setDraft] = useState<PaperBuilderDraft>(EMPTY_BUILDER_DRAFT);
  const [images, setImages] = useState<BuilderImage[]>([]);
  const [questionSet, setQuestionSet] = useState<BuilderQuestionSet | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(loadBuilderDraft());
  }, []);

  useEffect(() => {
    saveBuilderDraft(draft);
  }, [draft]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setQuestionsError(null);
    setChatMessages([]);
    setCurrentIndex(0);
    setInputValue("");

    try {
      const res = await fetch("/api/builder/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          gemini_key: settings.provider === "gemini" ? settings.geminiKey.trim() : undefined,
          gemini_model: settings.geminiModel,
          ollama_model: settings.ollamaModel,
          documentContent: documentContent ?? "",
          filename: documentFilename,
          analysisSummary: documentSummary,
          researchDomain,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.questions) {
        throw new Error(data.error ?? "Could not generate questions");
      }
      const set: BuilderQuestionSet = {
        intro: data.intro ?? FALLBACK_QUESTION_SET.intro,
        path_recommendation: data.path_recommendation ?? "both",
        questions: data.questions ?? FALLBACK_QUESTION_SET.questions,
      };
      setQuestionSet(set);
      setDraft((prev) => applySuggestedAnswers(prev, set.questions));
      if (data.error) setQuestionsError(data.error);

      // Start the chat with intro + first question
      setChatMessages([
        {
          id: "intro",
          role: "ai",
          text: set.intro,
          isIntro: true,
        },
      ]);
      setCurrentIndex(0);
      // Show first question after a brief delay
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setChatMessages((prev) => [
            ...prev,
            {
              id: `q-0`,
              role: "ai",
              text: set.questions[0]?.question ?? "",
              questionIndex: 0,
            },
          ]);
        }, 800);
      }, 700);
    } catch (err) {
      const fallback = FALLBACK_QUESTION_SET;
      setQuestionSet(fallback);
      setQuestionsError(err instanceof Error ? err.message : "Using default questions");
      setChatMessages([
        {
          id: "intro",
          role: "ai",
          text: fallback.intro,
          isIntro: true,
        },
        {
          id: "q-0",
          role: "ai",
          text: fallback.questions[0]?.question ?? "",
          questionIndex: 0,
        },
      ]);
      setCurrentIndex(0);
    } finally {
      setLoadingQuestions(false);
    }
  }, [settings, documentContent, documentFilename, documentSummary, researchDomain]);

  useEffect(() => {
    if (!visible) return;
    void loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reloadToken]);

  if (!visible) return null;

  const questions = questionSet?.questions ?? [];
  const answeredCount = questions.filter((q) => draft[q.field].trim()).length;
  const allAnswered = questions.length > 0 && answeredCount >= questions.length;

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || currentIndex >= questions.length) return;

    const current = questions[currentIndex];
    if (!current) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // Update draft
    setDraft((prev) => ({ ...prev, [current.field]: text }));

    const nextIndex = currentIndex + 1;

    if (nextIndex < questions.length) {
      // Show next question
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            id: `q-${nextIndex}`,
            role: "ai",
            text: questions[nextIndex].question,
            questionIndex: nextIndex,
          },
        ]);
        setCurrentIndex(nextIndex);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 700);
    } else {
      // All done
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            id: "done",
            role: "ai",
            text: "Perfect! I have everything I need. Click **Generate IEEE Paper** below to build your full paper. 🎉",
          },
        ]);
        setCurrentIndex(nextIndex);
      }, 700);
    }
  };

  const handleUseSuggestion = (question: BuilderQuestion) => {
    if (!question.suggested_answer) return;
    setInputValue(question.suggested_answer);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      const next = await Promise.all(files.slice(0, 6 - images.length).map(fileToBuilderImage));
      setImages((prev) => [...prev, ...next].slice(0, 6));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not add image");
    }
    e.target.value = "";
  };

  const convertEstimate = estimateConvertTime(
    documentContent ?? "",
    settings.provider,
    images.length,
    draft
  );

  const currentQuestion = questions[currentIndex];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="relative">
            <MessageSquare size={20} className="text-[#D4AF37]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#141414]" />
          </div>
          Paper Assistant
        </CardTitle>
        <CardDescription>AI coach — answers all your IEEE paper questions</CardDescription>

        {/* Progress bar */}
        {questions.length > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{answeredCount} of {questions.length} answered</span>
              {allAnswered && <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={12} /> Complete</span>}
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0c93a] rounded-full transition-all duration-500"
                style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1 min-h-0">
        {/* Chat window */}
        <div className="flex-1 min-h-[320px] max-h-[420px] overflow-y-auto rounded-2xl bg-[#0a0a0a] border border-white/10 p-4 space-y-4">
          {loadingQuestions && (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Loader2 className="animate-spin text-[#D4AF37]" size={16} />
              <span>Generating personalized questions…</span>
            </div>
          )}

          {questionsError && (
            <p className="text-xs text-amber-300 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
              ⚠ {questionsError}
            </p>
          )}

          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center shrink-0 text-black text-xs font-bold shadow-lg shadow-[#D4AF37]/20">
                  <Sparkles size={14} />
                </div>
              )}
              <div
                className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-white/[0.06] text-white/90 rounded-tl-sm border border-white/8"
                    : "bg-[#D4AF37] text-black font-medium rounded-tr-sm"
                }`}
              >
                {msg.text.split("**").map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}

                {/* Suggestion chip */}
                {msg.role === "ai" &&
                  msg.questionIndex !== undefined &&
                  questions[msg.questionIndex]?.suggested_answer &&
                  !draft[questions[msg.questionIndex].field]?.trim() && (
                    <button
                      onClick={() => handleUseSuggestion(questions[msg.questionIndex!])}
                      className="mt-2 block text-xs text-[#D4AF37] hover:text-[#f0c93a] underline underline-offset-2 transition-colors"
                    >
                      ✨ Use AI suggestion
                    </button>
                  )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-black" />
              </div>
              <div className="bg-white/[0.06] border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input row — only show if there are unanswered questions */}
        {!allAnswered && !loadingQuestions && questions.length > 0 && currentIndex < questions.length && (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              rows={2}
              className="flex-1 rounded-2xl border border-white/10 bg-[#f5f5f5] px-4 py-3 text-sm text-black placeholder:text-black/40 focus-visible:outline-none focus-visible:border-[#D4AF37] focus-visible:ring-1 focus-visible:ring-[#D4AF37] resize-none"
              placeholder={currentQuestion?.placeholder ?? "Type your answer…"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isTyping}
            />
            <Button
              type="button"
              variant="primary"
              size="icon"
              className="h-[72px] w-12 rounded-2xl shrink-0"
              onClick={handleSend}
              disabled={!inputValue.trim() || disabled || isTyping}
            >
              <Send size={18} />
            </Button>
          </div>
        )}

        {/* Image upload */}
        {(allAnswered || currentIndex >= questions.length) && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-sm text-[#D4AF37] font-medium flex items-center gap-2">
              <ImagePlus size={14} />
              Figures (optional)
            </p>
            <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-2xl p-3 cursor-pointer hover:border-[#D4AF37] transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImages}
                disabled={images.length >= 6}
              />
              <span className="text-xs text-white/60">Add images ({images.length}/6)</span>
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative rounded-xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:${img.mimeType};base64,${img.data}`}
                      alt={img.filename}
                      className="w-full h-16 object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-black"
                      onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={loadingQuestions}
            onClick={() => void loadQuestions()}
          >
            <RefreshCw size={13} />
            Restart
          </Button>
        </div>

        <Button
          type="button"
          variant="primary"
          className="w-full gap-2"
          disabled={disabled || isGenerating || loadingQuestions || !isBuilderReadyForConvert(draft)}
          onClick={() => onGenerate(draft, images)}
        >
          <Send size={18} />
          {isGenerating ? "Generating full paper…" : "Generate IEEE paper"}
        </Button>
        <p className="text-xs text-white/40 text-center">Estimated: {convertEstimate.label}</p>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Upload, File, Loader2, CheckCircle, AlertCircle, Settings, X, Download, Eye, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PaperPreviewModal from "@/components/paper-preview-modal";
import PaperBuilderChat from "@/components/paper-builder-chat";
import ProcessingTimer from "@/components/processing-timer";
import DocumentViewer from "@/components/document-viewer";
import ResearchPapers from "@/components/research-papers";
import { GEMINI_MODEL_OPTIONS } from "@/lib/gemini-models";
import {
  DEFAULT_AI_SETTINGS,
  loadAiSettings,
  saveAiSettings,
  type AiProvider,
} from "@/lib/settings-storage";
import {
  ensurePaper,
  formatPaperAsText,
  formatSectionPreview,
  getPaperStats,
  type IEEEPaper,
} from "@/lib/paper-types";
import {
  hasBuilderContent,
  loadBuilderDraft,
  type BuilderImage,
  type PaperBuilderDraft,
} from "@/lib/paper-builder";
import {
  estimateAnalysisTime,
  estimateConvertTime,
  type TimeEstimate,
} from "@/lib/time-estimate";
import {
  validateClientAiSettings,
  validateConvertInputs,
  validateImagePayload,
} from "@/lib/validate-client";

const selectClassName =
  "flex h-12 w-full rounded-2xl border border-white/10 bg-[#f5f5f5] px-4 py-3 text-sm text-black focus-visible:outline-none focus-visible:border-[#D4AF37] focus-visible:ring-1 focus-visible:ring-[#D4AF37]";

interface Analysis {
  filename: string;
  metadata: {
    word_count: number;
    char_count: number;
    estimated_pages: number;
  };
  analysis: {
    summary: string;
    research_domain: string;
    technical_complexity: string;
    readiness_score: number;
    detected_sections: string[];
    missing_sections: string[];
  } | null;
  content: string;
  analysis_error?: string;
  parsed_only?: boolean;
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [convertedPaper, setConvertedPaper] = useState<IEEEPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_AI_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaMessage, setOllamaMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [processingEstimate, setProcessingEstimate] = useState<TimeEstimate | null>(null);
  const [processingLabel, setProcessingLabel] = useState("");
  // Track draft from chat for research papers
  const [chatDraft, setChatDraft] = useState<PaperBuilderDraft | null>(null);
  const [chatBuilderToken, setChatBuilderToken] = useState(0);

  const isProcessing = isUploading || isConverting;

  useEffect(() => {
    setSettings(loadAiSettings());
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      setElapsedSeconds(0);
      setProcessingEstimate(null);
      return;
    }
    const started = Date.now();
    const tick = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [isProcessing]);

  const refreshOllama = async () => {
    setOllamaLoading(true);
    setOllamaMessage(null);
    try {
      const res = await axios.get("/api/ollama/discover");
      setOllamaConnected(res.data.connected);
      setOllamaModels(res.data.models ?? []);
      setOllamaMessage(res.data.message ?? null);
      const models: string[] = res.data.models ?? [];
      if (models.length > 0) {
        setSettings((prev) => ({
          ...prev,
          ollamaModel: models.includes(prev.ollamaModel) ? prev.ollamaModel : models[0],
        }));
      }
    } catch {
      setOllamaConnected(false);
      setOllamaModels([]);
      setOllamaMessage("Could not reach Ollama. Make sure `ollama serve` is running.");
    } finally {
      setOllamaLoading(false);
    }
  };

  useEffect(() => {
    if (showSettings && settings.provider === "ollama") {
      void refreshOllama();
    }
  }, [showSettings, settings.provider]);

  const handleSaveSettings = () => {
    saveAiSettings(settings);
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setAnalysis(null);
    setConvertedPaper(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file to upload"); return; }

    const configError = validateClientAiSettings(settings);
    if (configError) { setError(configError); setShowSettings(true); return; }

    setIsUploading(true);
    setError(null);
    setProcessingLabel("Analyzing document");
    setProcessingEstimate(estimateAnalysisTime(0, settings.provider));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", settings.provider);
    if (settings.provider === "gemini") {
      formData.append("gemini_key", settings.geminiKey.trim());
      formData.append("gemini_model", settings.geminiModel);
    } else {
      formData.append("ollama_model", settings.ollamaModel);
    }

    try {
      const res = await axios.post("/api/upload", formData);
      setAnalysis(res.data);
      // Reset chat so questions re-load with new doc context
      setChatBuilderToken((t) => t + 1);
      if (res.data.analysis_error) setError(res.data.analysis_error);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const apiError = axiosErr.response?.data?.error;
      if (axiosErr.response?.status === 500 && !apiError) {
        setError("Server error — try restarting the dev server.");
      } else {
        setError(apiError || "Failed to upload and analyze document. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const runConvert = async (draft?: PaperBuilderDraft, images: BuilderImage[] = []) => {
    const builder = draft ?? loadBuilderDraft();
    // Capture draft for research papers
    setChatDraft(builder);

    const inputError = validateConvertInputs(settings, analysis?.content, builder);
    if (inputError) {
      setError(inputError);
      if (inputError.includes("API key") || inputError.includes("Ollama")) setShowSettings(true);
      return;
    }

    const imageError = validateImagePayload(images);
    if (imageError) { setError(imageError); return; }

    setIsConverting(true);
    setError(null);
    setProcessingLabel("Generating full IEEE paper");
    setProcessingEstimate(
      estimateConvertTime(analysis?.content ?? "", settings.provider, images.length, builder)
    );

    const hasBuilder = hasBuilderContent(builder);
    try {
      const res = await axios.post("/api/convert", {
        content: analysis?.content ?? "",
        builder: hasBuilder ? builder : undefined,
        images: images.map((img) => ({
          id: img.id,
          mimeType: img.mimeType,
          data: img.data,
          filename: img.filename,
          caption: img.caption,
        })),
        provider: settings.provider,
        gemini_key: settings.provider === "gemini" ? settings.geminiKey.trim() : undefined,
        gemini_model: settings.provider === "gemini" ? settings.geminiModel : undefined,
        ollama_model: settings.provider === "ollama" ? settings.ollamaModel : undefined,
      });
      setConvertedPaper(ensurePaper(res.data));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const apiError = axiosErr.response?.data?.error;
      if (axiosErr.response?.status === 401 || apiError?.toLowerCase().includes("api key")) {
        setShowSettings(true);
      }
      setError(apiError || "Failed to convert document. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvert = () => void runConvert();

  const handleDownload = (format: "txt" | "json") => {
    if (!convertedPaper) return;
    const paper = ensurePaper(convertedPaper);
    const content = format === "json" ? JSON.stringify(paper, null, 2) : formatPaperAsText(paper);
    const filename = format === "json" ? "ieee-full-paper.json" : "ieee-full-paper.txt";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = async () => {
    if (!convertedPaper) return;
    try {
      const res = await axios.post("/api/export/docx", { paper: convertedPaper }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", "ieee_paper.docx");
      document.body.appendChild(link); link.click(); link.remove();
    } catch { setError("Failed to export as DOCX"); }
  };

  const handleExportLatex = async () => {
    if (!convertedPaper) return;
    try {
      const res = await axios.post("/api/export/latex", { paper: convertedPaper });
      const blob = new Blob([res.data.latex], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", "ieee_paper.tex");
      document.body.appendChild(link); link.click(); link.remove();
    } catch { setError("Failed to export as LaTeX"); }
  };

  // Derived values for research papers
  const researchTopic = chatDraft?.topics || analysis?.analysis?.research_domain || "";
  const researchDomain = analysis?.analysis?.research_domain || "";
  const researchTitle = chatDraft?.title || convertedPaper?.title || "";
  const showResearch = !!(researchTopic || researchDomain || researchTitle);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Dashboard</h1>
            <p className="text-white/60">
              Upload a report or use the AI assistant to generate a complete IEEE paper
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="gap-2">
            <Settings size={18} />
            Settings
          </Button>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>AI Configuration</CardTitle>
                      <CardDescription>Choose Gemini (cloud) or Ollama (local) and pick a model</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                      <X size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">AI Provider</label>
                      <select
                        value={settings.provider}
                        onChange={(e) => setSettings({ ...settings, provider: e.target.value as AiProvider })}
                        className={selectClassName}
                      >
                        <option value="gemini">Google Gemini (API key required)</option>
                        <option value="ollama">Ollama (local, auto-detected)</option>
                      </select>
                    </div>

                    {settings.provider === "gemini" ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-white">Gemini API Key</label>
                          <Input
                            type="password"
                            value={settings.geminiKey}
                            onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                            placeholder="Paste your Gemini API key"
                          />
                          <p className="text-xs text-white/50 mt-2">
                            Required for Gemini. Get a key from{" "}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
                              Google AI Studio
                            </a>.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-white">Gemini Model</label>
                          <select
                            value={settings.geminiModel}
                            onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                            className={selectClassName}
                          >
                            {GEMINI_MODEL_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                          </select>
                          <p className="text-xs text-white/50 mt-2">
                            Auto tries multiple Gemini models if your key does not support the first one.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-2xl border border-white/10 bg-[#0a0a0a] space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`text-sm font-medium ${ollamaConnected ? "text-green-400" : "text-amber-300"}`}>
                              {ollamaLoading ? "Searching for Ollama..." : ollamaConnected ? "Ollama detected" : "Ollama not found"}
                            </span>
                            <Button type="button" variant="outline" size="sm" onClick={refreshOllama} disabled={ollamaLoading}>
                              {ollamaLoading ? <Loader2 className="animate-spin" size={16} /> : "Refresh"}
                            </Button>
                          </div>
                          {ollamaMessage && <p className="text-xs text-white/50">{ollamaMessage}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-white">Ollama Model</label>
                          <select
                            value={settings.ollamaModel}
                            onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                            className={selectClassName}
                            disabled={ollamaModels.length === 0}
                          >
                            {ollamaModels.length === 0 ? (
                              <option value="">No models — run ollama pull llama3.2</option>
                            ) : (
                              ollamaModels.map((name) => <option key={name} value={name}>{name}</option>)
                            )}
                          </select>
                          <p className="text-xs text-white/50 mt-2">
                            Scans <code className="text-[#D4AF37]">localhost:11434</code> automatically when you open Settings.
                          </p>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <Button type="button" variant="primary" className="gap-2" onClick={handleSaveSettings}>
                        <Save size={18} />
                        Save Settings
                      </Button>
                      {settingsSaved && (
                        <span className="text-sm text-green-400 flex items-center gap-2">
                          <CheckCircle size={16} /> Saved to this browser
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40">
                      Keys and provider choice are stored in your browser only — never on our servers.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing timer */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <ProcessingTimer
                active={isProcessing}
                elapsedSeconds={elapsedSeconds}
                estimate={processingEstimate}
                label={processingLabel}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-200">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main 3-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN — Chat + Upload + Document Viewer */}
          <div className="lg:col-span-1 space-y-6">
            <PaperBuilderChat
              settings={settings}
              disabled={isConverting || isUploading}
              isGenerating={isConverting}
              documentContent={analysis?.content}
              documentFilename={analysis?.filename}
              documentSummary={analysis?.analysis?.summary}
              researchDomain={analysis?.analysis?.research_domain}
              reloadToken={chatBuilderToken}
              onGenerate={(draft, images) => {
                setChatDraft(draft);
                void runConvert(draft, images);
              }}
            />

            {/* Upload card */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                  Select a file to analyze and convert ({estimateAnalysisTime(2000, settings.provider).label})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="relative border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-[#D4AF37] transition-colors cursor-pointer group">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.txt,.md"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                        <Upload size={20} className="text-white/40 group-hover:text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file ? file.name : "Drag & drop or click to browse"}</p>
                        <p className="text-xs text-white/40 mt-1">PDF, DOCX, TXT, MD (max 10MB)</p>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={!file || isUploading} className="w-full gap-2" size="lg">
                    {isUploading ? (
                      <><Loader2 className="animate-spin" size={18} /> Analyzing...</>
                    ) : (
                      <><Upload size={18} /> Analyze Document</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Document Viewer — appears after upload */}
            <AnimatePresence>
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DocumentViewer
                    filename={analysis.filename}
                    wordCount={analysis.metadata.word_count}
                    estimatedPages={analysis.metadata.estimated_pages}
                    content={analysis.content}
                    onClear={() => {
                      setAnalysis(null);
                      setFile(null);
                      setConvertedPaper(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN — Results / Analysis / Empty state + Research Papers */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {convertedPaper ? (
                <motion.div key="converted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Full IEEE Paper</CardTitle>
                          <CardDescription>
                            {(() => {
                              const s = getPaperStats(ensurePaper(convertedPaper));
                              return `${s.totalWords.toLocaleString()} words · ${s.sectionCount} sections · ${s.referenceCount} references · ${s.figureCount} figures`;
                            })()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                          <CheckCircle size={14} />
                          CONVERTED
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 max-h-[32rem] overflow-y-auto space-y-6">
                        {(() => {
                          const paper = ensurePaper(convertedPaper);
                          return (
                            <>
                              <div>
                                <h2 className="text-2xl font-bold text-white text-center leading-tight">{paper.title}</h2>
                                {paper.authors.length > 0 && (
                                  <p className="text-sm text-white/60 text-center mt-3">{paper.authors.join(" · ")}</p>
                                )}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-[#D4AF37] uppercase mb-2">Abstract</h3>
                                <p className="text-sm leading-relaxed text-white/80 text-justify whitespace-pre-wrap">{paper.abstract}</p>
                              </div>
                              {paper.keywords.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-bold text-[#D4AF37] uppercase mb-2">Index Terms</h3>
                                  <p className="text-sm text-white/80">{paper.keywords.join(", ")}</p>
                                </div>
                              )}
                              {paper.figures.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {paper.figures.map((fig) => (
                                    <figure key={fig.number} className="rounded-xl border border-white/10 overflow-hidden">
                                      {fig.data && fig.mimeType && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={`data:${fig.mimeType};base64,${fig.data}`} alt={fig.caption} className="w-full h-32 object-cover bg-black" />
                                      )}
                                      <figcaption className="text-xs p-2 text-white/70">Fig. {fig.number}. {fig.caption}</figcaption>
                                    </figure>
                                  ))}
                                </div>
                              )}
                              <div className="space-y-5">
                                {paper.sections.map((section, i) => (
                                  <div key={i} className="border-t border-white/10 pt-4">
                                    <h3 className="font-bold mb-2 text-white">{section.title}</h3>
                                    <p className="text-sm text-white/70 leading-relaxed text-justify whitespace-pre-wrap">
                                      {formatSectionPreview(section.content, 600)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {paper.references.length > 0 && (
                                <div className="border-t border-white/10 pt-4">
                                  <h3 className="text-sm font-bold text-[#D4AF37] uppercase mb-2">References</h3>
                                  <ol className="text-sm text-white/70 space-y-2 list-decimal list-inside">
                                    {paper.references.map((ref, i) => (
                                      <li key={i} className="leading-relaxed">{ref}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-white/40 text-center">
                        Card shows section excerpts. Use Preview or Download for the complete paper.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Button onClick={() => setShowPreview(true)} variant="primary" className="gap-2">
                          <Eye size={18} /> Preview
                        </Button>
                        <Button onClick={() => handleExportDocx()} variant="default" className="gap-2">
                          <Download size={18} /> DOCX
                        </Button>
                        <Button onClick={() => handleExportLatex()} variant="default" className="gap-2">
                          <Download size={18} /> LaTeX
                        </Button>
                        <Button onClick={() => handleDownload("txt")} variant="outline" className="gap-2">
                          <Download size={18} /> Text
                        </Button>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => handleDownload("json")} variant="ghost" className="w-full gap-2">
                          <Download size={18} /> Download JSON Data
                        </Button>
                      </div>
                      <Button
                        onClick={() => { setConvertedPaper(null); setAnalysis(null); setFile(null); setChatDraft(null); }}
                        variant="ghost"
                        className="w-full"
                      >
                        Start New Conversion
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : analysis ? (
                <motion.div key="analysis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Analysis Results</CardTitle>
                          <CardDescription>{analysis.filename}</CardDescription>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${analysis.analysis ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-300"}`}>
                          <CheckCircle size={14} />
                          {analysis.analysis ? "ANALYZED" : "UPLOADED"}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!analysis.analysis && (
                        <p className="text-sm text-amber-200/90 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                          Document parsed successfully. AI analysis did not run — check Settings (Gemini API key or Ollama) and try again.
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 text-center">
                          <div className="text-2xl font-bold text-white">{analysis.metadata.word_count.toLocaleString()}</div>
                          <div className="text-xs text-white/60 mt-1">Words</div>
                        </div>
                        <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 text-center">
                          <div className="text-2xl font-bold text-white">{analysis.metadata.estimated_pages}</div>
                          <div className="text-xs text-white/60 mt-1">Pages</div>
                        </div>
                        <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 text-center">
                          <div className="text-2xl font-bold">
                            {analysis.analysis ? Math.round(analysis.analysis.readiness_score * 100) : "N/A"}%
                          </div>
                          <div className="text-xs text-white/60 mt-1">Readiness</div>
                        </div>
                      </div>
                      {analysis.analysis && (
                        <>
                          <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10">
                            <h3 className="text-xs font-bold text-[#D4AF37] uppercase mb-3">Summary</h3>
                            <p className="text-sm leading-relaxed text-white/80">{analysis.analysis.summary}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10">
                              <h3 className="text-xs font-bold text-[#D4AF37] uppercase mb-3">Research Domain</h3>
                              <p className="text-sm font-medium text-white">{analysis.analysis.research_domain}</p>
                            </div>
                            <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10">
                              <h3 className="text-xs font-bold text-[#D4AF37] uppercase mb-3">Technical Complexity</h3>
                              <p className="text-sm font-medium text-white">{analysis.analysis.technical_complexity}</p>
                            </div>
                          </div>
                          {analysis.analysis.detected_sections?.length > 0 && (
                            <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10">
                              <h3 className="text-xs font-bold text-[#D4AF37] uppercase mb-3">Detected Sections</h3>
                              <div className="flex flex-wrap gap-2">
                                {analysis.analysis.detected_sections.map((section, i) => (
                                  <span key={i} className="px-3 py-1 bg-[#D4AF37] text-black text-xs rounded-full">{section}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysis.analysis.missing_sections?.length > 0 && (
                            <div className="p-6 bg-orange-500/10 rounded-2xl border border-orange-500/30">
                              <h3 className="text-xs font-bold text-orange-300 uppercase mb-3">Missing Sections</h3>
                              <div className="flex flex-wrap gap-2">
                                {analysis.analysis.missing_sections.map((section, i) => (
                                  <span key={i} className="px-3 py-1 bg-orange-500/30 text-orange-200 text-xs rounded-full">{section}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <Button onClick={handleConvert} disabled={isConverting} variant="primary" size="lg" className="w-full gap-2">
                        {isConverting ? (
                          <><Loader2 className="animate-spin" size={18} /> Building full IEEE paper…</>
                        ) : (
                          <><CheckCircle size={18} /> Convert to full IEEE paper</>
                        )}
                      </Button>
                      {!isConverting && (
                        <p className="text-xs text-white/40 text-center">
                          Estimated time:{" "}
                          {estimateConvertTime(analysis.content, settings.provider, 0, loadBuilderDraft()).label}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[300px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/20 bg-[#141414]"
                >
                  <File size={64} className="mb-4" />
                  <p className="font-medium text-lg">Ready to convert</p>
                  <p className="text-sm mt-2 text-center px-4">
                    Use the paper assistant or upload a document, then generate your IEEE paper
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Research Papers Section */}
            <AnimatePresence>
              {showResearch && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ delay: 0.2 }}
                >
                  <ResearchPapers
                    settings={settings}
                    topics={researchTopic}
                    domain={researchDomain}
                    title={researchTitle}
                    visible={showResearch}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {convertedPaper && (
        <PaperPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          paper={ensurePaper(convertedPaper)}
        />
      )}
    </div>
  );
}

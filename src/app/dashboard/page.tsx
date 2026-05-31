"use client";

import { useState } from "react";
import axios from "axios";
import { Upload, File, Loader2, CheckCircle, AlertCircle, Settings, X, Download, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PaperPreviewModal from "@/components/paper-preview-modal";

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
  };
  content: string;
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [convertedPaper, setConvertedPaper] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState({
    geminiKey: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setAnalysis(null);
    setConvertedPaper(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    if (settings.geminiKey) {
      formData.append("gemini_key", settings.geminiKey);
    }

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysis(res.data);
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err.response?.data?.error || "Failed to upload and analyze document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConvert = async () => {
    if (!analysis?.content) return;

    setIsConverting(true);
    setError(null);

    try {
      const res = await axios.post("/api/convert", {
        content: analysis.content,
        gemini_key: settings.geminiKey,
      });
      setConvertedPaper(res.data);
    } catch (err: any) {
      console.error("Conversion failed", err);
      setError(err.response?.data?.error || "Failed to convert document. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = (format: "txt" | "json") => {
    if (!convertedPaper) return;

    let content = "";
    let filename = "";

    if (format === "json") {
      content = JSON.stringify(convertedPaper, null, 2);
      filename = "ieee-paper.json";
    } else {
      content = `${convertedPaper.title}\n\n`;
      content += `ABSTRACT\n${convertedPaper.abstract}\n\n`;
      content += `KEYWORDS: ${convertedPaper.keywords?.join(", ")}\n\n`;
      convertedPaper.sections?.forEach((section: any) => {
        content += `${section.title}\n${section.content}\n\n`;
      });
      content += `REFERENCES\n`;
      convertedPaper.references?.forEach((ref: string) => {
        content += `${ref}\n`;
      });
      filename = "ieee-paper.txt";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-black/60">Upload your report to begin the IEEE conversion</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings size={18} />
            Settings
          </Button>
        </div>

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
                      <CardDescription>Configure your Gemini API key for AI processing</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                      <X size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Gemini API Key</label>
                      <Input
                        type="password"
                        value={settings.geminiKey}
                        onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                        placeholder="Enter your Gemini API key (optional)"
                      />
                      <p className="text-xs text-black/40 mt-2">
                        Leave empty to use the default server key. Get your key from{" "}
                        <a
                          href="https://makersuite.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D4AF37] hover:underline"
                        >
                          Google AI Studio
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>Select a file to analyze and convert</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="relative border-2 border-dashed border-black/10 rounded-2xl p-8 text-center hover:border-[#D4AF37] transition-colors cursor-pointer group">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.txt,.md"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                        <Upload size={20} className="text-black/40 group-hover:text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {file ? file.name : "Drag & drop or click to browse"}
                        </p>
                        <p className="text-xs text-black/40 mt-1">PDF, DOCX, TXT, MD (max 10MB)</p>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={!file || isUploading} className="w-full gap-2" size="lg">
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Analyze Document
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {convertedPaper ? (
                <motion.div key="converted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>IEEE Paper Preview</CardTitle>
                          <CardDescription>Your converted paper is ready</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle size={14} />
                          CONVERTED
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5 max-h-96 overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">{convertedPaper.title}</h2>
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-black/40 uppercase mb-2">Abstract</h3>
                          <p className="text-sm leading-relaxed">{convertedPaper.abstract}</p>
                        </div>
                        {convertedPaper.keywords && (
                          <div className="mb-4">
                            <h3 className="text-sm font-bold text-black/40 uppercase mb-2">Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                              {convertedPaper.keywords.map((kw: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-black text-white text-xs rounded-full">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="space-y-4">
                          {convertedPaper.sections?.map((section: any, i: number) => (
                            <div key={i}>
                              <h3 className="font-bold mb-2">{section.title}</h3>
                              <p className="text-sm text-black/60 leading-relaxed">
                                {section.content.substring(0, 200)}...
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => setShowPreview(true)} variant="primary" className="flex-1 gap-2">
                          <Eye size={18} />
                          Preview Paper
                        </Button>
                        <Button onClick={() => handleDownload("txt")} variant="default" className="flex-1 gap-2">
                          <Download size={18} />
                          Download TXT
                        </Button>
                        <Button onClick={() => handleDownload("json")} variant="outline" className="flex-1 gap-2">
                          <Download size={18} />
                          Download JSON
                        </Button>
                      </div>
                      <Button onClick={() => { setConvertedPaper(null); setAnalysis(null); setFile(null); }} variant="ghost" className="w-full">
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
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle size={14} />
                          ANALYZED
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-black/5 text-center">
                          <div className="text-2xl font-bold">{analysis.metadata.word_count.toLocaleString()}</div>
                          <div className="text-xs text-black/60 mt-1">Words</div>
                        </div>
                        <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-black/5 text-center">
                          <div className="text-2xl font-bold">{analysis.metadata.estimated_pages}</div>
                          <div className="text-xs text-black/60 mt-1">Pages</div>
                        </div>
                        <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-black/5 text-center">
                          <div className="text-2xl font-bold">
                            {analysis.analysis ? Math.round(analysis.analysis.readiness_score * 100) : "N/A"}%
                          </div>
                          <div className="text-xs text-black/60 mt-1">Readiness</div>
                        </div>
                      </div>
                      {analysis.analysis && (
                        <>
                          <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                            <h3 className="text-xs font-bold text-black/40 uppercase mb-3">Summary</h3>
                            <p className="text-sm leading-relaxed">{analysis.analysis.summary}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                              <h3 className="text-xs font-bold text-black/40 uppercase mb-3">Research Domain</h3>
                              <p className="text-sm font-medium">{analysis.analysis.research_domain}</p>
                            </div>
                            <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                              <h3 className="text-xs font-bold text-black/40 uppercase mb-3">Technical Complexity</h3>
                              <p className="text-sm font-medium">{analysis.analysis.technical_complexity}</p>
                            </div>
                          </div>
                          {analysis.analysis.detected_sections && analysis.analysis.detected_sections.length > 0 && (
                            <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                              <h3 className="text-xs font-bold text-black/40 uppercase mb-3">Detected Sections</h3>
                              <div className="flex flex-wrap gap-2">
                                {analysis.analysis.detected_sections.map((section, i) => (
                                  <span key={i} className="px-3 py-1 bg-black text-white text-xs rounded-full">
                                    {section}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysis.analysis.missing_sections && analysis.analysis.missing_sections.length > 0 && (
                            <div className="p-6 bg-orange-50 rounded-2xl border border-orange-200">
                              <h3 className="text-xs font-bold text-orange-900 uppercase mb-3">Missing Sections</h3>
                              <div className="flex flex-wrap gap-2">
                                {analysis.analysis.missing_sections.map((section, i) => (
                                  <span key={i} className="px-3 py-1 bg-orange-200 text-orange-900 text-xs rounded-full">
                                    {section}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <Button onClick={handleConvert} disabled={isConverting} variant="primary" size="lg" className="w-full gap-2">
                        {isConverting ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Converting to IEEE Format...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Convert to IEEE Paper
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-[500px] border-2 border-dashed border-black/5 rounded-3xl flex flex-col items-center justify-center text-black/20 bg-white">
                  <File size={64} className="mb-4" />
                  <p className="font-medium text-lg">No document uploaded</p>
                  <p className="text-sm mt-2">Upload a document to see analysis results</p>
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
          paper={convertedPaper}
        />
      )}
    </div>
  );
}

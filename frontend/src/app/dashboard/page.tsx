"use client";

import { useState } from "react";
import axios from "axios";
import { Upload, File, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    geminiKey: "",
    ollamaUrl: "http://localhost:11434",
    preferOllama: false
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("gemini_key", settings.geminiKey);
    formData.append("ollama_url", settings.ollamaUrl);
    formData.append("prefer_ollama", String(settings.preferOllama));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await axios.post(`${apiUrl}/v1/documents/upload`, formData);
      setAnalysis(res.data);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Workspace</h1>
            <p className="text-black/60">Upload your report to begin the IEEE conversion.</p>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-white border border-black/5 rounded-2xl hover:bg-black/5 transition-colors"
          >
            Settings
          </button>
        </header>

        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8 bg-white p-8 rounded-3xl border border-black/5 shadow-sm overflow-hidden"
          >
            <h2 className="text-xl font-bold mb-6">AI Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-black/60">Gemini API Key</label>
                <input 
                  type="password"
                  value={settings.geminiKey}
                  onChange={(e) => setSettings({...settings, geminiKey: e.target.value})}
                  placeholder="Paste your Gemini key here"
                  className="w-full p-4 bg-[#FAFAFA] border border-black/5 rounded-2xl text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-black/60">Ollama Local URL</label>
                <input 
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => setSettings({...settings, ollamaUrl: e.target.value})}
                  placeholder="http://localhost:11434"
                  className="w-full p-4 bg-[#FAFAFA] border border-black/5 rounded-2xl text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <input 
                type="checkbox"
                id="preferOllama"
                checked={settings.preferOllama}
                onChange={(e) => setSettings({...settings, preferOllama: e.target.checked})}
                className="w-5 h-5 accent-[#D4AF37]"
              />
              <label htmlFor="preferOllama" className="text-sm font-medium text-black/60">Prefer Local Ollama (fallback to Gemini)</label>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Upload Document</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="relative border-2 border-dashed border-black/10 rounded-2xl p-8 text-center hover:border-[#D4AF37] transition-colors cursor-pointer group">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.docx,.txt,.md"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                      <Upload size={20} className="text-black/40 group-hover:text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file ? file.name : "Drag & drop file"}</p>
                      <p className="text-xs text-black/40">PDF, DOCX, TXT, MD</p>
                    </div>
                  </div>
                </div>
                <button
                  disabled={!file || isUploading}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold disabled:bg-black/20 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : "Start Analysis"}
                </button>
              </form>
            </div>
          </div>

          {/* Analysis View */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-bold">AI Analysis Dashboard</h2>
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle size={14} /> Processed
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                          <p className="text-xs font-bold text-black/40 uppercase mb-2">Summary</p>
                          <p className="text-sm leading-relaxed">{analysis.analysis?.summary || "No summary available"}</p>
                        </div>
                        <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                          <p className="text-xs font-bold text-black/40 uppercase mb-2">Research Domain</p>
                          <p className="text-sm font-medium">{analysis.analysis?.research_domain || "Unknown"}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                          <p className="text-xs font-bold text-black/40 uppercase mb-2">Publication Readiness</p>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold">{((analysis.analysis?.readiness_score || 0) * 100).toFixed(0)}%</span>
                            <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full bg-[#D4AF37]" 
                                style={{ width: `${(analysis.analysis?.readiness_score || 0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5">
                          <p className="text-xs font-bold text-black/40 uppercase mb-2">Technical Complexity</p>
                          <p className="text-sm font-medium">{analysis.analysis?.technical_complexity || "Unknown"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-sm font-bold text-black/40 uppercase mb-4">Detected Sections</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.analysis?.detected_sections?.map((s: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full">{s}</span>
                        )) || "None"}
                      </div>
                    </div>
                    
                    <button className="w-full mt-10 py-4 bg-[#D4AF37] text-white rounded-2xl font-bold hover:bg-[#D4AF37]/90 transition-colors">
                      Convert to IEEE Paper
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed border-black/5 rounded-3xl flex flex-col items-center justify-center text-black/20">
                  <File size={48} className="mb-4" />
                  <p className="font-medium">Upload a document to see analysis</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

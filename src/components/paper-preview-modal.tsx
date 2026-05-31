"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { ensurePaper, type IEEEPaper } from "@/lib/paper-types";

interface PaperPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: IEEEPaper;
}

export default function PaperPreviewModal({ isOpen, onClose, paper: rawPaper }: PaperPreviewModalProps) {
  if (!isOpen) return null;
  const paper = ensurePaper(rawPaper);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-white/10 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto text-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#141414] z-10">
                <h2 className="text-2xl font-bold">Full Paper Preview</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="prose prose-sm max-w-none prose-invert">
                  <h1 className="text-3xl font-bold text-center mb-4 leading-tight text-white">
                    {paper.title}
                  </h1>

                  {paper.authors.length > 0 && (
                    <p className="text-sm text-center text-white/60 mb-8">
                      {paper.authors.join(" · ")}
                    </p>
                  )}

                  <div className="mb-8">
                    <h2 className="text-lg font-bold uppercase mb-3 text-[#D4AF37]">Abstract</h2>
                    <p className="text-sm leading-relaxed text-justify whitespace-pre-wrap text-white/80">
                      {paper.abstract}
                    </p>
                  </div>

                  {paper.keywords.length > 0 && (
                    <div className="mb-8">
                      <p className="text-sm text-white/80">
                        <span className="font-bold italic text-white">Index Terms—</span>
                        {paper.keywords.join(", ")}
                      </p>
                    </div>
                  )}

                  {paper.figures.length > 0 && (
                    <div className="mb-8 space-y-4">
                      {paper.figures.map((fig) => (
                        <figure
                          key={fig.number}
                          className="rounded-xl border border-white/10 overflow-hidden"
                        >
                          {fig.data && fig.mimeType && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`data:${fig.mimeType};base64,${fig.data}`}
                              alt={fig.caption}
                              className="w-full max-h-80 object-contain bg-black"
                            />
                          )}
                          <figcaption className="text-sm p-3 text-white/80 text-center">
                            Fig. {fig.number}. {fig.caption}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}

                  {paper.sections.map((section, index) => (
                    <div key={index} className="mb-8">
                      <h2 className="text-lg font-bold mb-3 text-white">{section.title}</h2>
                      <div className="text-sm leading-relaxed text-justify whitespace-pre-wrap text-white/80">
                        {section.content}
                      </div>
                    </div>
                  ))}

                  {paper.references.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-bold uppercase mb-3 text-[#D4AF37]">References</h2>
                      <ol className="text-sm space-y-2 text-white/80 list-decimal list-inside">
                        {paper.references.map((ref, index) => (
                          <li key={index} className="leading-relaxed">
                            {ref}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-[#0a0a0a] sticky bottom-0">
                <Button onClick={onClose} variant="default" className="w-full">
                  Close Preview
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

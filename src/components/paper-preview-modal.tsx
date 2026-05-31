"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

interface PaperPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: {
    title: string;
    abstract: string;
    keywords?: string[];
    sections?: Array<{ title: string; content: string }>;
    references?: string[];
  };
}

export default function PaperPreviewModal({ isOpen, onClose, paper }: PaperPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-black/5 sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold">IEEE Paper Preview</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="prose prose-sm max-w-none">
                  {/* Title */}
                  <h1 className="text-3xl font-bold text-center mb-8 leading-tight">
                    {paper.title}
                  </h1>

                  {/* Abstract */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold uppercase mb-3">Abstract</h2>
                    <p className="text-sm leading-relaxed text-justify">
                      {paper.abstract}
                    </p>
                  </div>

                  {/* Keywords */}
                  {paper.keywords && paper.keywords.length > 0 && (
                    <div className="mb-8">
                      <p className="text-sm">
                        <span className="font-bold italic">Keywords—</span>
                        {paper.keywords.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Sections */}
                  {paper.sections && paper.sections.map((section, index) => (
                    <div key={index} className="mb-8">
                      <h2 className="text-lg font-bold mb-3">{section.title}</h2>
                      <p className="text-sm leading-relaxed text-justify whitespace-pre-wrap">
                        {section.content}
                      </p>
                    </div>
                  ))}

                  {/* References */}
                  {paper.references && paper.references.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-bold uppercase mb-3">References</h2>
                      <ol className="text-sm space-y-2">
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

              {/* Footer */}
              <div className="p-6 border-t border-black/5 bg-[#FAFAFA] sticky bottom-0">
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

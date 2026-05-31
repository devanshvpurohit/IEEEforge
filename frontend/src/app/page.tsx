"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileText, Cpu, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-black">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold tracking-tight">IEEEForge</div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium hover:text-[#D4AF37] transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-[#D4AF37] transition-colors">How it Works</Link>
          <Link href="/dashboard" className="px-5 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 transition-all">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-8 py-24 text-center max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            Transform Reports into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-black to-[#D4AF37]">
              Publication-Ready Papers
            </span>
          </h1>
          <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered academic formatting, citation management, and publication readiness analysis for researchers and students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-semibold hover:scale-105 transition-transform">
              Upload Document <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-4 bg-white border border-black/10 rounded-full font-semibold hover:bg-black/5 transition-colors">
              View Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-8 py-24 bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful AI Engine</h2>
            <p className="text-black/60">Built for accuracy and IEEE compliance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Section Extraction",
                desc: "Automatically detects and reorganizes content into IEEE-standard sections.",
                icon: <FileText className="text-[#D4AF37]" />,
              },
              {
                title: "Citation Manager",
                desc: "Convert any citation style (APA, MLA, etc.) into perfectly formatted IEEE references.",
                icon: <CheckCircle className="text-[#D4AF37]" />,
              },
              {
                title: "Readiness Analysis",
                desc: "Get an AI-powered score on your paper's publication readiness and quality.",
                icon: <Cpu className="text-[#D4AF37]" />,
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl border border-black/5 bg-[#FAFAFA] hover:shadow-xl hover:shadow-black/5 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-black/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

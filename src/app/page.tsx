"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Zap, Shield, Download, ArrowRight, CheckCircle, Globe, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold mb-6 tracking-wider uppercase">
                <Zap size={14} />
                AI-Powered IEEE Formatting
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
                Transform Reports into <span className="text-[#D4AF37]">IEEE Papers</span>
              </h1>
              <p className="text-lg md:text-xl text-white/60 mb-10 leading-relaxed">
                IEEEForge uses advanced AI to automatically format, cite, and analyze your research papers, 
                making them ready for top-tier publication in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold gap-2">
                    Get Started Free
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-medium">
                  View Example Paper
                </Button>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 text-white/40 grayscale opacity-50">
                <span className="font-bold tracking-widest">IEEE</span>
                <span className="font-bold tracking-widest">ACM</span>
                <span className="font-bold tracking-widest">SPRINGER</span>
                <span className="font-bold tracking-widest">ELSEVIER</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-[#0d0d0d] border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need for publication</h2>
              <p className="text-white/60">Streamlined workflow from raw draft to final export.</p>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: <Cpu className="text-[#D4AF37]" />,
                  title: "Smart Section Extraction",
                  desc: "AI automatically detects and reorganizes content into IEEE-standard sections like Methodology and Results."
                },
                {
                  icon: <CheckCircle className="text-[#D4AF37]" />,
                  title: "Readiness Analysis",
                  desc: "Get publication readiness scores with actionable feedback on missing sections and technical depth."
                },
                {
                  icon: <Zap className="text-[#D4AF37]" />,
                  title: "Citation Management",
                  desc: "Convert any citation style into perfectly formatted IEEE numbered references automatically."
                },
                {
                  icon: <Globe className="text-[#D4AF37]" />,
                  title: "Multiple Format Support",
                  desc: "Upload PDF, DOCX, TXT, or Markdown. Our engine parses them all with high precision."
                },
                {
                  icon: <Download className="text-[#D4AF37]" />,
                  title: "One-Click Export",
                  desc: "Download your paper in DOCX, LaTeX, or plain text format, ready for submission."
                },
                {
                  icon: <Shield className="text-[#D4AF37]" />,
                  title: "Privacy First",
                  desc: "Process documents locally with Ollama or use your own API keys. We never store your research."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37]/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative z-10 p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-black overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <FileText size={200} />
              </div>
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                  Ready to publish your research?
                </h2>
                <p className="text-lg mb-10 opacity-80 font-medium">
                  Join thousands of researchers who use IEEEForge to automate their formatting workflow 
                  and focus on the science, not the margins.
                </p>
                <Link href="/dashboard">
                  <Button size="lg" className="bg-black text-white hover:bg-black/90 h-14 px-10 text-base font-bold">
                    Start Converting Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

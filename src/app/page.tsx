"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileText, Cpu, CheckCircle, Zap, BookOpen, Award, Upload, Download, Sparkles } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-black">
      <Header />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-sm font-medium text-[#D4AF37]">
            <Sparkles size={16} />
            AI-Powered Academic Formatting
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight">
            Transform Reports into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-[#D4AF37] to-black">
              Publication-Ready Papers
            </span>
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-black/60 max-w-3xl mx-auto leading-relaxed">
            AI-powered academic formatting, citation management, and publication readiness analysis. 
            Convert your research reports to IEEE format in minutes, not hours.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
            <Link href="/dashboard">
              <Button size="lg" variant="default" className="gap-2">
                Get Started Free <ArrowRight size={18} />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-black/40">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              Free tier available
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10K+", label: "Papers Converted" },
              { value: "95%", label: "Accuracy Rate" },
              { value: "5 min", label: "Avg. Processing Time" },
              { value: "50+", label: "Universities" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-black/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              Everything you need to transform your research into publication-ready IEEE papers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Smart Section Extraction",
                desc: "AI automatically detects and reorganizes content into IEEE-standard sections with proper formatting.",
                icon: <FileText className="text-[#D4AF37]" size={24} />,
              },
              {
                title: "Citation Management",
                desc: "Convert any citation style (APA, MLA, Chicago) into perfectly formatted IEEE references.",
                icon: <BookOpen className="text-[#D4AF37]" size={24} />,
              },
              {
                title: "Readiness Analysis",
                desc: "Get an AI-powered score on your paper's publication readiness with actionable feedback.",
                icon: <Award className="text-[#D4AF37]" size={24} />,
              },
              {
                title: "Lightning Fast",
                desc: "Process documents in minutes with our optimized AI engine. No more manual formatting.",
                icon: <Zap className="text-[#D4AF37]" size={24} />,
              },
              {
                title: "Multiple Formats",
                desc: "Support for PDF, DOCX, TXT, and Markdown. Export to LaTeX or DOCX.",
                icon: <Upload className="text-[#D4AF37]" size={24} />,
              },
              {
                title: "Quality Assurance",
                desc: "AI checks for common issues, missing sections, and compliance with IEEE standards.",
                icon: <CheckCircle className="text-[#D4AF37]" size={24} />,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl border border-black/5 bg-white hover:shadow-xl hover:shadow-black/5 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-black/60 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 md:py-32 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              Three simple steps to transform your research report
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Document",
                desc: "Upload your research report in PDF, DOCX, or TXT format. Our AI will analyze the content.",
                icon: <Upload size={32} />,
              },
              {
                step: "02",
                title: "AI Processing",
                desc: "Our AI extracts sections, formats citations, and restructures content to IEEE standards.",
                icon: <Cpu size={32} />,
              },
              {
                step: "03",
                title: "Download Paper",
                desc: "Review the analysis, make adjustments, and download your publication-ready IEEE paper.",
                icon: <Download size={32} />,
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-6xl font-bold text-black/5 mb-4">{step.step}</div>
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-white mb-6">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-black/60 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                desc: "Perfect for trying out",
                features: ["3 documents/month", "Basic analysis", "PDF export", "Email support"],
                cta: "Get Started",
                variant: "outline" as const,
              },
              {
                name: "Pro",
                price: "$19",
                desc: "For active researchers",
                features: ["Unlimited documents", "Advanced AI analysis", "LaTeX & DOCX export", "Priority support", "Custom templates"],
                cta: "Start Free Trial",
                variant: "primary" as const,
                popular: true,
              },
              {
                name: "Team",
                price: "$49",
                desc: "For research teams",
                features: ["Everything in Pro", "Team collaboration", "API access", "Dedicated support", "Custom integrations"],
                cta: "Contact Sales",
                variant: "outline" as const,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-3xl border ${
                  plan.popular ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-black/5 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-black/60">/month</span>
                  </div>
                  <p className="text-sm text-black/60">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle size={18} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.variant} className="w-full">
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 md:py-32 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Transform Your Research?
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Join thousands of researchers who are saving time and improving their papers with IEEEForge
            </p>
            <Link href="/dashboard">
              <Button size="lg" variant="primary" className="gap-2">
                Start Converting Now <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

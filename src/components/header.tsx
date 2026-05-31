"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-lg">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <FileText size={18} className="text-[#D4AF37]" />
          </div>
          IEEEForge
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/#features" 
            className="text-sm font-medium hover:text-[#D4AF37] transition-colors"
          >
            Features
          </Link>
          <Link 
            href="/#how-it-works" 
            className="text-sm font-medium hover:text-[#D4AF37] transition-colors"
          >
            How it Works
          </Link>
          <Link 
            href="/#pricing" 
            className="text-sm font-medium hover:text-[#D4AF37] transition-colors"
          >
            Pricing
          </Link>
          <Link href="/dashboard">
            <Button size="default" variant={pathname === "/dashboard" ? "primary" : "default"}>
              Dashboard
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/5 bg-white">
          <nav className="flex flex-col gap-4 p-6">
            <Link 
              href="/#features" 
              className="text-sm font-medium hover:text-[#D4AF37] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#how-it-works" 
              className="text-sm font-medium hover:text-[#D4AF37] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              href="/#pricing" 
              className="text-sm font-medium hover:text-[#D4AF37] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button size="default" variant="default" className="w-full">
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

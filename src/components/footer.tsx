import Link from "next/link";
import { FileText, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-xl font-bold mb-4">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <FileText size={18} className="text-[#D4AF37]" />
              </div>
              IEEEForge
            </div>
            <p className="text-sm text-black/60 max-w-md">
              Transform your research reports into publication-ready IEEE papers with AI-powered formatting, citation management, and quality analysis.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-black/40 hover:text-[#D4AF37] transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-black/40 hover:text-[#D4AF37] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-black/40 hover:text-[#D4AF37] transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-black/60">
              <li><Link href="/#features" className="hover:text-[#D4AF37] transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-[#D4AF37] transition-colors">How it Works</Link></li>
              <li><Link href="/#pricing" className="hover:text-[#D4AF37] transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#D4AF37] transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-black/60">
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-black/40">
          <p>&copy; {new Date().getFullYear()} IEEEForge. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

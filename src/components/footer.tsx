import { FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#141414] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/40">
        <div className="flex items-center gap-2 text-white font-bold">
          <div className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center">
            <FileText size={14} className="text-black" />
          </div>
          IEEEForge
        </div>
        <p className="text-white/50 text-center sm:text-right">
          Upload a report → analyze → convert to IEEE format
        </p>
        <p>&copy; {new Date().getFullYear()} IEEEForge</p>
      </div>
    </footer>
  );
}

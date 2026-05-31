"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "./ui/button";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-lg">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center">
            <FileText size={18} className="text-black" />
          </div>
          IEEEForge
        </Link>

        {pathname !== "/dashboard" && (
          <Link href="/dashboard">
            <Button size="default" variant="primary">
              Convert
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}

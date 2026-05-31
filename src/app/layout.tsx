import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IEEEForge - Transform Reports into Publication-Ready Papers",
  description: "AI-powered academic formatting, citation management, and publication readiness analysis for researchers and students. Convert your reports to IEEE format instantly.",
  keywords: ["IEEE", "academic paper", "research paper", "citation management", "AI formatting", "publication"],
  authors: [{ name: "IEEEForge Team" }],
  openGraph: {
    title: "IEEEForge - Transform Reports into Publication-Ready Papers",
    description: "AI-powered academic formatting and citation management",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white`}
      >
        {children}
      </body>
    </html>
  );
}

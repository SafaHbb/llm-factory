import type { Metadata } from "next";
import { Lato, Lilita_One, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "LLM Factory",
  description: "A visual tour of how a sentence moves through a language model.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

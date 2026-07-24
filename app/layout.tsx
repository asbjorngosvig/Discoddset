import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Sommerhus Bookmaker",
  description: "Legepenge-væddemål til sommerhusturen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${display.variable} ${sans.variable}`}>
      <body className="felt-texture min-h-screen font-sans">
        <div className="mx-auto min-h-screen max-w-md pb-20">
          <header className="border-b border-felt-700 bg-felt-950 py-2 text-center">
            <span className="font-display text-xl tracking-[0.2em] text-accent-bright">
              DISCODDSET 2026
            </span>
          </header>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}

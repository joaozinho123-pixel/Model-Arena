import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Model Arena — Duelo de Modelos de IA",
  description:
    "Model Arena: escolha dois modelos de IA e descubra quem vence em código, texto, imagem, raciocínio matemático, preço, contexto e velocidade — com benchmarks reais de AA, LMArena e OpenRouter.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

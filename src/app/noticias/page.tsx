import type { Metadata } from "next";
import { AI_MODELS } from "@/data/models";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { NoticiasConteudo } from "@/components/NoticiasConteudo";

export const metadata: Metadata = {
  title: "Radar IA — Notícias do mundo da IA · Model Arena",
  description:
    "As últimas notícias do mundo da inteligência artificial: lançamentos de modelos, benchmarks e indústria, via Hacker News e Dev.to.",
};

/** Página Radar IA: notícias ao vivo + filtros + créditos. */
export default function Noticias() {
  return (
    <div id="top" className="page-in flex min-h-screen flex-col">
      <SiteNav pagina="noticias" />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-10 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Radar IA
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Lançamentos de modelos, benchmarks e indústria — direto de
            Hacker News e Dev.to, atualizado a cada visita.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <NoticiasConteudo />
      </main>

      <SiteFooter totalModelos={AI_MODELS.length} />
    </div>
  );
}

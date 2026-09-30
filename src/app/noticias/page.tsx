import type { Metadata } from "next";
import { AI_MODELS } from "@/data/models";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { NoticiasConteudo } from "@/components/NoticiasConteudo";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Radar IA — Notícias do mundo da IA · Model Arena",
  description:
    "As últimas notícias do mundo da inteligência artificial: lançamentos de modelos, benchmarks e indústria, via Hacker News e Dev.to.",
};

/** Página Radar IA: notícias ao vivo + filtros + créditos. */
export default function Noticias() {
  return (
    <div id="top" className="flex min-h-screen flex-col text-stone-900">
      <SiteNav pagina="noticias" />
      <header className="relative overflow-hidden border-b border-stone-200 pt-14">
        <div aria-hidden="true" className="aurora aurora-a" />
        <div aria-hidden="true" className="aurora aurora-c" />
        <div aria-hidden="true" className="hero-grid absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-8 text-center sm:px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-600/25 bg-indigo-600/5 px-3 py-1 text-xs font-bold text-indigo-700">
            <span
              aria-hidden="true"
              className="pulse-neon inline-block h-2 w-2 rounded-full bg-indigo-600"
            />
            Atualizado a cada visita · Hacker News + Dev.to
          </p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Radar <span className="title-gradient">IA</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            Lançamentos de modelos, benchmarks, open weights e indústria —
            direto das comunidades que vivem o tema.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 py-8 sm:py-10">
        <Reveal>
          <NoticiasConteudo />
        </Reveal>
      </main>

      <SiteFooter totalModelos={AI_MODELS.length} />
    </div>
  );
}

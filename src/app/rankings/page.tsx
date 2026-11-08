import type { Metadata } from "next";
import { AI_MODELS } from "@/data/models";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { RankingsConteudo } from "@/components/RankingsConteudo";

export const metadata: Metadata = {
  title: "Rankings de modelos de IA · Model Arena",
  description:
    "Top 10 do catálogo por índice de Inteligência da Artificial Analysis, por menor preço e por maior contexto — só valores nativos, sem notas inventadas.",
};

/** Página Rankings: três tops do catálogo, cada um na sua escala. */
export default function Rankings() {
  return (
    <div id="top" className="page-in flex min-h-screen flex-col">
      <SiteNav pagina="rankings" />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-10 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Rankings
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Três visões do catálogo — melhor índice de Inteligência (AA),
            menor preço e maior contexto — com barras na mesma escala
            dentro de cada ranking. Valores nativos, sem notas inventadas.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <RankingsConteudo />
      </main>

      <SiteFooter totalModelos={AI_MODELS.length} />
    </div>
  );
}

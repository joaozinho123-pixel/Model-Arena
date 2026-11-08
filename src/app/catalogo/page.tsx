import type { Metadata } from "next";
import { AI_MODELS } from "@/data/models";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogoConteudo } from "@/components/CatalogoConteudo";

export const metadata: Metadata = {
  title: "Catálogo de modelos de IA · Model Arena",
  description:
    "Todos os modelos do catálogo com descrição, preço, contexto e ligação para a ficha completa — pesquise, filtre por fornecedor e envie cada um para o duelo.",
};

/** Página Catálogo: lista completa com pesquisa e filtros. */
export default function Catalogo() {
  return (
    <div id="top" className="page-in flex min-h-screen flex-col">
      <SiteNav pagina="catalogo" />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-10 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Catálogo
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Todos os modelos com descrição, preço e contexto. Pesquise
            por nome ou fornecedor, filtre o catálogo e abra a ficha
            completa de cada um — ou envie-o direto para o duelo.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        <CatalogoConteudo />
      </main>

      <SiteFooter totalModelos={AI_MODELS.length} />
    </div>
  );
}

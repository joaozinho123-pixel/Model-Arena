import type { Metadata } from "next";
import { AI_MODELS } from "@/data/models";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ImagensConteudo } from "@/components/ImagensConteudo";
import { AA_MEDIA } from "@/data/aa-media";

export const metadata: Metadata = {
  title: "Modelos de imagem — Elo da Artificial Analysis · Model Arena",
  description:
    "Modelos de geração e edição de imagem medidos pela Artificial Analysis: Elo por arena, intervalo de confiança e criador — só valores nativos, sem notas inventadas.",
};

/** Página Imagem: catálogo de modelos de média da AA (media V2). */
export default function Imagens() {
  return (
    <div id="top" className="page-in flex min-h-screen flex-col">
      <SiteNav pagina="imagens" />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-10 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Modelos de imagem
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Geração e edição de imagens medidas pela Artificial
            Analysis — Elo por arena com intervalo de confiança. São
            modelos de média: não entram nos duelos de texto do
            catálogo.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        <ImagensConteudo modelos={AA_MEDIA.modelos} geradoEm={AA_MEDIA.generatedAt} />
      </main>

      <SiteFooter totalModelos={AI_MODELS.length} />
    </div>
  );
}

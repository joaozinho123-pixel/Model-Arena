import Link from "next/link";

/**
 * Rodapé minimalista: créditos das fontes de dados + data de
 * atualização + micro-linha do projeto + navegação rápida.
 */
export function SiteFooter({
  totalModelos,
  atualizadoEm,
}: {
  totalModelos: number;
  /** Data da última atualização (snapshot OpenRouter/AA). Omitido = oculta a linha. */
  atualizadoEm?: string;
}) {
  return (
    <footer className="border-t border-zinc-200 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-xs text-zinc-500">
          Métricas por{" "}
          <a
            href="https://artificialanalysis.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
          >
            Artificial Analysis
          </a>{" "}
          · Elo LMArena · Catálogo OpenRouter
        </p>
        <p className="mt-1.5 text-xs text-zinc-400">
          Model Arena · {totalModelos} modelos
          {atualizadoEm ? ` · dados de ${atualizadoEm}` : ""} · Projeto
          independente, sem afiliação
        </p>
        <nav
          aria-label="Ligações do rodapé"
          className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500"
        >
          <Link href="/" className="transition hover:text-zinc-900">
            Duelo
          </Link>
          <Link href="/rankings" className="transition hover:text-zinc-900">
            Rankings
          </Link>
          <Link href="/catalogo" className="transition hover:text-zinc-900">
            Catálogo
          </Link>
          <Link href="/imagens" className="transition hover:text-zinc-900">
            Imagem
          </Link>
          <Link href="/noticias" className="transition hover:text-zinc-900">
            Radar IA
          </Link>
        </nav>
      </div>
    </footer>
  );
}

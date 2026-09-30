/**
 * Rodapé minimalista: só os créditos da Artificial Analysis
 * (fonte dos índices de inteligência) + micro-linha do projeto.
 */
export function SiteFooter({ totalModelos }: { totalModelos: number }) {
  return (
    <footer className="border-t border-stone-200 bg-white/60 py-8">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-sm text-zinc-600">
          Métricas de inteligência por{" "}
          <a
            href="https://artificialanalysis.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-zinc-800 underline decoration-stone-300 underline-offset-4 transition hover:text-indigo-600"
          >
            Artificial Analysis
          </a>{" "}
          (Intelligence Index · API + board público)
        </p>
        <p className="mt-2 text-xs text-stone-400">
          Model Arena · {totalModelos} modelos · Catálogo OpenRouter · Elos
          LMArena · Hugging Face · Projeto independente, sem afiliação
        </p>
      </div>
    </footer>
  );
}

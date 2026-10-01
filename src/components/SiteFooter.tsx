/**
 * Rodapé minimalista: créditos da Artificial Analysis
 * (fonte dos índices de inteligência) + data da última
 * atualização dos dados + micro-linha do projeto.
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
        {atualizadoEm && (
          <p className="mt-2 text-xs font-semibold text-stone-500">
            Dados atualizados em {atualizadoEm}
          </p>
        )}
        <p className="mt-2 text-xs text-stone-400">
          Model Arena · {totalModelos} modelos · Catálogo OpenRouter · Elos
          LMArena · Hugging Face · Projeto independente, sem afiliação
        </p>
      </div>
    </footer>
  );
}

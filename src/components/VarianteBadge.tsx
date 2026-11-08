import type { ModelVariant } from "@/types/ai-model";

const ROTULOS: Record<ModelVariant, string> = {
  base: "",
  batch: "lote",
  free: "grátis",
  alias: "alias",
};

const TITULOS: Record<ModelVariant, string> = {
  base: "",
  batch: "Variante em lote — endpoint assíncrono do mesmo modelo, normalmente mais barato",
  free: "Variante gratuita (US$ 0) do mesmo modelo",
  alias: "Atalho permanente para o modelo mais recente da família",
};

/** Selo discreto de variante (lote/grátis/alias) nos cartões e fichas. */
export function VarianteBadge({ variante }: { variante: ModelVariant }) {
  if (variante === "base") return null;
  return (
    <span
      title={TITULOS[variante]}
      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500"
    >
      {ROTULOS[variante]}
    </span>
  );
}

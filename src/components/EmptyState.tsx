import type { ComponentType } from "react";

/** Ícone opcional no topo do estado vazio. */
type Icone = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

/**
 * Estado vazio discreto, com ícone e uma linha de orientação.
 * Usado nas secções que dependem de modelos escolhidos.
 */
export function EmptyState({
  titulo,
  dica,
  icone: Icone,
}: {
  titulo: string;
  dica?: string;
  icone?: Icone;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-8 text-center">
      {Icone && (
        <Icone size={18} aria-hidden className="mb-2 text-zinc-300" />
      )}
      <p className="text-sm font-medium text-zinc-700">{titulo}</p>
      {dica && <p className="mt-1 max-w-sm text-[13px] text-zinc-500">{dica}</p>}
    </div>
  );
}

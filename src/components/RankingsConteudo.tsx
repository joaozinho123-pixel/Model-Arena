"use client";

import { useRouter } from "next/navigation";
import { TopModels } from "@/components/TopModels";
import { useCatalogo } from "@/lib/use-catalogo";

/**
 * Conteúdo da página Rankings: top 10 por índice AA de Inteligência,
 * por menor preço e por maior contexto. Os botões A/B abrem o duelo
 * na home com o modelo já escolhido (deep-link ?a / ?b).
 */
export function RankingsConteudo() {
  const { modelos } = useCatalogo();
  const router = useRouter();
  return (
    <>
      <div className="mb-4">
        <TopModels
          models={modelos}
          onAssign={(slot, id) =>
            router.push(
              `/?${slot === "A" ? "a" : "b"}=${encodeURIComponent(id)}`,
            )
          }
        />
      </div>
      <p className="text-xs text-zinc-500">
        Os botões A/B levam o modelo escolhido diretamente para o duelo
        na página inicial.
      </p>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { CatalogSection } from "@/components/CatalogSection";
import { useCatalogo } from "@/lib/use-catalogo";

/** Data do snapshot ao vivo (pt-PT) ou do snapshot embutido. */
function dataSnapshotDe(geradoEm: string): string {
  return geradoEm ? new Date(geradoEm).toLocaleDateString("pt-PT") : "";
}

/**
 * Conteúdo da página Catálogo: pesquisa, filtro por fornecedor e
 * cartões com ficha de cada modelo. Os botões A/B abrem o duelo na
 * home com o modelo já escolhido (deep-link ?a / ?b).
 */
export function CatalogoConteudo() {
  const { modelos, geradoEm } = useCatalogo();
  const router = useRouter();
  return (
    <>
      <CatalogSection
        models={modelos}
        totalSnapshot={dataSnapshotDe(geradoEm)}
        onAssign={(slot, id) =>
          router.push(
            `/?${slot === "A" ? "a" : "b"}=${encodeURIComponent(id)}`,
          )
        }
      />
      <p className="mt-4 text-xs text-zinc-500">
        O nome de cada modelo abre a ficha completa. Modelos muito
        recentes (ainda fora do snapshot) são comparáveis aqui e
        entram normalmente nos duelos via A/B.
      </p>
    </>
  );
}

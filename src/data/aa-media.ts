/**
 * Modelos de imagem da Artificial Analysis (media V2) — captura
 * estática. Logótipos só para criadores com URL já testada no
 * registo do site; os restantes usam avatar com inicial.
 */
import type { ModeloImagem } from "@/types/ai-model";
import DATA from "./aa-media.json" with { type: "json" };

interface ArquivoMedia {
  generatedAt: string;
  fonte: string;
  modelos: ModeloImagem[];
}

export const AA_MEDIA = DATA as unknown as ArquivoMedia;

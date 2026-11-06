/**
 * Ficha servidor de modelos que só existem no catálogo AO VIVO
 * (ou seja: ainda não entraram no snapshot embutido). Sem esta
 * camada, clicar nesses modelos no catálogo daria 404 na ficha.
 *
 * Busca o catálogo público da OpenRouter no servidor, converte com a
 * MESMA lógica do browser e funde pelos `buildCatalogo` (arena/AA
 * embutidos). Falha graciosa (null) -> a página chama `notFound()`
 * só quando o modelo realmente não existe em lado nenhum.
 */
import type { AIModel } from "@/types/ai-model";
import { buildCatalogo } from "@/data/models";
import { rawDeApiModel } from "@/lib/openrouter-raw";

const API_URL = "https://openrouter.ai/api/v1/models";
const TIMEOUT_MS = 20_000;
const MIN_MODELOS = 50;

/** Modelo vivo do catálogo por id (null: não encontrado ou API falhou). */
export async function modeloVivoPorId(id: string): Promise<AIModel | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      signal: ctrl.signal,
      headers: { "User-Agent": "model-arena/1.0" },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { data?: unknown };
    if (!Array.isArray(payload.data) || payload.data.length < MIN_MODELOS) {
      return null; // resposta truncada/estranha: descarta
    }
    const raw = payload.data
      .map((m) => (m && typeof m === "object" ? rawDeApiModel(m as Record<string, unknown>) : null))
      .filter((r): r is NonNullable<typeof r> => r != null);
    const catalogo = buildCatalogo(raw);
    return catalogo.models.find((m) => m.id === id) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

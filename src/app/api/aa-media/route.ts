/**
 * TEMPORÁRIO (v22): captura do catálogo de MÉDIA da Artificial
 * Analysis (text-to-image + image-editing) para refrescar
 * `aa-media.json` na ronda seguinte. Usa a MESMA chave do servidor;
 * será removida depois de gravar a captura.
 */
import { getTodasComPlano } from "../aa/ratings/route";

export const dynamic = "force-dynamic";

const AA = "https://artificialanalysis.ai/api/v2";

export async function GET(): Promise<Response> {
  const key = process.env.AA_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 503 },
    );
  }
  const headers = { "x-api-key": key, "User-Agent": "model-arena/0" };
  try {
    const [t2i, iee] = await Promise.all([
      getTodasComPlano(
        [`${AA}/media/text-to-image/models`, `${AA}/media/text-to-image/models/free`],
        headers,
      ),
      getTodasComPlano(
        [`${AA}/media/image-editing/models`, `${AA}/media/image-editing/models/free`],
        headers,
      ).catch(() => [] as unknown[]),
    ]);
    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        t2i,
        iee,
        contagens: { t2i: t2i.length, iee: iee.length },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 503 },
    );
  }
}

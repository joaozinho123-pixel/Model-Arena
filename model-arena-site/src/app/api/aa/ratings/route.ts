/**
 * GET /api/aa/ratings — proxy SEGURO da Artificial Analysis.
 *
 * A chave `AA_API_KEY` vive SÓ aqui no servidor (nunca chega ao
 * navegador: sem `NEXT_PUBLIC_*`, sem rotas que a devolvam, sem logs).
 * O browser pede ESTA rota (same-origin); a rota chama a AA com a
 * chave e devolve SÓ os benchmarks já cruzados com o catálogo.
 *
 * Proteções (a quota da chave é do dono do deploy):
 * - URLs a montante FIXAS (nenhum input do utilizador chega à AA);
 * - cache em memória 6h + `s-maxage` (CDN) — o tráfego normal nem
 *   toca na AA;
 * - rate limit por IP (30 req/min → 429);
 * - erros genéricos (503/502/429) sem detalhes internos;
 * - sem chave configurada → 503 e o site usa o snapshot embutido.
 */
import { buildAaRatings } from "@/lib/aa-match.mjs";
import DATA from "@/data/openrouter-models.json" with { type: "json" };

// Nunca pré-renderizar (evita 503 cozido no build sem chave).
export const dynamic = "force-dynamic";

const TTL_MS = 6 * 60 * 60 * 1000;
const LIMITE_REQ = 30;
const JANELA_MS = 60_000;
const TIMEOUT_MS = 8000;

interface Cacheado {
  corpo: { generatedAt: string; count: number; ratings: unknown };
  expira: number;
}

let cache: Cacheado | null = null;
const taxa = new Map<string, { n: number; reset: number }>();

function ipDe(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconhecido"
  );
}

function limitado(ip: string): number {
  // Devolve 0 se OK, ou segundos para Retry-After.
  const agora = Date.now();
  const reg = taxa.get(ip);
  if (!reg || agora >= reg.reset) {
    taxa.set(ip, { n: 1, reset: agora + JANELA_MS });
    return 0;
  }
  reg.n += 1;
  if (reg.n > LIMITE_REQ) {
    return Math.max(1, Math.ceil((reg.reset - agora) / 1000));
  }
  return 0;
}

async function buscarAa(key: string): Promise<Cacheado["corpo"]> {
  const headers = { "x-api-key": key, "User-Agent": "model-arena/1.0" };
  const getJson = async (url: string): Promise<{ data?: unknown[] }> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as { data?: unknown[] };
    } finally {
      clearTimeout(t);
    }
  };
  const [llms, t2i, iee] = await Promise.all([
    getJson("https://artificialanalysis.ai/api/v2/data/llms/models").then(
      (j) => j.data ?? [],
    ),
    getJson(
      "https://artificialanalysis.ai/api/v2/data/media/text-to-image?include_categories=true",
    )
      .then((j) => j.data ?? [])
      .catch(() => [] as unknown[]),
    getJson(
      "https://artificialanalysis.ai/api/v2/data/media/image-editing?include_categories=true",
    )
      .then((j) => j.data ?? [])
      .catch(() => [] as unknown[]),
  ]);
  const base = (
    (DATA as { models?: { id: string; provider: string }[] }).models ?? []
  )
    .filter(
      (m) =>
        !m.id.startsWith("~") && !m.id.includes(":") && m.provider !== "openrouter",
    )
    .map((m) => ({ id: m.id, provider: m.provider }));
  const mediaRows = [
    ...(t2i as Record<string, unknown>[]).map((r) => ({ ...r, via: "t2i" })),
    ...(iee as Record<string, unknown>[]).map((r) => ({ ...r, via: "iee" })),
  ];
  const { ratings, comDados } = buildAaRatings(
    llms as Parameters<typeof buildAaRatings>[0],
    mediaRows as Parameters<typeof buildAaRatings>[1],
    base,
  );
  return {
    generatedAt: new Date().toISOString(),
    count: comDados,
    ratings,
  };
}

export async function GET(req: Request): Promise<Response> {
  const espera = limitado(ipDe(req));
  if (espera > 0) {
    return Response.json(
      { error: "Muitas requisições. Tente de novo em instantes." },
      { status: 429, headers: { "Retry-After": String(espera) } },
    );
  }

  // NUNCA expor se a chave existe ou não para além deste genérico.
  const key = process.env.AA_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 503 },
    );
  }

  const agora = Date.now();
  if (cache && agora < cache.expira) {
    return Response.json(cache.corpo, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  }

  try {
    const corpo = await buscarAa(key);
    cache = { corpo, expira: agora + TTL_MS };
    return Response.json(corpo, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  } catch {
    return Response.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 502 },
    );
  }
}

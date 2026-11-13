/**
 * GET /api/aa/ratings — proxy SEGURO da Artificial Analysis.
 *
 * A chave `AA_API_KEY` vive SÓ aqui no servidor (nunca chega ao
 * navegador: sem `NEXT_PUBLIC_*`, sem rotas que a devolvam, sem logs).
 * O browser pede ESTA rota (same-origin); a rota chama a AA com a
 * chave e devolve SÓ os benchmarks já cruzados com o catálogo.
 *
 * NOTA DE MIGRAÇÃO (nov/2026): os endpoints legacy `/api/v2/data/*`
 * foram reformados (410 Gone a 04/11/2026). Usamos agora os V2
 * documentados, primeiro na variante Pro (mais campos) e, se o plano
 * da chave a negar (403), na variante Free — a MESMA chave continua
 * a servir. A AA deixou de publicar os índices de Codificação e de
 * Agentes (sempre null), por isso só a Inteligência chega nos pares.
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
import { AA_DIRECT } from "@/data/models";
import DATA from "@/data/openrouter-models.json" with { type: "json" };

// Nunca pré-renderizar (evita 503 cozido no build sem chave).
export const dynamic = "force-dynamic";

const TTL_MS = 6 * 60 * 60 * 1000;
const LIMITE_REQ = 30;
const JANELA_MS = 60_000;
const TIMEOUT_MS = 8000;

/**
 * Percorre os caminhos AA por ordem (Pro → Free): devolve as linhas do
 * primeiro que responder 200. `401/403`/outro erro passa ao caminho
 * seguinte — a mesma chave cobre apenas os endpoints do plano. A
 * lista V2 é paginada (`pagination.has_more`); seguem-se as páginas.
 */
export async function getTodasComPlano(
  paths: string[],
  headers: Record<string, string>,
): Promise<unknown[]> {
  let ultimo: unknown = null;
  for (const urlBase of paths) {
    const r = await getPaginas(urlBase, headers, 10);
    if (r.ok) return r.linhas;
    ultimo = r.ultimo;
  }
  throw new Error(`HTTP ${String(ultimo ?? "sem resposta")}`);
}

/** Busca todas as páginas de um caminho (até `maxPaginas` por segurança). */
async function getPaginas(
  urlBase: string,
  headers: Record<string, string>,
  maxPaginas: number,
): Promise<
  { ok: true; linhas: unknown[] } | { ok: false; ultimo: unknown }
> {
  const linhas: unknown[] = [];
  for (let page = 1; page <= maxPaginas; page++) {
    const url = `${urlBase}${page > 1 ? `?page=${page}` : ""}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal });
      if (!res.ok) return { ok: false, ultimo: res.status };
      const j = (await res.json()) as {
        data?: unknown[];
        pagination?: { has_more?: boolean };
      };
      linhas.push(...(j.data ?? []));
      if (!j.pagination?.has_more) break;
    } finally {
      clearTimeout(t);
    }
  }
  return { ok: true, linhas };
}

const AA = "https://artificialanalysis.ai/api/v2";

interface Cacheado {
  corpo: { generatedAt: string; count: number; ratings: unknown };
  expira: number;
}

let cache: Cacheado | null = null;
/**
 * A quota da AA (plano Free: 100 pedidos por janela de 24 h) é
 * partilhada e escassa: quando a montante falha (429/401), ficamos
 * 30 min sem a repetir — o site continua no snapshot embutido.
 */
const FALHA_TTL_MS = 30 * 60 * 1000;
/** Timestamp até onde as falhas de montante são memorizadas. */
let falhaAte = 0;
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
  const [llms, t2i, iee] = await Promise.all([
    getTodasComPlano(
      [`${AA}/language/models`, `${AA}/language/models/free`],
      headers,
    ),
    getTodasComPlano(
      [
        `${AA}/media/text-to-image/models`,
        `${AA}/media/text-to-image/models/free`,
      ],
      headers,
    ).catch(() => [] as unknown[]),
    getTodasComPlano(
      [
        `${AA}/media/image-editing/models`,
        `${AA}/media/image-editing/models/free`,
      ],
      headers,
    ).catch(() => [] as unknown[]),
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
  // Camada viva fina (plano Free) preserva os extras já medidos no
  // snapshot: sobrepõe campo a campo, sem inventar dados.
  const merged: Record<string, unknown> = { ...AA_DIRECT };
  for (const [id, r] of Object.entries(ratings)) {
    const antes = AA_DIRECT[id];
    merged[id] = antes
      ? { ...antes, ...r, extras: { ...antes.extras, ...r.extras } }
      : r;
  }
  return {
    generatedAt: new Date().toISOString(),
    count: comDados,
    ratings: merged,
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
  // Falha recente da montante: não repete o pedido (quota escassa).
  if (falhaAte > agora) {
    return Response.json(
      { error: "Serviço temporariamente indisponível." },
      {
        status: 503,
        headers: {
          "Retry-After": String(Math.ceil((falhaAte - agora) / 1000)),
        },
      },
    );
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
    falhaAte = agora + FALHA_TTL_MS;
    return Response.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 503, headers: { "Retry-After": String(FALHA_TTL_MS / 1000) } },
    );
  }
}

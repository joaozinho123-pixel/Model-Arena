/**
 * Desempenho em tempo real via endpoint público do OpenRouter
 * (`GET /api/v1/models/{id}/endpoints`, sem chave, com CORS).
 * Cache em memória + timeout; falha graciosa (null).
 */

export interface ResumoEndpoints {
  /** Nº de fornecedores operacionais / total. */
  operacionais: number;
  total: number;
  /** Melhor uptime 30m (%) entre operacionais. */
  uptime30m: number | null;
  /** Latência p50 (ms) do melhor fornecedor com dados. */
  latenciaP50: number | null;
  /** Throughput p50 (tok/s) do melhor fornecedor com dados. */
  throughputP50: number | null;
  /** Máximo de tokens de saída. */
  maxSaida: number | null;
  /** Quantização anunciada (ex.: "fp8") ou null. */
  quantizacao: string | null;
  /** Cache implícito suportado por algum fornecedor. */
  cacheImplicito: boolean | null;
}

const cache = new Map<string, Promise<ResumoEndpoints | null>>();

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Melhor endpoint operacional: com latência, senão o primeiro operacional. */
export function getResumoEndpoints(id: string): Promise<ResumoEndpoints | null> {
  const hit = cache.get(id);
  if (hit) return hit;
  const p = (async (): Promise<ResumoEndpoints | null> => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(
        `https://openrouter.ai/api/v1/models/${id}/endpoints`,
        { signal: ctrl.signal },
      );
      clearTimeout(t);
      if (!res.ok) return null;
      const j = await res.json();
      const eps: Record<string, unknown>[] = Array.isArray(j?.data?.endpoints)
        ? j.data.endpoints
        : [];
      const ops = eps.filter((e) => (e.status as number) === 0);
      if (!ops.length) return null;
      let lat: number | null = null;
      let tput: number | null = null;
      let uptime: number | null = null;
      let maxSaida: number | null = null;
      let quant: string | null = null;
      let cacheImp: boolean | null = null;
      for (const e of ops) {
        const l = num(
          (e.latency_last_30m as Record<string, unknown> | null)?.p50,
        );
        const tp = num(
          (e.throughput_last_30m as Record<string, unknown> | null)?.p50,
        );
        // Melhor de cada métrica entre fornecedores operacionais:
        // menor latência p50 e maior produtividade p50 (independentes).
        if (l != null && (lat == null || l < lat)) lat = l;
        if (tp != null && (tput == null || tp > tput)) tput = tp;
        const u = num(e.uptime_last_30m);
        if (u != null && (uptime == null || u > uptime)) uptime = u;
        const mo = num(e.max_completion_tokens);
        if (mo != null && (maxSaida == null || mo > maxSaida)) maxSaida = mo;
        if (typeof e.quantization === "string" && e.quantization && !quant) {
          quant = e.quantization;
        }
        if (e.supports_implicit_caching === true) cacheImp = true;
        else if (cacheImp == null && e.supports_implicit_caching === false) {
          cacheImp = false;
        }
      }
      return {
        operacionais: ops.length,
        total: eps.length,
        uptime30m: uptime,
        latenciaP50: lat,
        throughputP50: tput,
        maxSaida,
        quantizacao: quant,
        cacheImplicito: cacheImp,
      };
    } catch {
      return null;
    }
  })();
  cache.set(id, p);
  // Falhas transitórias não envenenam a cache: o próximo pedido
  // (retry ou remontagem) tenta a rede outra vez.
  p.then((r) => {
    if (r == null) cache.delete(id);
  });
  return p;
}

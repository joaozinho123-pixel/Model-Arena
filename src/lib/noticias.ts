/**
 * Radar IA: notícias do mundo da IA a partir de APIs públicas
 * (Hacker News via Algolia + Dev.to), sem chave. Falha graciosa:
 * sem resposta válida, a UI mostra links de referência curados.
 */

export type FonteNoticia = "Hacker News" | "Dev.to";

/** Categorias editoriais do Radar IA (derivadas do conteúdo, pt-PT). */
export type CategoriaNoticia =
  | "Modelos"
  | "Benchmarks"
  | "Open-source"
  | "Ferramentas"
  | "Indústria";

export interface Noticia {
  id: string;
  titulo: string;
  url: string;
  fonte: FonteNoticia;
  /** Pontos (HN) ou reações (Dev.to). */
  pontos: number;
  comentarios: number;
  /** ISO da publicação. */
  publicadoEm: string;
  descricao?: string;
  autor?: string;
  /** Etiquetas da fonte (Dev.to) ou termos detetados. */
  tags?: string[];
  /** Categoria editorial derivada (nunca inventada: só palavras do título). */
  categoria?: CategoriaNoticia | null;
}

interface HNItem {
  objectID?: string;
  title?: string | null;
  url?: string | null;
  points?: number | null;
  num_comments?: number | null;
  created_at?: string;
  author?: string | null;
}

/** Termos que marcam relevância para IA (filtro anti-ruído). */
const RELEVANTE =
  /\b(ai\b|artificial intelligence|llm|gpt|claude|gemini|grok|mistral|llama|qwen|deepseek|openai|anthropic|google deepmind|microsoft|meta ai|model|models|benchmark|agent|agents|reasoning|inference|training|chatbot|copilot|transformer|diffusion|multimodal)/i;

/**
 * Categoria editorial derivada SÓ de palavras que existem no título,
 * descrição e etiquetas — sem classificar por palpite. Prioridade:
 * benchmarks > open-source > ferramentas > modelos > indústria.
 */
const CATEGORIAS: {
  id: CategoriaNoticia;
  match: RegExp;
}[] = [
  {
    id: "Benchmarks",
    match: /\b(benchmark|benchmarks|leaderboard|elo|arena|eval|avalia|score|ranking|índice|index)\b/i,
  },
  {
    id: "Open-source",
    match: /\b(open.?source|open.?weight|pesos abertos|hugging ?face|huggingface|weights released|código aberto)\b/i,
  },
  {
    id: "Ferramentas",
    match: /\b(agent|agents|agente|agentes|tool|tools|ferramenta|ferramentas|copilot|framework|sdk|api)\b/i,
  },
  {
    id: "Modelos",
    match: /\b(gpt|claude|gemini|grok|llama|qwen|deepseek|mistral|modelo|model|launch|lança|lançamento|release|version|preview)\b/i,
  },
  {
    id: "Indústria",
    match: /\b(funding|startup|regulation|regula|acqui|parceria|partnership|policy|mercado|mercados|empresa|empresas|billion|mil milhões)\b/i,
  },
];

/** Deriva a categoria (null quando nada corresponde). */
export function categoriaDe(n: {
  titulo: string;
  descricao?: string;
  tags?: string[];
}): CategoriaNoticia | null {
  const texto = `${n.titulo} ${n.descricao ?? ""} ${(n.tags ?? []).join(" ")}`;
  for (const c of CATEGORIAS) {
    if (c.match.test(texto)) return c.id;
  }
  return null;
}

async function comTimeout(url: string, ms = 12000): Promise<Response> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    window.clearTimeout(t);
  }
}

async function buscarHN(): Promise<Noticia[]> {
  const res = await comTimeout(
    "https://hn.algolia.com/api/v1/search_by_date?query=AI%20model&tags=story&hitsPerPage=60",
  );
  if (!res.ok) return [];
  const j = (await res.json()) as { hits?: HNItem[] };
  const hits = Array.isArray(j.hits) ? j.hits : [];
  return hits
    .filter(
      (h): h is HNItem & { title: string } =>
        typeof h.title === "string" &&
        h.title.trim().length > 0 &&
        RELEVANTE.test(h.title) &&
        (h.points ?? 0) >= 15,
    )
    .map((h) => ({
      id: `hn-${h.objectID ?? h.title}`,
      titulo: h.title.trim(),
      url:
        typeof h.url === "string" && h.url.startsWith("http")
          ? h.url
          : `https://news.ycombinator.com/item?id=${h.objectID ?? ""}`,
      fonte: "Hacker News" as const,
      pontos: h.points ?? 0,
      comentarios: h.num_comments ?? 0,
      publicadoEm: h.created_at ?? new Date().toISOString(),
      autor: h.author ?? undefined,
      categoria: categoriaDe({ titulo: h.title, descricao: undefined }),
    }))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 24);
}

interface DevToItem {
  id?: number;
  title?: string;
  url?: string;
  positive_reactions_count?: number;
  comments_count?: number;
  published_at?: string;
  description?: string;
  user?: { name?: string };
  tag_list?: string[];
}

async function buscarDevTo(): Promise<Noticia[]> {
  const res = await comTimeout(
    "https://dev.to/api/articles?tag=ai&per_page=24",
  );
  if (!res.ok) return [];
  const j = (await res.json()) as DevToItem[];
  if (!Array.isArray(j)) return [];
  return j
    .filter(
      (a): a is DevToItem & { title: string; url: string } =>
        typeof a.title === "string" &&
        a.title.trim().length > 0 &&
        typeof a.url === "string" &&
        a.url.startsWith("http"),
    )
    .map((a) => {
      const tags = Array.isArray(a.tag_list)
        ? a.tag_list.filter((t) => typeof t === "string" && t.trim()).slice(0, 4)
        : undefined;
      return {
        id: `devto-${a.id ?? a.url}`,
        titulo: a.title.trim(),
        url: a.url,
        fonte: "Dev.to" as const,
        pontos: a.positive_reactions_count ?? 0,
        comentarios: a.comments_count ?? 0,
        publicadoEm: a.published_at ?? new Date().toISOString(),
        descricao: a.description?.trim() || undefined,
        autor: a.user?.name || undefined,
        tags,
        categoria: categoriaDe({
          titulo: a.title,
          descricao: a.description,
          tags,
        }),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime(),
    );
}

/** Ligações de referência quando as APIs falham (sempre disponíveis). */
export const REFERENCIAS: Noticia[] = [
  {
    id: "ref-aa",
    titulo: "Artificial Analysis — Intelligence Index e benchmarks",
    url: "https://artificialanalysis.ai",
    fonte: "Dev.to",
    pontos: 0,
    comentarios: 0,
    publicadoEm: new Date().toISOString(),
    descricao: "Board oficial de índices de inteligência e velocidade.",
    categoria: "Benchmarks" as const,
  },
  {
    id: "ref-arena",
    titulo: "LMArena — leaderboard de preferência",
    url: "https://lmarena.ai",
    fonte: "Dev.to",
    pontos: 0,
    comentarios: 0,
    publicadoEm: new Date().toISOString(),
    descricao: "Elo de preferência por voto cego lado a lado.",
    categoria: "Benchmarks" as const,
  },
  {
    id: "ref-or",
    titulo: "OpenRouter — novos modelos e changelog",
    url: "https://openrouter.ai",
    fonte: "Dev.to",
    pontos: 0,
    comentarios: 0,
    publicadoEm: new Date().toISOString(),
    descricao: "Catálogo e novidades do agregador de APIs.",
  },
  {
    id: "ref-hf",
    titulo: "Hugging Face Blog — novidades open-weight",
    url: "https://huggingface.co/blog",
    fonte: "Dev.to",
    pontos: 0,
    comentarios: 0,
    publicadoEm: new Date().toISOString(),
    descricao: "Lançamentos e análises do ecossistema aberto.",
  },
];

export interface ResultadoNoticias {
  noticias: Noticia[];
  /** true quando veio das APIs; false = só referências. */
  aoVivo: boolean;
}

/** Busca nas duas fontes em paralelo; nunca rejeita. */
export async function buscarNoticias(): Promise<ResultadoNoticias> {
  const [hn, dev] = await Promise.all([
    buscarHN().catch(() => [] as Noticia[]),
    buscarDevTo().catch(() => [] as Noticia[]),
  ]);
  const noticias = [...hn, ...dev].sort(
    (a, b) =>
      new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime(),
  );
  if (noticias.length === 0) return { noticias: REFERENCIAS, aoVivo: false };
  return { noticias, aoVivo: true };
}

/** "há 3 h" / "há 2 dias" em pt-PT. */
export function tempoAtras(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return d === 1 ? "há 1 dia" : `há ${d} dias`;
  return new Date(iso).toLocaleDateString("pt-PT");
}

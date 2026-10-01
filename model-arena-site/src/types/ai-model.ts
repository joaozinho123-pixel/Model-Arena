/**
 * Passo 1 — Interfaces e tipos TypeScript.
 * Métricas NATIVAS (Elo, índices) de benchmarks públicos, sem notas 0–10.
 */

/** Chaves das categorias de benchmark (valores nativos: Elo/índices/tok-s). */
export type CategoryKey =
  | "codigo"
  | "texto"
  | "imagem"
  | "raciocinioMatematico"
  | "velocidadeInferencia";

/** Modalidades suportadas, no formato OpenRouter ("text+image->text"). */
export interface ModelModalities {
  entrada: string[];
  saida: string[];
}

/** Variante do registo no catálogo (lotes e aliases são filtrados da UI). */
export type ModelVariant = "base" | "batch" | "alias";

/** Registo bruto do snapshot do OpenRouter. */
export interface OpenRouterModel {
  id: string;
  nome: string;
  provider: string;
  descricao: string;
  contexto: number;
  precoEntrada: number;
  precoSaida: number;
  modalidades: ModelModalities;
  ferramentas: boolean;
  saidaEstruturada: boolean;
  raciocinio: boolean;
}

/** Modelo pronto para a UI: metadados + métricas nativas de benchmarks. */
export interface AIModel extends OpenRouterModel {
  /** Nome curto sem o prefixo "Fornecedor: ". */
  nomeCurto: string;
  /** Nome de exibição do fornecedor. */
  empresa: string;
  /** Domínio para o logótipo (favicon); ausente = avatar com inicial. */
  dominioLogo?: string;
  /** Cor de destaque do fornecedor (hex). */
  cor: string;
  /** Origem por quesito: benchmark público (OpenRouter/LMArena) ou "—". */
  fontes: Record<CategoryKey, ScoreFonte>;
  /** Evidência exibível por quesito (rótulos e tooltips da UI). */
  evidencias: Record<CategoryKey, Evidencia>;
  /** Elo real LMArena por quesito (só onde há correspondência). */
  arena: Partial<Record<CategoryKey, ArenaScore>>;
  /** Índices Artificial Analysis (direto ou espelho) + velocidade real. */
  aa?: {
    intelligence_index?: number | null;
    coding_index?: number | null;
    agentic_index?: number | null;
    math_index?: number | null;
    tps?: number | null;
    ttft?: number | null;
  };
  /** Benchmarks extra AA (GPQA, HLE, etc., frações 0–1) quando medidos. */
  extras?: Record<string, number>;
  /** Elo Design Arena (código/imagem) via OpenRouter, quando há. */
  designArena?: {
    codigo?: { elo: number; rank: number | null; category: string };
    imagem?: { elo: number; rank: number | null; category: string };
  };
  /** Elo text-to-image AA (geração de imagens) quando medido. */
  t2i?: { elo: number; rank: number | null };
  /** Todas as entradas Design Arena do modelo (tabela completa). */
  designTodas?: {
    arena: string;
    category: string;
    elo: number;
    rank: number | null;
    win_rate: number | null;
  }[];
  /** Classificação geral da origem dos dados. */
  fonte: ModelFonte;
  /** Stats Hugging Face (downloads/likes/licença) p/ open-weight. */
  hf?: {
    hf: string;
    downloads: number | null;
    likes: number | null;
    license: string | null;
  };
  /** Posição no catálogo pela melhor métrica disponível (1 = melhor). */
  rank: number;
  variante: ModelVariant;
}

/** Origem de uma métrica: benchmark público real ou sem dado. */
export type ScoreFonte = "aa" | "openrouter" | "arena" | "estimativa";

/** Classificação geral da origem dos dados de um modelo. */
export type ModelFonte = "aa" | "openrouter" | "arena" | "mista" | "estimativa";

/** Evidência exibível da origem de uma métrica (tabela e tooltips). */
export interface Evidencia {
  fonte: ScoreFonte;
  /** Nome curto da origem: "AA", "Design Arena", "LMArena" ou "Estimativa". */
  origem: string;
  /** Valor nativo cru: "74.9", "1533" ou "—" (unidade no template). */
  valor: string;
  /** Tooltip detalhado com fonte, valor e votos/rank quando houver. */
  titulo: string;
  /** Canal da arena de imagem (t2i/vision/design) para comparabilidade. */
  via?: string;
}

/** Elo real de uma arena LMArena num quesito. */
export interface ArenaScore {
  elo: number;
  votos: number;
  rank: number;
  arena: string;
  via?: string;
}

/** Metadados de exibição de cada categoria de benchmark. */
export interface CategoryMeta {
  key: CategoryKey;
  rotulo: string;
  descricao: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "codigo",
    rotulo: "Código",
    descricao: "Geração, depuração e explicação de código",
  },
  {
    key: "texto",
    rotulo: "Texto",
    descricao: "Redação, resumo e compreensão linguística",
  },
  {
    key: "imagem",
    rotulo: "Imagem",
    descricao: "Geração e interpretação de imagens",
  },
  {
    key: "raciocinioMatematico",
    rotulo: "Raciocínio Matemático",
    descricao: "Resolução de problemas e lógica quantitativa",
  },
  {
    key: "velocidadeInferencia",
    rotulo: "Velocidade",
    descricao: "Throughput mediano em tokens/segundo (AA)",
  },
];

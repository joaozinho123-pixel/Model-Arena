/** Tipos da lib partilhada de matching AA (`aa-match.mjs`). */

export interface CatalogRef {
  id: string;
  provider: string;
}

export interface AaT2i {
  elo: number;
  rank: number | null;
  via?: string;
  modelo?: string;
  votes?: number | null;
}

export interface AaRating {
  intel?: number | null;
  coding?: number | null;
  math?: number | null;
  agentic?: number | null;
  tps?: number | null;
  ttft?: number | null;
  extras?: Record<string, number>;
  effort?: string;
  t2i?: AaT2i | null;
}

export interface AaMatchResult {
  ratings: Record<string, AaRating>;
  misses: string[];
  comDados: number;
  t2iMatches: number;
}

interface AaRow {
  slug?: unknown;
  elo?: unknown;
  rank?: unknown;
  name?: unknown;
  via?: string;
  appearances?: unknown;
  model_creator?: { slug?: unknown; name?: unknown } | null;
  evaluations?: Record<string, unknown> | null;
  median_output_tokens_per_second?: unknown;
  median_time_to_first_token_seconds?: unknown;
  [k: string]: unknown;
}

export function buildAaRatings(
  llms: AaRow[],
  mediaRows: AaRow[],
  base: CatalogRef[],
): AaMatchResult;

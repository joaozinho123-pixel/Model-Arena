/**
 * Comparação por valores NATIVOS (Elo/índices) — sem notas 0–10.
 * Centraliza: valor exibível, vencedor do quesito, headline do modelo
 * e chave de ordenação do catálogo.
 */
import { CATEGORIES, type AIModel, type CategoryKey } from "@/types/ai-model";

export interface ValorNativo {
  /** Texto exibível: "74.9", "1533", "90,9 tok/s" ou "—". */
  texto: string;
  /** Número para comparação; null = sem dado. */
  num: number | null;
  /** Unidade: "índice" (AA), "Elo" (arenas) ou "tok/s" (velocidade). */
  unidade: "índice" | "Elo" | "tok/s" | null;
}

/** Valor nativo de um modelo num quesito (mesma prioridade do merge). */
export function valorNativo(model: AIModel, key: CategoryKey): ValorNativo {
  const ev = model.evidencias[key];
  if (ev.fonte === "estimativa") {
    return { texto: "—", num: null, unidade: null };
  }
  const num =
    key === "codigo"
      ? (model.aa?.coding_index ??
        model.designArena?.codigo?.elo ??
        model.arena.codigo?.elo)
      : key === "texto"
        ? (model.aa?.intelligence_index ?? model.arena.texto?.elo)
        : key === "imagem"
          ? (model.t2i?.elo ??
            model.designArena?.imagem?.elo ??
            model.arena.imagem?.elo)
          : key === "raciocinioMatematico"
            ? (model.aa?.math_index ?? model.arena.raciocinioMatematico?.elo)
            : model.aa?.tps;
  if (num == null || !Number.isFinite(num)) {
    return { texto: "—", num: null, unidade: null };
  }
  if (key === "velocidadeInferencia") {
    return { texto: ev.valor, num, unidade: "tok/s" };
  }
  return {
    texto: ev.valor,
    num,
    unidade: ev.origem === "AA" ? "índice" : "Elo",
  };
}

/** Vencedor do quesito: só com a MESMA origem real (unidades iguais).
 * Elo vs índice nunca se comparam — nesse caso não há vencedor. */
export function vencedorQuesito(
  a: AIModel,
  b: AIModel,
  key: CategoryKey,
): "A" | "B" | "empate" | null {
  const ea = a.evidencias[key];
  const eb = b.evidencias[key];
  if (ea.fonte === "estimativa" || eb.fonte === "estimativa") return null;
  if (ea.origem !== eb.origem) return null;
  if (key === "imagem" && ea.via !== eb.via) return null;
  const va = valorNativo(a, key).num;
  const vb = valorNativo(b, key).num;
  if (va == null || vb == null) return null;
  if (va > vb) return "A";
  if (vb > va) return "B";
  return "empate";
}

export interface Headline {
  /** Rótulo da métrica: "AA Inteligência", "Elo LMArena" ou "—". */
  rotulo: string;
  /** Valor nativo: "50.8", "1505" ou "—". */
  valor: string;
}

/** Resultado agregado do confronto direto nos quesitos de benchmark. */
export interface Placar {
  vitoriasA: number;
  vitoriasB: number;
  /** Quesitos com mesma métrica e valor igual. */
  empates: number;
  /** Quesitos sem vencedor (dados ausentes ou fontes não comparáveis). */
  semConfronto: number;
  /** Quesitos efetivamente decididos (vitórias + empates). */
  avaliados: number;
  /** Vencedor do confronto; null = empate ou sem confronto possível. */
  vencedor: AIModel | null;
  /** true quando nenhum quesito pôde ser comparado (0×0). */
  semDados: boolean;
}

/**
 * Placar do confronto nos quesitos de benchmark — fonte única de
 * verdade para o veredito, os cartões de destaque e a tabela.
 * Nunca conta preço/contexto (esses são "vantagens" separadas).
 */
export function placarConfronto(a: AIModel, b: AIModel): Placar {
  let vitoriasA = 0;
  let vitoriasB = 0;
  let empates = 0;
  let semConfronto = 0;
  for (const { key } of CATEGORIES) {
    const v = vencedorQuesito(a, b, key);
    if (v === "A") vitoriasA++;
    else if (v === "B") vitoriasB++;
    else if (v === "empate") empates++;
    else semConfronto++;
  }
  const avaliados = vitoriasA + vitoriasB + empates;
  return {
    vitoriasA,
    vitoriasB,
    empates,
    semConfronto,
    avaliados,
    vencedor:
      vitoriasA > vitoriasB ? a : vitoriasB > vitoriasA ? b : null,
    // 0×0 não é empate: nada pôde ser comparado.
    semDados: avaliados === 0,
  };
}

/** Métrica de destaque do modelo (cartões, catálogo, rankings). */
export function headline(model: AIModel): Headline {
  if (
    model.aa?.intelligence_index != null &&
    Number.isFinite(model.aa.intelligence_index)
  ) {
    return {
      rotulo: "AA Inteligência",
      valor: `${model.aa.intelligence_index}`,
    };
  }
  const elo = model.arena.texto?.elo;
  if (elo != null && Number.isFinite(elo)) {
    return { rotulo: "Elo LMArena", valor: `${Math.round(elo)}` };
  }
  return { rotulo: "Sem métricas públicas", valor: "—" };
}

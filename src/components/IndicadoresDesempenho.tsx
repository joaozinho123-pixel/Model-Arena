"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AIModel } from "@/types/ai-model";
import { CATEGORIES } from "@/types/ai-model";
import { formatWinRate } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";

/**
 * Índices AA 0–100. Nota: desde nov/2026 a AA deixou de publicar os
 * índices de Codificação e de Agentes (sempre null) — ficam na lista
 * para o snapshot antigo continuar a render, mas não chegam do vivo.
 */
const AA_METRICAS = [
  { key: "intelligence_index", rotulo: "Inteligência" },
  { key: "coding_index", rotulo: "Codificação" },
  { key: "math_index", rotulo: "Matemática" },
  { key: "agentic_index", rotulo: "Agentes" },
] as const;

/** Tooltip branco, sóbrio (linha opcional extra). */
function TooltipConteudo({
  active,
  payload,
  label,
  extra,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string | null; color?: string }[];
  label?: string;
  extra?: string | null;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-zinc-900">{label}</p>
      {extra && <p className="mb-1 text-[11px] text-zinc-400">{extra}</p>}
      {payload
        .filter((p) => p.value != null)
        .map((p) => (
          <p
            key={p.name}
            className="flex items-center gap-1.5 tabular-nums text-zinc-600"
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            {p.name}:{" "}
            <strong className="font-medium text-zinc-900">{p.value}</strong>
          </p>
        ))}
    </div>
  );
}

/** Legenda dos dois modelos (identidade + cor). */
function Legenda({ modelA, modelB }: { modelA: AIModel; modelB: AIModel }) {
  return (
    <div className="flex items-center gap-4 text-xs" aria-hidden="true">
      {[modelA, modelB].map((m) => (
        <span key={m.id} className="flex items-center gap-1.5">
          <ModelLogo
            nome={m.nomeCurto}
            dominio={m.dominioLogo}
            cor={m.cor}
            tamanho={20}
          />
          <span className="font-medium text-zinc-700">{m.nomeCurto}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Indicadores de desempenho em valores NATIVOS, divididos em três
 * blocos: (1) índices AA 0–100 só com pares completos — métricas que
 * só existem num lado saem como chips e não geram barras solas;
 * (2) Elos face a face (LMArena + Design Arena) para pares comparáveis;
 * (3) tabela completa da Design Arena com métricas de um lado.
 */
export function IndicadoresDesempenho({
  modelA,
  modelB,
}: {
  modelA: AIModel;
  modelB: AIModel;
}) {
  // ===== AA: pares completos (0–100) e métricas de um lado =====
  const { aaPares, aaSolo } = useMemo(() => {
    const pares: {
      metrica: string;
      [nome: string]: string | number | null;
    }[] = [];
    const solo: {
      rotulo: string;
      lado: "A" | "B";
      valor: number;
      nome: string;
    }[] = [];
    for (const { key, rotulo } of AA_METRICAS) {
      const va = modelA.aa?.[key];
      const vb = modelB.aa?.[key];
      if (va != null && vb != null) {
        pares.push({
          metrica: rotulo,
          [modelA.nomeCurto]: va,
          [modelB.nomeCurto]: vb,
        });
      } else if (va != null || vb != null) {
        solo.push(
          va != null
            ? { rotulo, lado: "A" as const, valor: va, nome: modelA.nomeCurto }
            : {
                rotulo,
                lado: "B" as const,
                valor: vb as number,
                nome: modelB.nomeCurto,
              },
        );
      }
    }
    return { aaPares: pares, aaSolo: solo };
  }, [modelA, modelB]);

  // ===== Design Arena: cruzamento por categoria/arena =====
  const designLinhas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        categoria: string;
        arena: string;
        a?: { elo: number; win: number | null };
        b?: { elo: number; win: number | null };
      }
    >();
    for (const d of modelA.designTodas ?? []) {
      mapa.set(`${d.arena}/${d.category}`, {
        categoria: d.category,
        arena: d.arena,
        a: { elo: d.elo, win: d.win_rate },
      });
    }
    for (const d of modelB.designTodas ?? []) {
      const k = `${d.arena}/${d.category}`;
      const atual = mapa.get(k) ?? { categoria: d.category, arena: d.arena };
      atual.b = { elo: d.elo, win: d.win_rate };
      mapa.set(k, atual);
    }
    return [...mapa.values()].sort(
      (x, y) =>
        Math.max(y.a?.elo ?? 0, y.b?.elo ?? 0) -
        Math.max(x.a?.elo ?? 0, x.b?.elo ?? 0),
    );
  }, [modelA, modelB]);

  // ===== Pares de Elo comparáveis (mesma arena / mesma via) =====
  const elosPares = useMemo(() => {
    const linhas: { rotulo: string; sub: string; eloA: number; eloB: number }[] =
      [];
    // LMArena: quesitos onde os dois têm Elo, mesma arena e mesma via
    // (ex.: "texto" do tipo text/domínio) — senão não é comparável.
    for (const c of CATEGORIES) {
      if (c.key === "velocidadeInferencia") continue;
      const a = modelA.arena[c.key];
      const b = modelB.arena[c.key];
      if (
        a?.elo != null &&
        b?.elo != null &&
        a.arena === b.arena &&
        a.via === b.via
      ) {
        linhas.push({
          rotulo: c.rotulo,
          sub: a.via ? `LMArena · ${a.via}` : "LMArena",
          eloA: a.elo,
          eloB: b.elo,
        });
      }
    }
    // Design Arena: categorias em que os dois têm Elo.
    for (const l of designLinhas) {
      if (l.a && l.b) {
        linhas.push({
          rotulo: l.categoria,
          sub: `Design Arena · ${l.arena}`,
          eloA: l.a.elo,
          eloB: l.b.elo,
        });
      }
    }
    // Ordena pela diferença absoluta (confrontos mais disputados em cima).
    return linhas.sort(
      (x, y) => Math.abs(y.eloA - y.eloB) - Math.abs(x.eloA - x.eloB),
    );
  }, [modelA, modelB, designLinhas]);

  const semTudo =
    aaPares.length === 0 &&
    aaSolo.length === 0 &&
    elosPares.length === 0 &&
    designLinhas.length === 0;

  if (semTudo) {
    return (
      <section
        aria-labelledby="indicadores-desempenho"
        className="card px-6 py-10 text-center"
      >
        <h2 id="indicadores-desempenho" className="text-sm font-semibold text-zinc-900">
          Sem indicadores para este par
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Nenhum índice Artificial Analysis, Elo LMArena ou Elo Design Arena em
          comum entre {modelA.nomeCurto} e {modelB.nomeCurto}.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="indicadores-desempenho"
      className="flex flex-col gap-6"
    >
      <h2 id="indicadores-desempenho" className="sr-only">
        Indicadores de desempenho
      </h2>

      {/* ===== 1. Índices AA (pares completos 0–100) ===== */}
      {aaPares.length > 0 && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Índices Artificial Analysis{" "}
              <span className="font-normal text-zinc-500">
                (0–100, pares completos)
              </span>
            </h3>
            <Legenda modelA={modelA} modelB={modelB} />
          </div>
          <div className="mt-2 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aaPares}
                margin={{ top: 20, right: 12, left: -8, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid
                  stroke="#e4e4e7"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="metrica"
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  axisLine={{ stroke: "#d4d4d8" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<TooltipConteudo extra="Índice AA 0–100 · dados ao vivo" />}
                  cursor={{ fill: "rgba(24,24,27,0.03)" }}
                />
                <Bar
                  name={modelA.nomeCurto}
                  dataKey={modelA.nomeCurto}
                  fill={`color-mix(in srgb, ${modelA.cor} 78%, #18181b)`}
                  radius={[5, 5, 0, 0]}
                  barSize={42}
                >
                  <LabelList
                    dataKey={modelA.nomeCurto}
                    position="top"
                    fill="#52525b"
                    fontSize={12}
                    formatter={(v) => (v == null ? "" : `${v}`)}
                  />
                </Bar>
                <Bar
                  name={modelB.nomeCurto}
                  dataKey={modelB.nomeCurto}
                  fill={`color-mix(in srgb, ${modelB.cor} 78%, #18181b)`}
                  radius={[5, 5, 0, 0]}
                  barSize={42}
                >
                  <LabelList
                    dataKey={modelB.nomeCurto}
                    position="top"
                    fill="#52525b"
                    fontSize={12}
                    formatter={(v) => (v == null ? "" : `${v}`)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===== 2. Métricas AA de um lado (chips, sem barras solas) ===== */}
      {aaSolo.length > 0 && (
        <div className="card flex flex-wrap items-center gap-2 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Só existe de um lado:
          </h3>
          {aaSolo.map((s) => (
            <span
              key={`${s.rotulo}-${s.lado}`}
              title={`Índice AA 0–100 · só o ${s.nome} tem esta métrica`}
              className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] tabular-nums text-zinc-700"
            >
              {s.rotulo} · <span className="font-semibold">{s.valor}</span>{" "}
              <span className="text-zinc-400">({s.nome})</span>
            </span>
          ))}
        </div>
      )}

      {/* ===== 3. Elos face a face ===== */}
      {elosPares.length > 0 && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Elos face a face{" "}
              <span className="font-normal text-zinc-500">
                (mesma arena dos dois lados)
              </span>
            </h3>
            <Legenda modelA={modelA} modelB={modelB} />
          </div>
          <div className="mt-2 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={elosPares.map((r) => ({
                  metrica: r.rotulo,
                  sub: r.sub,
                  [modelA.nomeCurto]: Math.round(r.eloA),
                  [modelB.nomeCurto]: Math.round(r.eloB),
                }))}
                margin={{ top: 20, right: 12, left: -8, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid
                  stroke="#e4e4e7"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="metrica"
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  axisLine={{ stroke: "#d4d4d8" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<TooltipConteudo extra="Elo da arena indicada" />}
                  cursor={{ fill: "rgba(24,24,27,0.03)" }}
                />
                <Bar
                  name={modelA.nomeCurto}
                  dataKey={modelA.nomeCurto}
                  fill={`color-mix(in srgb, ${modelA.cor} 78%, #18181b)`}
                  radius={[5, 5, 0, 0]}
                  barSize={38}
                >
                  <LabelList
                    dataKey={modelA.nomeCurto}
                    position="top"
                    fill="#52525b"
                    fontSize={12}
                  />
                </Bar>
                <Bar
                  name={modelB.nomeCurto}
                  dataKey={modelB.nomeCurto}
                  fill={`color-mix(in srgb, ${modelB.cor} 78%, #18181b)`}
                  radius={[5, 5, 0, 0]}
                  barSize={38}
                >
                  <LabelList
                    dataKey={modelB.nomeCurto}
                    position="top"
                    fill="#52525b"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            Cada grupo é uma arena diferente (Elo não é comparável entre
            arenas) — o hover indica a arena de origem de cada grupo.
          </p>
        </div>
      )}

      {/* ===== 4. Design Arena: tabela completa ===== */}
      {designLinhas.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-900">
            Arena de Design{" "}
            <span className="font-normal text-zinc-500">(Elo + win rate)</span>
          </h3>
          <div className="mt-2 max-h-[380px] overflow-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <caption className="sr-only">
                Elo e win rate da Design Arena por categoria
              </caption>
              <thead>
                <tr className="sticky top-0 border-b border-zinc-200 bg-white text-xs uppercase tracking-wider text-zinc-400">
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">
                    Categoria
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    {modelA.nomeCurto}
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    {modelB.nomeCurto}
                  </th>
                </tr>
              </thead>
              <tbody>
                {designLinhas.map((l) => {
                  const aVence = l.a != null && (l.b == null || l.a.elo > l.b.elo);
                  const bVence = l.b != null && (l.a == null || l.b.elo > l.a.elo);
                  return (
                    <tr
                      key={l.categoria + l.arena}
                      className="border-t border-zinc-100 transition-colors hover:bg-zinc-50"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 text-left font-medium text-zinc-600"
                      >
                        {l.categoria}
                        <span className="ml-2 text-[10px] font-normal text-zinc-400">
                          {l.arena}
                        </span>
                      </th>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">
                        {l.a ? (
                          <span
                            className={aVence ? "font-semibold text-zinc-900" : ""}
                          >
                            {Math.round(l.a.elo)}
                            {l.a.win != null && (
                              <span className="ml-2 text-xs text-zinc-400">
                                {formatWinRate(l.a.win)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="nodata">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">
                        {l.b ? (
                          <span
                            className={bVence ? "font-semibold text-zinc-900" : ""}
                          >
                            {Math.round(l.b.elo)}
                            {l.b.win != null && (
                              <span className="ml-2 text-xs text-zinc-400">
                                {formatWinRate(l.b.win)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="nodata">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
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
import { formatWinRate } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";

const AA_METRICAS = [
  { key: "intelligence_index", rotulo: "Inteligência" },
  { key: "coding_index", rotulo: "Codificação" },
  { key: "math_index", rotulo: "Matemática" },
  { key: "agentic_index", rotulo: "Agentes" },
] as const;

/** Tooltip escuro com os índices de cada modelo. */
function AATooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string | null; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-bold text-zinc-900">{label}</p>
      {payload.map((p) => (
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
          <strong className="text-zinc-900">{p.value ?? "—"}</strong>
        </p>
      ))}
    </div>
  );
}

/**
 * Indicadores de desempenho em valores NATIVOS (estilo OpenRouter compare):
 * barras dos índices Artificial Analysis (0–100) + tabela Elo da Design
 * Arena com win rate. Secções sem dados são omitidas.
 */
export function IndicadoresDesempenho({
  modelA,
  modelB,
}: {
  modelA: AIModel;
  modelB: AIModel;
}) {
  const aaData = useMemo(
    () =>
      AA_METRICAS.map(({ key, rotulo }) => ({
        metrica: rotulo,
        [modelA.nomeCurto]: modelA.aa?.[key] ?? null,
        [modelB.nomeCurto]: modelB.aa?.[key] ?? null,
      })).filter(
        (d) =>
          d[modelA.nomeCurto] != null || d[modelB.nomeCurto] != null,
      ),
    [modelA, modelB],
  );

  const designLinhas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        categoria: string;
        a?: { elo: number; win: number | null };
        b?: { elo: number; win: number | null };
      }
    >();
    for (const d of modelA.designTodas ?? []) {
      const k = `${d.arena}/${d.category}`;
      mapa.set(k, {
        categoria: d.category,
        a: { elo: d.elo, win: d.win_rate },
      });
    }
    for (const d of modelB.designTodas ?? []) {
      const k = `${d.arena}/${d.category}`;
      const atual = mapa.get(k) ?? { categoria: d.category };
      atual.b = { elo: d.elo, win: d.win_rate };
      mapa.set(k, atual);
    }
    return [...mapa.values()].sort(
      (x, y) =>
        Math.max(y.a?.elo ?? 0, y.b?.elo ?? 0) -
        Math.max(x.a?.elo ?? 0, x.b?.elo ?? 0),
    );
  }, [modelA, modelB]);

  // Nunca retorna null: sem dados vira cartão explicativo.
  if (aaData.length === 0 && designLinhas.length === 0) {
    return (
      <section
        aria-labelledby="indicadores-desempenho"
        className="glass-card flex flex-col items-center px-6 py-10 text-center"
      >
        <h2 id="indicadores-desempenho" className="sr-only">
          Indicadores de desempenho
        </h2>
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-stone-300 text-stone-400">
          <BarChart3 size={20} aria-hidden="true" />
        </span>
        <p className="mt-4 font-bold text-zinc-900">
          Sem indicadores para este par
        </p>
        <p className="mt-1 max-w-md text-sm text-zinc-500">
          Nenhum índice Artificial Analysis nem Elo Design Arena em comum
          entre {modelA.nomeCurto} e {modelB.nomeCurto}. A tabela analítica
          acima mostra o que existe de nativo.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="indicadores-desempenho"
      className="glass-card flex flex-col gap-5 p-5"
    >
      <h2 id="indicadores-desempenho" className="text-base font-bold text-zinc-900">
        Indicadores de desempenho
      </h2>

      {aaData.length > 0 && (
        <div className="chart-card rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-800">
              Artificial Analysis{" "}
              <span className="font-normal text-stone-500">(índices 0–100)</span>
            </h3>
            <div className="flex items-center gap-4 text-xs" aria-hidden="true">
              {[
                { m: modelA },
                { m: modelB },
              ].map(({ m }) => (
                <span key={m.id} className="flex items-center gap-1.5">
                  <ModelLogo
                    nome={m.nomeCurto}
                    dominio={m.dominioLogo}
                    cor={m.cor}
                    tamanho={20}
                  />
                  <span className="font-semibold text-zinc-700">
                    {m.nomeCurto}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aaData}
                margin={{ top: 20, right: 12, left: -8, bottom: 0 }}
                barGap={8}
              >
                <defs>
                  <linearGradient id="aaBarA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={modelA.cor} stopOpacity={1} />
                    <stop offset="100%" stopColor={modelA.cor} stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="aaBarB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={modelB.cor} stopOpacity={1} />
                    <stop offset="100%" stopColor={modelB.cor} stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e7e5e4"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="metrica"
                  tick={{ fontSize: 12, fill: "#57534e", fontWeight: 600 }}
                  axisLine={{ stroke: "#d6d3d1" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<AATooltip />}
                  cursor={{ fill: "rgba(28,25,23,0.04)" }}
                />
                <Bar
                  name={modelA.nomeCurto}
                  dataKey={modelA.nomeCurto}
                  fill="url(#aaBarA)"
                  radius={[8, 8, 3, 3]}
                  barSize={46}
                  animationDuration={900}
                >
                  <LabelList
                    dataKey={modelA.nomeCurto}
                    position="top"
                    fill="#44403c"
                    fontSize={12}
                    fontWeight={700}
                    formatter={(v) => (v == null ? "" : `${v}`)}
                  />
                </Bar>
                <Bar
                  name={modelB.nomeCurto}
                  dataKey={modelB.nomeCurto}
                  fill="url(#aaBarB)"
                  radius={[8, 8, 3, 3]}
                  barSize={46}
                  animationDuration={900}
                >
                  <LabelList
                    dataKey={modelB.nomeCurto}
                    position="top"
                    fill="#44403c"
                    fontSize={12}
                    fontWeight={700}
                    formatter={(v) => (v == null ? "" : `${v}`)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {designLinhas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">
            Arena de Design{" "}
            <span className="font-normal text-stone-500">(Elo + win rate)</span>
          </h3>
          <div className="chart-card mt-2 max-h-[420px] overflow-auto rounded-xl border border-stone-200">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Elo e win rate da Design Arena por categoria
              </caption>
              <thead>
                <tr className="sticky top-0 bg-stone-100 text-xs tracking-wider text-stone-500 uppercase">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Categoria
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">
                    {modelA.nomeCurto}
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    {modelB.nomeCurto}
                  </th>
                </tr>
              </thead>
              <tbody>
                {designLinhas.map((l, i) => {
                  const aVence = l.a != null && (l.b == null || l.a.elo > l.b.elo);
                  const bVence = l.b != null && (l.a == null || l.b.elo > l.a.elo);
                  return (
                  <tr
                    key={l.categoria}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="row-enter border-t border-stone-100 transition-colors hover:bg-stone-50"
                  >
                    <th scope="row" className="py-2 pr-4 font-medium text-zinc-700">
                      {l.categoria}
                    </th>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {l.a ? (
                        <>
                          <span
                            className={`font-bold ${aVence ? "text-emerald-700" : "text-zinc-900"}`}
                          >
                            {Math.round(l.a.elo)}
                          </span>{" "}
                          {l.a.win != null && (
                            <span className="text-xs font-semibold text-emerald-600">
                              {formatWinRate(l.a.win)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="nodata">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {l.b ? (
                        <>
                          <span
                            className={`font-bold ${bVence ? "text-emerald-700" : "text-zinc-900"}`}
                          >
                            {Math.round(l.b.elo)}
                          </span>{" "}
                          {l.b.win != null && (
                            <span className="text-xs font-semibold text-emerald-600">
                              {formatWinRate(l.b.win)}
                            </span>
                          )}
                        </>
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

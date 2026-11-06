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
import { formatWinRate } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";

const AA_METRICAS = [
  { key: "intelligence_index", rotulo: "Inteligência" },
  { key: "coding_index", rotulo: "Codificação" },
  { key: "math_index", rotulo: "Matemática" },
  { key: "agentic_index", rotulo: "Agentes" },
] as const;

/** Tooltip branco, sóbrio. */
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
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-zinc-900">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 tabular-nums text-zinc-600">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{" "}
          <strong className="font-medium text-zinc-900">{p.value ?? "—"}</strong>
        </p>
      ))}
    </div>
  );
}

/**
 * Indicadores de desempenho em valores NATIVOS: barras dos índices
 * Artificial Analysis (0–100) + tabela Elo da Design Arena com win
 * rate. Secções sem dados são omitidas.
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

  if (aaData.length === 0 && designLinhas.length === 0) {
    return (
      <section
        aria-labelledby="indicadores-desempenho"
        className="card px-6 py-10 text-center"
      >
        <h2 id="indicadores-desempenho" className="text-sm font-semibold text-zinc-900">
          Sem indicadores para este par
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Nenhum índice Artificial Analysis nem Elo Design Arena em comum
          entre {modelA.nomeCurto} e {modelB.nomeCurto}.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="indicadores-desempenho"
      className="card flex flex-col gap-6 p-5"
    >
      <h2 id="indicadores-desempenho" className="sr-only">
        Indicadores de desempenho
      </h2>

      {aaData.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Artificial Analysis{" "}
              <span className="font-normal text-zinc-500">(índices 0–100)</span>
            </h3>
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
          </div>
          <div className="mt-2 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aaData}
                margin={{ top: 20, right: 12, left: -8, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
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
                <Tooltip content={<AATooltip />} cursor={{ fill: "rgba(24,24,27,0.03)" }} />
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

      {designLinhas.length > 0 && (
        <div>
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
                      key={l.categoria}
                      className="border-t border-zinc-100 transition-colors hover:bg-zinc-50"
                    >
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-zinc-600">
                        {l.categoria}
                      </th>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">
                        {l.a ? (
                          <span className={aVence ? "font-semibold text-zinc-900" : ""}>
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
                          <span className={bVence ? "font-semibold text-zinc-900" : ""}>
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

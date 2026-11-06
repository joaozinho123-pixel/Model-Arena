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

/** Info de marca do tooltip: nome → logótipo do fornecedor. */
type LogoInfo = { nome: string; cor: string; dominioLogo?: string };

/** Tooltip branco, sóbrio: logótipos, valores e a diferença do par. */
function TooltipConteudo({
  active,
  payload,
  label,
  extra,
  logos,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string | null; color?: string }[];
  label?: string;
  extra?: string | null;
  logos?: LogoInfo[];
}) {
  if (!active || !payload?.length) return null;
  const porNome = new Map((logos ?? []).map((l) => [l.nome, l]));
  const linhas = payload.filter((p) => p.value != null);
  const nums = linhas
    .map((p) => Number(p.value))
    .filter((n) => Number.isFinite(n));
  const delta =
    nums.length === 2 ? Math.abs(nums[0] - nums[1]) : null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-zinc-900">{label}</p>
      {extra && <p className="mb-1 text-[11px] text-zinc-400">{extra}</p>}
      {linhas.map((p) => {
        const logo = porNome.get(p.name ?? "");
        return (
          <p
            key={p.name}
            className="flex items-center gap-1.5 tabular-nums text-zinc-600"
          >
            {logo && (
              <ModelLogo
                nome={logo.nome}
                dominio={logo.dominioLogo}
                cor={logo.cor}
                tamanho={16}
              />
            )}
            {p.name}:{" "}
            <strong className="font-medium text-zinc-900">{p.value}</strong>
          </p>
        );
      })}
      {delta != null && delta > 0 && (
        <p className="mt-1 border-t border-zinc-100 pt-1 text-[11px] text-zinc-500">
          diferença de{" "}
          <strong className="font-medium text-zinc-900">
            {Math.round(delta * 10) / 10}
          </strong>{" "}
          pontos
        </p>
      )}
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

/** Rótulo sobre a barra: valor, logótipo e marca de vencedor. */
function BarLabel(props: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string | boolean | null;
  index?: number;
  /** Modelo desta série. */
  modelo: AIModel;
  /** Valor do par no grupo (null se não há par completo). */
  par: number | null;
  /** Vencedor do grupo ("A", "B" ou null em empate). */
  vencedor: "A" | "B" | null;
  lado: "A" | "B";
  /** Casas decimais (AA mostra decimal; Elo arredonda). */
  casas?: number;
}) {
  const { x, y, width, value, modelo, par, vencedor, lado, casas = 0 } = props;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  const nx = Number(x);
  const ny = Number(y);
  const nw = Number(width);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;
  const cx = nx + (Number.isFinite(nw) ? nw / 2 : 21);
  const texto =
    casas > 0 ? num.toFixed(casas) : String(Math.round(num));
  const ganhou = vencedor === lado;
  return (
    <g>
      {/* Logótipo do fornecedor por cima do valor */}
      {modelo.dominioLogo ? (
        <image
          href={modelo.dominioLogo}
          x={cx - 7}
          y={ny - 20}
          width={14}
          height={14}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <circle cx={cx} cy={ny - 13} r={5} fill={modelo.cor} />
      )}
      <text
        x={cx}
        y={ny - 3}
        textAnchor="middle"
        fontSize={11}
        fontWeight={ganhou ? 700 : 500}
        fill={ganhou ? "#18181b" : "#52525b"}
      >
        {texto}
      </text>
      {ganhou && par != null && (
        <path
          d={`M ${cx - 4} ${ny + 1} L ${cx + 4} ${ny + 1} L ${cx} ${ny + 7} Z`}
          fill="#18181b"
        />
      )}
    </g>
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
  const { aaPares,aaSolo } = useMemo(() => {
    const pares: {
      metrica: string;
      vA: number;
      vB: number;
      vencedor: "A" | "B" | null;
      [nome: string]: string | number | null;
    }[] = [];
    const solo: { rotulo: string; lado: "A" | "B"; valor: number; nome: string }[] =
      [];
    for (const { key, rotulo } of AA_METRICAS) {
      const va = modelA.aa?.[key];
      const vb = modelB.aa?.[key];
      if (typeof va === "number" && typeof vb === "number") {
        pares.push({
          metrica: rotulo,
          vA: va,
          vB: vb,
          vencedor: va === vb ? null : va > vb ? "A" : "B",
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
    return { aaPares: pares,aaSolo: solo };
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
    return linhas
      .map((r) => ({
        ...r,
        vencedor: r.eloA === r.eloB ? null : r.eloA > r.eloB ? "A" : "B",
        metrica: r.rotulo,
        [modelA.nomeCurto]: Math.round(r.eloA),
        [modelB.nomeCurto]: Math.round(r.eloB),
      }) as {
        metrica: string;
        rotulo: string;
        sub: string;
        vencedor: "A" | "B" | null;
        [nome: string]: string | number | null;
      })
      .sort(
        (x, y) =>
          Math.abs((y[modelA.nomeCurto] as number) - (y[modelB.nomeCurto] as number)) -
          Math.abs((x[modelA.nomeCurto] as number) - (x[modelB.nomeCurto] as number)),
      );
  }, [modelA, modelB, designLinhas]);

  const logos: LogoInfo[] = [
    {
      nome: modelA.nomeCurto,
      cor: modelA.cor,
      dominioLogo: modelA.dominioLogo,
    },
    {
      nome: modelB.nomeCurto,
      cor: modelB.cor,
      dominioLogo: modelB.dominioLogo,
    },
  ];

  const barAA = (modelo: AIModel, lado: "A" | "B") => (
    <Bar
      name={modelo.nomeCurto}
      dataKey={modelo.nomeCurto}
      fill={`color-mix(in srgb, ${modelo.cor} 78%, #18181b)`}
      radius={[5, 5, 0, 0]}
      barSize={42}
    >
      <LabelList
        dataKey={modelo.nomeCurto}
        content={(props) => (
          <BarLabel
            {...props}
            modelo={modelo}
            lado={lado}
            casas={1}
            par={
              lado === "A"
                ? ((props.index != null
                    ? aaPares[Number(props.index)]?.vB
                    : null) ?? null)
                : ((props.index != null
                    ? aaPares[Number(props.index)]?.vA
                    : null) ?? null)
            }
            vencedor={
              (props.index != null
                ? (aaPares[Number(props.index)]?.vencedor ?? null)
                : null) ?? null
            }
          />
        )}
      />
    </Bar>
  );

  const barElo = (modelo: AIModel, lado: "A" | "B") => (
    <Bar
      name={modelo.nomeCurto}
      dataKey={modelo.nomeCurto}
      fill={`color-mix(in srgb, ${modelo.cor} 78%, #18181b)`}
      radius={[5, 5, 0, 0]}
      barSize={38}
    >
      <LabelList
        dataKey={modelo.nomeCurto}
        content={(props) => (
          <BarLabel
            {...props}
            modelo={modelo}
            lado={lado}
            casas={0}
            par={
              lado === "A"
                ? (props.index != null
                    ? (elosPares[Number(props.index)]?.[modelB.nomeCurto] as number)
                    : null)
                : (props.index != null
                    ? (elosPares[Number(props.index)]?.[modelA.nomeCurto] as number)
                    : null)
            }
            vencedor={
              (props.index != null
                ? (elosPares[Number(props.index)]?.vencedor ?? null)
                : null) ?? null
            }
          />
        )}
      />
    </Bar>
  );

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
        <h2
          id="indicadores-desempenho"
          className="text-sm font-semibold text-zinc-900"
        >
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
                margin={{ top: 28, right: 12, left: -8, bottom: 0 }}
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
                  content={<TooltipConteudo extra="Índice AA 0–100 · dados ao vivo" logos={logos} />}
                  cursor={{ fill: "rgba(24,24,27,0.03)" }}
                />
                {barAA(modelA, "A")}
                {barAA(modelB, "B")}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            Logótipo e valor sobre cada barra · a marca triangular assinala o
            vencedor do grupo · os índices não são comparáveis entre métricas.
          </p>
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
              className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 tabular-nums"
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
                data={elosPares}
                margin={{ top: 28, right: 12, left: -8, bottom: 0 }}
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
                  content={<TooltipConteudo extra="Elo da arena indicada" logos={logos} />}
                  cursor={{ fill: "rgba(24,24,27,0.03)" }}
                />
                {barElo(modelA, "A")}
                {barElo(modelB, "B")}
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

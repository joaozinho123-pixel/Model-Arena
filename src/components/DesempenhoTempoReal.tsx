"use client";

import { useEffect, useState } from "react";
import { Activity, Check, Gauge, Minus } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import {
  getResumoEndpoints,
  type ResumoEndpoints,
} from "@/lib/endpoints";
import {
  formatContext,
  formatSegundos,
  formatTokS,
  formatWinRate,
} from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";

function LinhaCheck({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between border-t border-stone-100 py-2.5">
      <span className="text-sm text-stone-500">{rotulo}</span>
      {valor == null ? (
        <span title="A API não publica este dado" className="nodata">
          —
        </span>
      ) : valor ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/10">
          <Check size={13} aria-label="Sim" className="text-emerald-700" />
        </span>
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-200">
          <Minus size={13} aria-label="Não" className="text-stone-400" />
        </span>
      )}
    </div>
  );
}

/**
 * Desempenho em tempo real (endpoint público OpenRouter, sem chave):
 * latência p50, produtividade p50, fornecedores, uptime e características.
 * Falha graciosa quando a API não responde.
 */
export function DesempenhoTempoReal({
  modelA,
  modelB,
}: {
  modelA: AIModel;
  modelB: AIModel;
}) {
  const [resumos, setResumos] = useState<
    [ResumoEndpoints | null, ResumoEndpoints | null] | null
  >(null);
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    // setState só dentro do callback da promise (não no corpo do efeito).
    Promise.all([getResumoEndpoints(modelA.id), getResumoEndpoints(modelB.id)])
      .then(([a, b]) => {
        if (!vivo) return;
        if (!a && !b) setFalhou(true);
        else setResumos([a, b]);
      })
      .catch(() => vivo && setFalhou(true));
    return () => {
      vivo = false;
    };
  }, [modelA.id, modelB.id, tentativa]);

  // Nunca retorna null: falha graciosa vira cartão com retry.
  if (falhou) {
    return (
      <section aria-labelledby="desempenho-realtime" className="flex flex-col gap-3">
        <h2
          id="desempenho-realtime"
          className="flex items-center gap-2 text-base font-bold text-zinc-900"
        >
          <Gauge size={18} aria-hidden="true" className="text-indigo-600" />
          Desempenho em tempo real
        </h2>
        <div className="glass-card flex flex-col items-center px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-stone-300 text-stone-400">
            <Gauge size={20} aria-hidden="true" />
          </span>
          <p className="mt-4 font-bold text-zinc-900">
            Tempo real indisponível de momento
          </p>
          <p className="mt-1 max-w-md text-sm text-zinc-600">
            A API de endpoints do OpenRouter não respondeu para este par.
            Os benchmarks e o resto da análise continuam disponíveis acima.
          </p>
          <button
            type="button"
            onClick={() => {
              setFalhou(false);
              setResumos(null);
              setTentativa((t) => t + 1);
            }}
            className="btn-primary mt-5 rounded-xl px-5 py-2 text-sm"
          >
            Tentar de novo
          </button>
        </div>
      </section>
    );
  }

  const [ra, rb] = resumos ?? [null, null];
  const latA = ra?.latenciaP50 ?? null;
  const latB = rb?.latenciaP50 ?? null;
  const tputA = ra?.throughputP50 ?? null;
  const tputB = rb?.throughputP50 ?? null;

  const coluna = (
    model: AIModel,
    r: ResumoEndpoints | null,
    lado: "A" | "B",
  ) => {
    const latVence =
      latA != null &&
      latB != null &&
      ((lado === "A" && latA < latB) || (lado === "B" && latB < latA));
    const tputVence =
      tputA != null &&
      tputB != null &&
      ((lado === "A" && tputA > tputB) || (lado === "B" && tputB > tputA));
    const corLado = "#18181b";
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2.5">
          <ModelLogo
            nome={model.nomeCurto}
            dominio={model.dominioLogo}
            cor={model.cor}
            tamanho={28}
          />
          <h3 className="truncate text-sm font-bold text-zinc-900">
            <span style={{ color: corLado }}>Modelo {lado}</span> ·{" "}
            {model.nomeCurto}
          </h3>
        </div>
        {!resumos ? (
          <div aria-label="A carregar desempenho" className="mt-4 flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton-shimmer h-9 rounded-lg"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <dl className="mt-3">
            <div className="flex items-center justify-between border-t border-stone-100 py-2.5">
              <dt className="text-sm text-stone-500">Latência (p50)</dt>
              <dd
                className={`text-sm font-bold tabular-nums transition-colors ${
                  latVence ? "text-emerald-700" : "text-zinc-900"
                }`}
              >
                {r?.latenciaP50 != null ? (
                  formatSegundos(r.latenciaP50)
                ) : (
                  <span title="A API não publica latência p50" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 py-2.5">
              <dt className="text-sm text-stone-500">Produtividade (p50)</dt>
              <dd
                className={`text-sm font-bold tabular-nums transition-colors ${
                  tputVence ? "text-emerald-700" : "text-zinc-900"
                }`}
              >
                {r?.throughputP50 != null ? (
                  formatTokS(r.throughputP50)
                ) : (
                  <span title="A API não publica produtividade p50" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 py-2.5">
              <dt className="text-sm text-stone-500">Fornecedores</dt>
              <dd className="text-sm font-bold tabular-nums text-zinc-900">
                {r ? (
                  `${r.operacionais}/${r.total}`
                ) : (
                  <span title="Sem resposta da API de endpoints" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 py-2.5">
              <dt className="text-sm text-stone-500">Uptime (30m)</dt>
              <dd className="text-sm font-bold tabular-nums text-zinc-900">
                {r?.uptime30m != null ? (
                  formatWinRate(r.uptime30m)
                ) : (
                  <span title="A API não publica uptime" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 py-2.5">
              <dt className="text-sm text-stone-500">Tokens de saída máx.</dt>
              <dd className="text-sm font-bold tabular-nums text-zinc-900">
                {r?.maxSaida != null ? (
                  formatContext(r.maxSaida)
                ) : (
                  <span title="A API não publica o máximo de saída" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 py-2.5">
              <dt className="text-sm text-stone-500">Quantização</dt>
              <dd className="text-sm font-semibold text-zinc-600">
                {r?.quantizacao && r.quantizacao !== "unknown"
                  ? r.quantizacao
                  : "desconhecida"}
              </dd>
            </div>
            <div className="mt-2 border-t border-stone-100 pt-1">
              <p className="py-1 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                Características
              </p>
              <LinhaCheck rotulo="Uso da ferramenta" valor={model.ferramentas} />
              <LinhaCheck
                rotulo="Saída estruturada"
                valor={model.saidaEstruturada}
              />
              <LinhaCheck rotulo="Raciocínio" valor={model.raciocinio} />
              <LinhaCheck
                rotulo="Cache implícito"
                valor={r?.cacheImplicito ?? null}
              />
            </div>
          </dl>
        )}
      </div>
    );
  };

  return (
    <section aria-labelledby="desempenho-realtime" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="desempenho-realtime"
          className="flex items-center gap-2 text-base font-bold text-zinc-900"
        >
          <Gauge size={18} aria-hidden="true" className="text-indigo-600" />
          Desempenho em tempo real
        </h2>
        <span className="live-stripes inline-flex items-center gap-1.5 rounded-full border border-emerald-700/30 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          <span
            aria-hidden="true"
            className="ring-pulse dot-pulse inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
          />
          <Activity size={11} aria-hidden="true" />
          Ao vivo via OpenRouter
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {coluna(modelA, ra, "A")}
        {coluna(modelB, rb, "B")}
      </div>
      <p className="text-xs text-stone-500">
        Latência e produtividade medianas (p50) por fornecedor via OpenRouter ·
        melhor fornecedor de cada métrica · travessão quando a API não publica
        o dado.
      </p>
    </section>
  );
}

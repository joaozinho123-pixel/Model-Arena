"use client";

import { useEffect, useState } from "react";
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
    <div className="flex items-center justify-between border-t border-zinc-100 py-2.5">
      <span className="text-sm text-zinc-500">{rotulo}</span>
      {valor == null ? (
        <span title="A API não publica este dado" className="nodata">
          —
        </span>
      ) : valor ? (
        <span className="text-sm font-medium text-zinc-900">Sim</span>
      ) : (
        <span className="text-sm text-zinc-400">Não</span>
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

  if (falhou) {
    return (
      <section aria-labelledby="desempenho-realtime" className="flex flex-col gap-3">
        <div className="card flex flex-col items-center px-6 py-10 text-center">
          <p className="text-sm font-semibold text-zinc-900">
            Tempo real indisponível de momento
          </p>
          <p className="mt-1 max-w-md text-sm text-zinc-500">
            A API de endpoints do OpenRouter não respondeu para este par.
            Os benchmarks e o resto da análise continuam na página.
          </p>
          <button
            type="button"
            onClick={() => {
              setFalhou(false);
              setResumos(null);
              setTentativa((t) => t + 1);
            }}
            className="btn-ghost mt-5 px-4 py-2 text-sm"
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
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2.5">
          <ModelLogo
            nome={model.nomeCurto}
            dominio={model.dominioLogo}
            cor={model.cor}
            tamanho={28}
          />
          <h3 className="truncate text-sm font-semibold text-zinc-900">
            {model.nomeCurto}
          </h3>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Modelo {lado}
          </span>
        </div>
        {!resumos ? (
          <div aria-label="A carregar desempenho" className="mt-4 flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-4" />
            ))}
          </div>
        ) : (
          <dl className="mt-3 text-sm">
            <div className="flex items-center justify-between border-t border-zinc-100 py-2.5">
              <dt className="text-zinc-500">Latência (p50)</dt>
              <dd
                className={latVence ? "font-semibold text-zinc-900" : "text-zinc-900"}
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
            <div className="flex items-center justify-between border-t border-zinc-100 py-2.5">
              <dt className="text-zinc-500">Produtividade (p50)</dt>
              <dd
                className={
                  tputVence ? "font-semibold text-zinc-900" : "text-zinc-900"
                }
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
            <div className="flex items-center justify-between border-t border-zinc-100 py-2.5">
              <dt className="text-zinc-500">Fornecedores</dt>
              <dd className="text-zinc-900 tabular-nums">
                {r ? (
                  `${r.operacionais}/${r.total}`
                ) : (
                  <span title="Sem resposta da API de endpoints" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 py-2.5">
              <dt className="text-zinc-500">Uptime (30m)</dt>
              <dd className="text-zinc-900 tabular-nums">
                {r?.uptime30m != null ? (
                  formatWinRate(r.uptime30m)
                ) : (
                  <span title="A API não publica uptime" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 py-2.5">
              <dt className="text-zinc-500">Tokens de saída máx.</dt>
              <dd className="text-zinc-900 tabular-nums">
                {r?.maxSaida != null ? (
                  formatContext(r.maxSaida)
                ) : (
                  <span title="A API não publica o máximo de saída" className="nodata">
                    —
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 py-2.5">
              <dt className="text-zinc-500">Quantização</dt>
              <dd className="text-zinc-500">
                {r?.quantizacao && r.quantizacao !== "unknown"
                  ? r.quantizacao
                  : "desconhecida"}
              </dd>
            </div>
            <div className="mt-2 border-t border-zinc-100 pt-1">
              <p className="py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
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
          className="sr-only"
        >
          Desempenho em tempo real
        </h2>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
          />
          Ao vivo via OpenRouter
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {coluna(modelA, ra, "A")}
        {coluna(modelB, rb, "B")}
      </div>
      <p className="text-xs text-zinc-400">
        Latência e produtividade medianas (p50) via OpenRouter · travessão
        quando a API não publica o dado.
      </p>
    </section>
  );
}

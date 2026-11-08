"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { ModelLogo } from "@/components/ModelLogo";

const LS_DUELOS = "model-arena-duelos-recentes-v1";
const OK_ID = /^[\w.\-]+\/[\w.\-]+$/;
const MAX = 6;

export interface DueloPar {
  a: string;
  b: string;
}

/** Lê a lista de duelos recentes (ids validados). */
export function lerDuelos(): DueloPar[] {
  try {
    const raw = window.localStorage.getItem(LS_DUELOS);
    if (!raw) return [];
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j.filter(
      (x): x is DueloPar =>
        !!x &&
        typeof x === "object" &&
        typeof (x as DueloPar).a === "string" &&
        OK_ID.test((x as DueloPar).a) &&
        typeof (x as DueloPar).b === "string" &&
        OK_ID.test((x as DueloPar).b),
    );
  } catch {
    return [];
  }
}

/** Grava um duelo no topo da lista (sem duplicados, máx. 6). */
export function gravarDuelo(a: string, b: string): void {
  try {
    const atuais = lerDuelos().filter((d) => !(d.a === a && d.b === b));
    atuais.unshift({ a, b });
    window.localStorage.setItem(
      LS_DUELOS,
      JSON.stringify(atuais.slice(0, MAX)),
    );
  } catch {
    /* armazenamento indisponível: segue sem persistir */
  }
}

/**
 * "Duelos recentes": combinações escolhidas antes, prontas a repetir
 * num clique. Só mostra pares com os dois modelos resolvíveis e
 * esconde o par que está em jogo neste momento.
 */
export function DuelosRecentes({
  resolver,
  chaveAtual,
  onEscolher,
}: {
  /** Resolve um id no catálogo efetivo (snapshot + ao vivo). */
  resolver: (id: string) => AIModel | null;
  /** Chave do duelo atual ("a|b") — não se mostra a si próprio. */
  chaveAtual: string;
  onEscolher: (a: string, b: string) => void;
}) {
  const [duelos, setDuelos] = useState<DueloPar[]>([]);

  // Re-leitura assíncrona (evita setState síncrono no efeito);
  // reexecuta quando o duelo muda, para esconder o atual.
  useEffect(() => {
    let vivo = true;
    void Promise.resolve().then(() => {
      if (!vivo) return;
      setDuelos(lerDuelos());
    });
    return () => {
      vivo = false;
    };
  }, [chaveAtual]);

  const itens = duelos
    .filter((d) => `${d.a}|${d.b}` !== chaveAtual)
    .filter(
      (d, i, todos) =>
        todos.findIndex((x) => x.a === d.a && x.b === d.b) === i,
    )
    .slice(0, 4);

  if (itens.length === 0) return null;

  return (
    <div className="card px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        <History size={12} aria-hidden="true" />
        Duelos recentes
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {itens.map((d) => {
          const ma = resolver(d.a);
          const mb = resolver(d.b);
          if (!ma || !mb) return null;
          return (
            <button
              key={`${d.a}|${d.b}`}
              type="button"
              onClick={() => onEscolher(d.a, d.b)}
              title={`Repetir o duelo ${ma.nomeCurto} × ${mb.nomeCurto}`}
              className="chip max-w-full transition hover:text-zinc-900"
            >
              <ModelLogo
                nome={ma.nomeCurto}
                dominio={ma.dominioLogo}
                cor={ma.cor}
                tamanho={14}
              />
              <span className="max-w-24 truncate font-medium">
                {ma.nomeCurto}
              </span>
              <span className="text-zinc-300">×</span>
              <ModelLogo
                nome={mb.nomeCurto}
                dominio={mb.dominioLogo}
                cor={mb.cor}
                tamanho={14}
              />
              <span className="max-w-24 truncate font-medium">
                {mb.nomeCurto}
              </span>
              <RotateCcw size={11} aria-hidden="true" className="text-zinc-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

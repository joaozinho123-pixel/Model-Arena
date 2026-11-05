"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatCompact, formatContext, formatPrice, modalityLabel } from "@/lib/format";
import { headline } from "@/lib/comparar";
import { ModelLogo } from "@/components/ModelLogo";

/** Ficha de um modelo: identidade, descrição e dados essenciais. */
function DossierCard({ model, badge }: { model: AIModel; badge: "A" | "B" }) {
  const [expandida, setExpandida] = useState(false);
  const longa = model.descricao.length > 220;
  const h = headline(model);
  const modalidades = Array.from(
    new Set([...model.modalidades.entrada, ...model.modalidades.saida]),
  );

  return (
    <article aria-label={`Ficha de ${model.nomeCurto}`} className="card flex-1 p-5">
      <div className="flex items-start gap-3">
        <ModelLogo
          nome={model.nomeCurto}
          dominio={model.dominioLogo}
          cor={model.cor}
          tamanho={44}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Modelo {badge}
          </p>
          <h3 className="truncate text-base font-semibold text-zinc-900">
            {model.nomeCurto}
          </h3>
          <p className="truncate text-xs text-zinc-500">
            {model.empresa} · Top {model.rank} geral
          </p>
        </div>
        {h.valor !== "—" && (
          <span className="shrink-0 text-right" title={h.rotulo}>
            <span className="block text-lg font-semibold tabular-nums text-zinc-900">
              {h.valor}
            </span>
            <span className="block text-[10px] text-zinc-400">{h.rotulo}</span>
          </span>
        )}
      </div>

      {model.descricao ? (
        <div className="mt-3">
          <p
            className={`text-[13px] leading-relaxed text-zinc-600 ${
              expandida ? "" : "line-clamp-3"
            }`}
          >
            {model.descricao}
          </p>
          {longa && (
            <button
              type="button"
              onClick={() => setExpandida((v) => !v)}
              aria-expanded={expandida}
              className="mt-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              {expandida ? "Mostrar menos" : "Mostrar mais"}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-zinc-500">Sem descrição no catálogo.</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 border-t border-zinc-200 pt-3.5">
        <div>
          <dt className="text-[11px] text-zinc-500">Entrada / Saída</dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums text-zinc-900">
            {formatPrice(model.precoEntrada)} / {formatPrice(model.precoSaida)}
            <span className="text-xs font-normal text-zinc-400"> /1M</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-zinc-500">Contexto</dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums text-zinc-900">
            {formatContext(model.contexto)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-zinc-500">Modalidades</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {modalidades.map((mod) => (
              <span
                key={mod}
                title={modalityLabel(mod)}
                className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600"
              >
                {modalityLabel(mod)}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="mt-3.5 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-3 text-xs text-zinc-500">
        <a
          href={`https://openrouter.ai/${model.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-zinc-900"
        >
          OpenRouter <ExternalLink size={11} aria-hidden="true" />
        </a>
        {model.hf && (
          <a
            href={`https://huggingface.co/${model.hf.hf}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Hugging Face: ${model.hf.hf}`}
            className="inline-flex items-center gap-1 transition hover:text-zinc-900"
          >
            HF
            {model.hf.downloads != null &&
              ` · ${formatCompact(model.hf.downloads)} downloads`}{" "}
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

/** Fichas lado a lado dos dois modelos em comparação. */
export function ModelDossier({
  modelA,
  modelB,
}: {
  modelA: AIModel;
  modelB: AIModel;
}) {
  return (
    <section
      aria-label="Fichas dos modelos selecionados"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <DossierCard model={modelA} badge="A" />
      <DossierCard model={modelB} badge="B" />
    </section>
  );
}

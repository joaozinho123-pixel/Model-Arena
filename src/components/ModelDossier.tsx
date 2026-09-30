"use client";

import { useState } from "react";
import {
  AudioLines,
  Check,
  ChevronDown,
  Clapperboard,
  ExternalLink,
  FileText,
  ImageIcon,
  Type,
  Wrench,
} from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatCompact, formatContext, formatPrice, modalityLabel, prettyLicense } from "@/lib/format";
import { headline } from "@/lib/comparar";

/** Rótulos curtos dos benchmarks extra AA (frações 0–1). */
const EXTRA_LABELS: Record<string, string> = {
  gpqa: "GPQA",
  hle: "HLE",
  livecodebench: "LiveCodeBench",
  math_500: "MATH-500",
  aime: "AIME",
  aime_25: "AIME'25",
  scicode: "SciCode",
  ifbench: "IFBench",
  lcr: "LCR",
  terminalbench_hard: "TerminalBench",
  terminalbench_v2_1: "TerminalBench v2",
  tau2: "τ²",
  tau_banking: "τ² Bank",
  mmlu_pro: "MMLU-Pro",
};
import { ModelLogo } from "@/components/ModelLogo";

/** Ícone por modalidade (texto, imagem, áudio, vídeo, ficheiros). */
function ModalityIcon({ modality }: { modality: string }) {
  const props = { size: 13, "aria-hidden": true } as const;
  switch (modality.toLowerCase()) {
    case "image":
      return <ImageIcon {...props} />;
    case "audio":
      return <AudioLines {...props} />;
    case "video":
      return <Clapperboard {...props} />;
    case "file":
      return <FileText {...props} />;
    default:
      return <Type {...props} />;
  }
}

/** Ficha de um modelo: logótipo, descrição e cartões de info (estilo OpenRouter). */
function DossierCard({ model, badge }: { model: AIModel; badge: "A" | "B" }) {
  const [expandida, setExpandida] = useState(false);
  const longa = model.descricao.length > 220;
  const h = headline(model);
  const corLado = badge === "A" ? "#0284c7" : "#7c3aed";

  return (
    <article
      aria-label={`Ficha de ${model.nomeCurto}`}
      className="glass-card relative flex-1 overflow-hidden p-5"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${model.cor}, ${corLado}, transparent)`,
        }}
      />
      <div className="flex items-start gap-3 pt-1">
        <ModelLogo
          nome={model.nomeCurto}
          dominio={model.dominioLogo}
          cor={model.cor}
          tamanho={44}
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-bold tracking-widest uppercase"
            style={{ color: corLado }}
          >
            Modelo {badge} · {model.empresa}
          </p>
          <h3 className="truncate text-lg font-bold text-zinc-900">
            {model.nomeCurto}
          </h3>
          <p className="truncate font-mono text-xs text-zinc-500">{model.id}</p>
        </div>
        {h.valor !== "—" && (
          <span className="chip-in shrink-0 rounded-lg bg-indigo-600/10 px-2 py-1 text-right">
            <span className="block text-sm font-extrabold tabular-nums text-indigo-700">
              {h.valor}
            </span>
            <span className="block text-[10px] font-semibold text-indigo-600/80">
              {h.rotulo}
            </span>
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Estatísticas do modelo">
        {model.rank <= 10 && (
          <span className="chip-in rounded-full bg-indigo-600/10 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
            Top {model.rank} geral
          </span>
        )}
        <span
          title="Origem das métricas: AA direto, OpenRouter, LMArena ou sem dados"
          className={`chip-in rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            model.fonte === "aa"
              ? "border-teal-700/30 bg-teal-700/5 text-teal-700"
              : model.fonte === "openrouter"
                ? "border-sky-700/30 bg-sky-700/5 text-sky-700"
                : model.fonte === "arena"
                  ? "border-rose-600/30 bg-rose-600/5 text-rose-600"
                  : model.fonte === "mista"
                    ? "border-amber-600/40 bg-amber-600/5 text-amber-700"
                    : "border-stone-300 text-stone-500"
          }`}
        >
          {model.fonte === "aa"
            ? "AA direto"
            : model.fonte === "openrouter"
              ? "OpenRouter · AA"
              : model.fonte === "arena"
                ? "100% LMArena"
                : model.fonte === "mista"
                  ? "Parcial · fontes reais"
                  : "Sem dados"}
        </span>
      </div>
      {model.aa &&
        (model.aa.intelligence_index != null ||
          model.aa.coding_index != null ||
          model.aa.agentic_index != null ||
          model.aa.math_index != null ||
          model.aa.tps != null) && (
          <p className="mt-2 text-[11px] text-zinc-500">
            AA{" "}
            {[
              model.aa.intelligence_index != null &&
                `Intel ${model.aa.intelligence_index}`,
              model.aa.coding_index != null &&
                `Código ${model.aa.coding_index}`,
              model.aa.agentic_index != null &&
                `Agentes ${model.aa.agentic_index}`,
              model.aa.math_index != null && `Mat ${model.aa.math_index}`,
              model.aa.tps != null &&
                `${(Math.round(model.aa.tps * 10) / 10).toLocaleString("pt-PT")} tok/s`,
            ]
              .filter((x): x is string => Boolean(x))
              .join(" · ")}
          </p>
        )}
      {model.extras && Object.keys(model.extras).length > 0 && (
        <p className="mt-1 text-[11px] text-zinc-600">
          {Object.entries(model.extras)
            .map(([k, v]) => `${EXTRA_LABELS[k] ?? k} ${(v * 100).toFixed(1)}%`)
            .join(" · ")}
        </p>
      )}

      {model.descricao ? (
        <div className="mt-3">
          <p
            className={`text-sm leading-relaxed text-zinc-600 transition-all ${
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
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 transition hover:text-indigo-600"
            >
              {expandida ? "Mostrar menos" : "Mostrar mais"}
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform duration-300 ${expandida ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-600">Sem descrição no catálogo.</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div className="card-hover rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
          <dt className="text-[10px] font-bold tracking-wider text-stone-500 uppercase">
            Entrada / Saída
          </dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-zinc-900">
            {formatPrice(model.precoEntrada)} / {formatPrice(model.precoSaida)}
          </dd>
          <dd className="text-[11px] text-stone-500">por 1M tokens</dd>
        </div>
        <div className="card-hover rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
          <dt className="text-[10px] font-bold tracking-wider text-stone-500 uppercase">
            Contexto
          </dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-zinc-900">
            {formatContext(model.contexto)}
          </dd>
          <dd className="text-[11px] text-stone-500">tokens</dd>
        </div>
        <div className="card-hover rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
          <dt className="text-[10px] font-bold tracking-wider text-stone-500 uppercase">
            Modalidades
          </dt>
          <dd className="mt-1.5 flex flex-wrap gap-1">
            {Array.from(
              new Set([...model.modalidades.entrada, ...model.modalidades.saida]),
            ).map((mod) => (
              <span
                key={mod}
                title={modalityLabel(mod)}
                className="inline-flex items-center gap-1 rounded-md bg-stone-200/70 px-1.5 py-1 text-[11px] font-semibold text-stone-600"
              >
                <ModalityIcon modality={mod} />
                {modalityLabel(mod)}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {model.ferramentas && (
          <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-2 py-0.5 text-[11px] text-stone-500">
            <Wrench size={11} aria-hidden="true" /> Ferramentas
          </span>
        )}
        {model.saidaEstruturada && (
          <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-2 py-0.5 text-[11px] text-stone-500">
            <Check size={11} aria-hidden="true" /> Saída estruturada
          </span>
        )}
        {model.raciocinio && (
          <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-2 py-0.5 text-[11px] text-stone-500">
            <Check size={11} aria-hidden="true" /> Raciocínio
          </span>
        )}
        <a
          href={`https://openrouter.ai/${model.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 transition hover:text-indigo-600"
        >
          Ver no OpenRouter <ExternalLink size={11} aria-hidden="true" />
        </a>
        {model.hf && (
          <a
            href={`https://huggingface.co/${model.hf.hf}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Hugging Face: ${model.hf.hf}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 transition hover:text-amber-600"
          >
            HF ·{" "}
            {[
              model.hf.downloads != null &&
                `${formatCompact(model.hf.downloads)} downloads`,
              model.hf.likes != null && `${formatCompact(model.hf.likes)} likes`,
              prettyLicense(model.hf.license),
            ]
              .filter((x): x is string => Boolean(x))
              .join(" · ")}{" "}
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

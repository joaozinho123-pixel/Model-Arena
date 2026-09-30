"use client";

import { Crown, Minus, Swords } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { headline, placarConfronto } from "@/lib/comparar";
import { useCountUp } from "@/hooks/useCountUp";
import { ModelLogo } from "@/components/ModelLogo";

/**
 * Visão global: cartões de destaque com a métrica nativa principal
 * de cada modelo (índice AA ou Elo LMArena) — sem notas 0–10.
 * O anel cónico marca quem vence mais quesitos; 0×0 não é empate.
 */
interface ScoreCardsProps {
  modelA: AIModel;
  modelB: AIModel;
}

function ScoreCard({
  model,
  badge,
  placar,
}: {
  model: AIModel;
  badge: "A" | "B";
  placar: ReturnType<typeof placarConfronto>;
}) {
  const h = headline(model);
  const vitorias = badge === "A" ? placar.vitoriasA : placar.vitoriasB;
  const vitoriasOutro = badge === "A" ? placar.vitoriasB : placar.vitoriasA;
  const destaque = placar.vencedor != null && vitorias > vitoriasOutro;
  const empateReal = placar.vencedor == null && !placar.semDados;
  const corLado = badge === "A" ? "#0284c7" : "#7c3aed";

  // Conta até ao valor nativo quando numérico (índice AA ou Elo).
  const hNum = Number(h.valor);
  const hEhNum = h.valor !== "—" && Number.isFinite(hNum);
  const hContado = useCountUp(hEhNum ? hNum : 0, h.valor.includes(".") ? 1 : 0);

  return (
    <article
      aria-label={`${model.nomeCurto}, destaque ${h.valor} em ${h.rotulo}`}
      className={`glass-card relative flex-1 overflow-hidden p-5 ${
        destaque ? "winner-ring" : ""
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${model.cor}, ${corLado})`,
        }}
      />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex min-w-0 items-center gap-3">
          <ModelLogo
            nome={model.nomeCurto}
            dominio={model.dominioLogo}
            cor={model.cor}
            tamanho={44}
          />
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: corLado }}
            >
              Modelo {badge}
            </p>
            <h3 className="mt-0.5 truncate text-lg font-bold text-zinc-900">
              {model.nomeCurto}
            </h3>
            <p className="truncate text-xs text-zinc-500">
              {model.empresa} · {model.id}
            </p>
          </div>
        </div>
        {destaque ? (
          <span className="sweep inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <Crown
              size={14}
              aria-hidden="true"
              className="crown-float"
            />{" "}
            Vencedor
          </span>
        ) : empateReal ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">
            <Minus size={14} aria-hidden="true" /> Empate
          </span>
        ) : placar.semDados ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500">
            <Swords size={14} aria-hidden="true" /> Sem confronto
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-end gap-2">
        {hEhNum ? (
          <p className="count-in text-4xl font-extrabold tabular-nums text-zinc-900">
            {hContado.toLocaleString("pt-PT", {
              maximumFractionDigits: h.valor.includes(".") ? 1 : 0,
            })}
          </p>
        ) : (
          <p title="Sem métrica pública para este modelo">
            <span className="nodata">sem métrica pública</span>
          </p>
        )}
        <p className="pb-1 text-sm font-medium text-zinc-500">{h.rotulo}</p>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {vitorias} vitória(s) nos quesitos · Top {model.rank} do catálogo
      </p>
    </article>
  );
}

export function ScoreCards({ modelA, modelB }: ScoreCardsProps) {
  const placar = placarConfronto(modelA, modelB);
  return (
    <section aria-labelledby="visao-global" className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <h2 id="visao-global" className="sr-only">
        Destaques dos modelos selecionados
      </h2>
      <ScoreCard model={modelA} badge="A" placar={placar} />
      <ScoreCard model={modelB} badge="B" placar={placar} />
    </section>
  );
}

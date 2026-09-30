"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatContext, formatPrice } from "@/lib/format";
import { headline } from "@/lib/comparar";
import { ModelLogo } from "@/components/ModelLogo";

/**
 * Modal de escolha de modelo: pesquisa por nome/id/fornecedor
 * sobre todo o catálogo, com preço e contexto visíveis.
 */
interface ModelPickerProps {
  aberto: boolean;
  titulo: string;
  models: AIModel[];
  /** id usado no outro seletor (fica desabilitado); null = lado vazio. */
  excludeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ModelPicker({
  aberto,
  titulo,
  models,
  excludeId,
  onSelect,
  onClose,
}: ModelPickerProps) {
  const [pesquisa, setPesquisa] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático + fechar com Escape + travar scroll do fundo.
  useEffect(() => {
    if (!aberto) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto, onClose]);

  const resultados = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.nomeCurto.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.empresa.toLowerCase().includes(q),
    );
  }, [models, pesquisa]);

  if (!aberto) return null;

  /** Fecha e limpa a pesquisa para a próxima abertura. */
  const fechar = () => {
    setPesquisa("");
    onClose();
  };

  return (
    <div
      className="backdrop-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/45 p-4 pt-[8vh] backdrop-blur-sm"
      onClick={fechar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="modal-pop w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_24px_80px_rgba(28,25,23,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
          <Search size={18} aria-hidden="true" className="shrink-0 text-indigo-600" />
          <input
            ref={inputRef}
            type="search"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nome, id ou fornecedor…"
            aria-label="Pesquisar modelos"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar seleção"
            className="btn-ghost rounded-lg p-1.5"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <ul className="picker-list max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label={titulo}>
          {resultados.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-zinc-500">
              Nenhum modelo encontrado para “{pesquisa}”.
            </li>
          )}
          {resultados.map((m) => {
            const desabilitado = m.id === excludeId;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  aria-disabled={desabilitado}
                  disabled={desabilitado}
                  onClick={() => {
                    onSelect(m.id);
                    fechar();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ModelLogo
                    nome={m.nomeCurto}
                    dominio={m.dominioLogo}
                    cor={m.cor}
                    tamanho={32}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900">
                      {m.nomeCurto}
                      {headline(m).valor === "—" ? (
                        <span
                          title="Sem benchmark público"
                          className="ml-2 rounded-md border border-dashed border-stone-300 px-1.5 py-0.5 text-[11px] font-bold text-stone-400"
                        >
                          —
                        </span>
                      ) : (
                        <span
                          title={headline(m).rotulo}
                          className="ml-2 rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-stone-600"
                        >
                          {headline(m).valor}
                        </span>
                      )}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-zinc-500">
                      {m.id}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[11px] leading-tight text-zinc-500 sm:block">
                    {formatContext(m.contexto)} ctx
                    <br />
                    {formatPrice(m.precoEntrada)}/M
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="border-t border-stone-200 px-5 py-2.5 text-xs text-stone-500">
          {resultados.length} modelo(s) · o modelo do outro lado fica desabilitado
        </p>
      </div>
    </div>
  );
}

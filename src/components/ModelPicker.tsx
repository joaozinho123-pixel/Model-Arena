"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatContext, formatPrice } from "@/lib/format";
import { headline } from "@/lib/comparar";
import { ModelLogo } from "@/components/ModelLogo";
import { VarianteBadge } from "@/components/VarianteBadge";

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
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  // Foco automático + fechar com Escape + travar scroll do fundo.
  useEffect(() => {
    if (!aberto) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      setCursor(0);
    }, 60);
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

  /** Move o cursor e desliza a lista para manter o destino visível. */
  const mover = (destino: number) => {
    setCursor(destino);
    requestAnimationFrame(() => {
      listaRef.current
        ?.querySelector(`[data-idx="${destino}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  };

  /** Teclado no campo: ↑/↓ percorrem, Enter escolhe o destacado. */
  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (resultados.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      mover(Math.min(resultados.length - 1, cursor + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      mover(Math.max(0, cursor - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const escolhido = resultados[cursor];
      if (escolhido && escolhido.id !== excludeId) {
        onSelect(escolhido.id);
        setPesquisa("");
        onClose();
      }
    }
  };

  if (!aberto) return null;

  /** Fecha e limpa a pesquisa para a próxima abertura. */
  const fechar = () => {
    setPesquisa("");
    onClose();
  };

  return (
    <div
      className="overlay-fade fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/45 p-4 pt-[10vh]"
      onClick={fechar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="dialog-fade card w-full max-w-xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
          <input
            ref={inputRef}
            type="search"
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value);
              setCursor(0);
            }}
            onKeyDown={aoTeclar}
            placeholder="Pesquisar por nome, id ou fornecedor…"
            aria-label="Pesquisar modelos"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar seleção"
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <ul ref={listaRef} className="max-h-[52vh] overflow-y-auto p-1.5" role="listbox" aria-label={titulo}>
          {resultados.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-zinc-500">
              Nenhum modelo encontrado para “{pesquisa}”.
            </li>
          )}
          {resultados.map((m, i) => {
            const desabilitado = m.id === excludeId;
            const destacado = i === cursor;
            return (
              <li key={m.id} data-idx={i}>
                <button
                  type="button"
                  role="option"
                  aria-selected={destacado}
                  aria-disabled={desabilitado}
                  disabled={desabilitado}
                  onClick={() => {
                    onSelect(m.id);
                    fechar();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                    destacado ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <ModelLogo
                    nome={m.nomeCurto}
                    dominio={m.dominioLogo}
                    cor={m.cor}
                    tamanho={32}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900">
                      {m.nomeCurto}
                      <VarianteBadge variante={m.variante} />
                      {headline(m).valor !== "—" && (
                        <span
                          title={headline(m).rotulo}
                          className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-600"
                        >
                          {headline(m).valor}
                        </span>
                      )}
                    </span>
                    <span
                      title={`ID: ${m.id} · ${m.descricao}`}
                      className="block truncate text-[11px] leading-tight text-zinc-500"
                    >
                      {m.descricao || m.id}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[11px] leading-tight text-zinc-500 sm:block tabular-nums">
                    {formatContext(m.contexto)} ctx
                    <br />
                    {formatPrice(m.precoEntrada)}/M
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-400">
          {resultados.length} modelo(s) · ↑/↓ percorrem, Enter escolhe · Esc
          fecha · o modelo do outro lado fica desabilitado
        </p>
      </div>
    </div>
  );
}

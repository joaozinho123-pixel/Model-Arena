"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Library, Search } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { buildProviderOptions } from "@/data/models";
import { formatContext, formatPrice } from "@/lib/format";
import { headline } from "@/lib/comparar";
import { ModelLogo } from "@/components/ModelLogo";

const PAGE = 96;

/**
 * Catálogo completo: pesquisa, filtro por fornecedor e cartões
 * com logótipo e informações básicas; botões A/B enviam
 * o modelo para a comparação.
 */
interface CatalogSectionProps {
  models: AIModel[];
  totalSnapshot: string;
  onAssign: (slot: "A" | "B", id: string) => void;
}

export function CatalogSection({ models, totalSnapshot, onAssign }: CatalogSectionProps) {
  const [pesquisa, setPesquisa] = useState("");
  const [provider, setProvider] = useState("todos");
  const [visiveis, setVisiveis] = useState(PAGE);

  const filtrados = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    return models.filter((m) => {
      if (provider !== "todos" && m.provider !== provider) return false;
      if (!q) return true;
      return (
        m.nomeCurto.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.empresa.toLowerCase().includes(q)
      );
    });
  }, [models, pesquisa, provider]);

  const lista = filtrados.slice(0, visiveis);

  const opcoesFornecedor = useMemo(() => buildProviderOptions(models), [models]);

  return (
    <section id="catalogo" aria-labelledby="catalogo" className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="catalogo" className="flex items-center gap-2 text-xl font-extrabold text-zinc-900">
            <Library size={20} aria-hidden="true" className="text-indigo-600" />
            Catálogo de modelos
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {models.length} modelos base em {opcoesFornecedor.length} fornecedores
            (snapshot OpenRouter
            {totalSnapshot ? ` de ${totalSnapshot}` : ""}).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="input-focus flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm">
          <Search size={16} aria-hidden="true" className="shrink-0 text-stone-400" />
          <input
            type="search"
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value);
              setVisiveis(PAGE);
            }}
            placeholder="Pesquisar modelos…"
            aria-label="Pesquisar no catálogo"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-stone-400"
          />
        </label>
        <label className="input-focus flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm">
          <ArrowDownWideNarrow size={16} aria-hidden="true" className="shrink-0 text-stone-400" />
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setVisiveis(PAGE);
            }}
            aria-label="Filtrar por fornecedor"
            className="cursor-pointer bg-transparent text-sm font-medium text-zinc-800 outline-none [&>option]:bg-white"
          >
            <option value="todos">Todos os fornecedores</option>
            {opcoesFornecedor.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.nome} ({p.count})
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="text-xs text-stone-500">
        {filtrados.length} resultado(s) · selos teal/céu/rosa = 100% reais, âmbar =
        parcial, cinzento = sem dados
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((m, i) => (
          <li
            key={m.id}
            style={{ animationDelay: `${Math.min(i, 15) * 45}ms` }}
            className="card-enter card-hover flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <ModelLogo
                nome={m.nomeCurto}
                dominio={m.dominioLogo}
                cor={m.cor}
                tamanho={36}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-900">
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
                      className={`ml-2 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                        m.fonte === "aa" ||
                        m.fonte === "openrouter" ||
                        m.fonte === "arena"
                          ? "bg-emerald-700/10 text-emerald-700"
                          : m.fonte === "mista"
                            ? "bg-amber-600/10 text-amber-700"
                            : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {headline(m).valor}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  por {m.empresa} · Top {m.rank}
                </p>
              </div>
            </div>

            <dl className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
              <div>
                <dt className="text-stone-500">Contexto</dt>
                <dd className="font-bold tabular-nums text-zinc-800">
                  {formatContext(m.contexto)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-stone-500">Entrada / Saída /M</dt>
                <dd className="font-bold tabular-nums text-zinc-800">
                  {formatPrice(m.precoEntrada)} / {formatPrice(m.precoSaida)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onAssign("A", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo A`}
                className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-700 active:scale-95"
              >
                Usar em A
              </button>
              <button
                type="button"
                onClick={() => onAssign("B", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo B`}
                className="flex-1 rounded-lg border border-stone-300 py-1.5 text-xs font-bold text-stone-500 transition hover:border-zinc-900 hover:text-zinc-900 active:scale-95"
              >
                Usar em B
              </button>
            </div>
          </li>
        ))}
      </ul>

      {filtrados.length === 0 && (
        <p className="glass-card py-10 text-center text-sm text-zinc-500">
          Nenhum modelo corresponde aos filtros.
        </p>
      )}

      {visiveis < filtrados.length && (
        <button
          type="button"
          onClick={() => setVisiveis((v) => v + PAGE)}
          className="btn-primary self-center rounded-xl px-6 py-2.5 text-sm"
        >
          Mostrar mais ({filtrados.length - visiveis} restantes)
        </button>
      )}
    </section>
  );
}

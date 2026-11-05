"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { buildProviderOptions } from "@/data/models";
import { formatContext, formatPrice } from "@/lib/format";
import { headline } from "@/lib/comparar";
import { ModelLogo } from "@/components/ModelLogo";

const PAGE = 96;

/**
 * Catálogo completo: pesquisa, filtro por fornecedor e cartões
 * com logótipo e dados essenciais; botões A/B enviam o modelo
 * para a comparação.
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
  const filtrando = pesquisa.trim() !== "" || provider !== "todos";

  return (
    <section id="catalogo" aria-labelledby="catalogo" className="flex scroll-mt-24 flex-col gap-4">
      <h2 id="catalogo" className="sr-only">
        Catálogo de modelos
      </h2>

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {models.length} modelos base em {opcoesFornecedor.length} fornecedores
          {totalSnapshot ? ` · snapshot de ${totalSnapshot}` : ""}
        </p>
        {filtrando && (
          <p role="status" className="text-xs text-zinc-500">
            {filtrados.length} resultado(s)
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="input flex-1 px-3.5 py-2.5">
          <Search size={16} aria-hidden="true" className="shrink-0 text-zinc-400" />
          <input
            type="search"
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value);
              setVisiveis(PAGE);
            }}
            placeholder="Pesquisar modelos…"
            aria-label="Pesquisar no catálogo"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>
        <label className="input px-3.5 py-2.5">
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setVisiveis(PAGE);
            }}
            aria-label="Filtrar por fornecedor"
            className="cursor-pointer bg-transparent text-sm text-zinc-800 outline-none [&>option]:bg-white"
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

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((m) => (
          <li key={m.id} className="card card-hover flex flex-col p-4">
            <div className="flex items-center gap-3">
              <ModelLogo
                nome={m.nomeCurto}
                dominio={m.dominioLogo}
                cor={m.cor}
                tamanho={36}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-zinc-900">
                  {m.nomeCurto}
                  {headline(m).valor !== "—" && (
                    <span
                      title={headline(m).rotulo}
                      className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-600"
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

            <dl className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
              <div>
                <dt className="text-zinc-400">Contexto</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-zinc-800">
                  {formatContext(m.contexto)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-zinc-400">Entrada / Saída /1M</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-zinc-800">
                  {formatPrice(m.precoEntrada)} / {formatPrice(m.precoSaida)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onAssign("A", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo A`}
                className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
              >
                Usar em A
              </button>
              <button
                type="button"
                onClick={() => onAssign("B", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo B`}
                className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs font-semibold text-zinc-500 transition hover:border-zinc-900 hover:text-zinc-900"
              >
                Usar em B
              </button>
            </div>
          </li>
        ))}
      </ul>

      {filtrados.length === 0 && (
        <p className="card px-6 py-10 text-center text-sm text-zinc-500">
          Nenhum modelo corresponde aos filtros.
        </p>
      )}

      {visiveis < filtrados.length && (
        <button
          type="button"
          onClick={() => setVisiveis((v) => v + PAGE)}
          className="btn-ghost self-center px-5 py-2.5 text-sm"
        >
          Mostrar mais ({filtrados.length - visiveis} restantes)
        </button>
      )}
    </section>
  );
}

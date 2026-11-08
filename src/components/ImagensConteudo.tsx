"use client";

/**
 * Catálogo de modelos de imagem (AA media V2): pesquisa, filtro por
 * capacidade (geração/edição/ambas) e cartões com Elo real, intervalo
 * de confiança e posição no ranking. Dados estáticos da captura —
 * nunca valores inventados.
 */
import { useMemo, useState } from "react";
import { Image as ImageIcon, ImagePlus, Search, Wrench } from "lucide-react";
import type { ModeloImagem } from "@/types/ai-model";
import { ModelLogo } from "@/components/ModelLogo";
import { EmptyState } from "@/components/EmptyState";
import DESC_DATA from "@/data/descricoes-media.json";

const DESC = DESC_DATA as Record<string, { descricao?: string }>;

const PAGE = 60;

type Filtro = "todas" | "t2i" | "iee" | "ambas";

const FILTROS: { id: Filtro; rotulo: string; icone: typeof ImageIcon }[] = [
  { id: "todas", rotulo: "Todas", icone: ImageIcon },
  { id: "t2i", rotulo: "Geração", icone: ImageIcon },
  { id: "iee", rotulo: "Edição", icone: ImagePlus },
  { id: "ambas", rotulo: "Geração + edição", icone: Wrench },
];

/** Chip de Elo com posição no ranking daquela arena. */
function EloChip({
  rotulo,
  elo,
  ci,
  rank,
}: {
  rotulo: string;
  elo: number;
  ci: number | null;
  rank: number | null;
}) {
  return (
    <span
      title={`${rotulo} · Elo ${elo.toLocaleString("pt-PT")}${ci != null ? ` ±${ci}` : ""}${
        rank != null ? ` · posição ${rank} no ranking` : ""
      } (Artificial Analysis)`}
      className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-[11px] tabular-nums text-zinc-700"
    >
      <span className="text-zinc-400">{rotulo}</span>
      <span className="font-semibold text-zinc-900">
        {elo.toLocaleString("pt-PT")}
      </span>
      {ci != null && <span className="text-zinc-400">±{ci}</span>}
      {rank != null && <span className="text-zinc-400">· #{rank}</span>}
    </span>
  );
}

/** Cartão de um modelo de imagem. */
function CartaoImagem({ m }: { m: ModeloImagem }) {
  const descricao = DESC[m.id]?.descricao ?? "";
  return (
    <article className="card card-hover flex flex-col p-4">
      <div className="flex items-center gap-3">
        <ModelLogo
          nome={m.nome}
          dominio={m.logo}
          cor={m.cor}
          tamanho={36}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900" title={m.nome}>
            {m.nome}
          </p>
          <p className="truncate text-xs text-zinc-500">por {m.criador}</p>
        </div>
      </div>

      {descricao && (
        <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500" title={descricao}>
          {descricao}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-3">
        {m.eloT2i != null && (
          <EloChip rotulo="geração" elo={m.eloT2i} ci={m.ciT2i} rank={m.rankT2i} />
        )}
        {m.eloIee != null && (
          <EloChip rotulo="edição" elo={m.eloIee} ci={m.ciIee} rank={m.rankIee} />
        )}
      </div>
    </article>
  );
}

export function ImagensConteudo({
  modelos,
  geradoEm,
}: {
  modelos: ModeloImagem[];
  /** ISO da captura AA. */
  geradoEm: string;
}) {
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [visiveis, setVisiveis] = useState(PAGE);

  const filtrados = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    return modelos.filter((m) => {
      if (filtro === "t2i" && m.eloT2i == null) return false;
      if (filtro === "iee" && m.eloIee == null) return false;
      if (filtro === "ambas" && (m.eloT2i == null || m.eloIee == null)) return false;
      if (!q) return true;
      return (
        m.nome.toLowerCase().includes(q) ||
        m.criador.toLowerCase().includes(q)
      );
    });
  }, [modelos, pesquisa, filtro]);

  const lista = filtrados.slice(0, visiveis);
  const contagens = useMemo(
    () => ({
      todas: modelos.length,
      t2i: modelos.filter((m) => m.eloT2i != null).length,
      iee: modelos.filter((m) => m.eloIee != null).length,
      ambas: modelos.filter((m) => m.eloT2i != null && m.eloIee != null).length,
    }),
    [modelos],
  );

  const data = geradoEm ? new Date(geradoEm).toLocaleDateString("pt-PT") : "";

  return (
    <section aria-labelledby="imagens-titulo" className="flex flex-col gap-4">
      <h2 id="imagens-titulo" className="sr-only">
        Modelos de imagem medidos pela Artificial Analysis
      </h2>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {modelos.length} modelos de imagem de{" "}
          {new Set(modelos.map((m) => m.criador)).size} criadores
          {data ? ` · dados de ${data}` : ""}
        </p>
        {filtrados.length !== modelos.length && (
          <p role="status" className="text-xs text-zinc-500">
            {filtrados.length} resultado(s)
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="input flex-1 px-3.5 py-2.5">
          <Search size={16} aria-hidden="true" className="shrink-0 text-zinc-400" />
          <input
            type="search"
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value);
              setVisiveis(PAGE);
            }}
            placeholder="Pesquisar por modelo ou criador…"
            aria-label="Pesquisar modelos de imagem"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>
        <div
          role="group"
          aria-label="Filtrar por capacidade"
          className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1"
        >
          {FILTROS.map((f) => {
            const n =
              f.id === "todas"
                ? contagens.todas
                : f.id === "t2i"
                  ? contagens.t2i
                  : f.id === "iee"
                    ? contagens.iee
                    : contagens.ambas;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                onClick={() => {
                  setFiltro(f.id);
                  setVisiveis(PAGE);
                }}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium tabular-nums transition ${
                  filtro === f.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {f.rotulo} · {n}
              </button>
            );
          })}
        </div>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icone={Search}
          titulo="Nada por aqui"
          dica="Nenhum modelo de imagem corresponde aos filtros. Tente outro criador ou volte a todas as capacidades."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((m) => (
            <li key={m.id}>
              <CartaoImagem m={m} />
            </li>
          ))}
        </ul>
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

      <p className="text-center text-xs text-zinc-400">
        Métricas por Artificial Analysis (media V2) · Elo com intervalo
        de confiança de 95% · rankings próprios de geração e de edição —
        não comparáveis entre si.
      </p>
    </section>
  );
}

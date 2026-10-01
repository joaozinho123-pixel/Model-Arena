"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  MessageSquare,
  Newspaper,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  buscarNoticias,
  tempoAtras,
  type FonteNoticia,
  type Noticia,
} from "@/lib/noticias";

type Filtro = "todas" | FonteNoticia;

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "Hacker News", rotulo: "Hacker News" },
  { id: "Dev.to", rotulo: "Dev.to" },
];

/** Domínio legível de um URL (fallback silencioso). */
function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function CartaoNoticia({ noticia }: { noticia: Noticia }) {
  return (
    <article className="glass-card card-hover flex flex-col p-5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/[0.06] px-2.5 py-0.5 font-extrabold tracking-wide text-zinc-700 uppercase"
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-900"
          />
          {noticia.fonte}
        </span>
        <span className="shrink-0 font-semibold text-stone-400">
          {tempoAtras(noticia.publicadoEm)}
        </span>
      </div>

      <h2 className="mt-3 text-[15px] leading-snug font-bold text-zinc-900">
        <a
          href={noticia.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-indigo-700 hover:underline hover:decoration-indigo-300 hover:underline-offset-4"
        >
          {noticia.titulo}
        </a>
      </h2>

      {noticia.descricao && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-stone-500">
          {noticia.descricao}
        </p>
      )}

      <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs font-semibold text-stone-500">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <TrendingUp size={13} aria-hidden="true" className="text-stone-400" />
          {noticia.pontos}
          <span className="font-normal">pontos</span>
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <MessageSquare size={13} aria-hidden="true" className="text-stone-400" />
          {noticia.comentarios}
        </span>
        {noticia.autor && (
          <span className="max-w-32 truncate font-normal">
            por {noticia.autor}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 font-bold text-indigo-600">
          {dominio(noticia.url)}
          <ExternalLink size={12} aria-hidden="true" />
        </span>
      </p>
    </article>
  );
}

function Esqueleto() {
  return (
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="glass-card flex flex-col gap-3 p-5">
          <div className="skeleton-shimmer h-5 w-24 rounded-full" />
          <div className="skeleton-shimmer h-5 rounded-lg" />
          <div className="skeleton-shimmer h-5 w-4/5 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-2/3 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Conteúdo do Radar IA: busca, filtros e grelha de notícias. */
export function NoticiasConteudo() {
  const [noticias, setNoticias] = useState<Noticia[] | null>(null);
  const [aoVivo, setAoVivo] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [pesquisa, setPesquisa] = useState("");

  useEffect(() => {
    let vivo = true;
    buscarNoticias().then((r) => {
      if (!vivo) return;
      setNoticias(r.noticias);
      setAoVivo(r.aoVivo);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const contagens = useMemo(() => {
    const hn = (noticias ?? []).filter((n) => n.fonte === "Hacker News").length;
    const dev = (noticias ?? []).filter((n) => n.fonte === "Dev.to").length;
    return { todas: (noticias ?? []).length, hn, dev };
  }, [noticias]);

  const lista = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    return (noticias ?? []).filter((n) => {
      if (filtro !== "todas" && n.fonte !== filtro) return false;
      if (!q) return true;
      return (
        n.titulo.toLowerCase().includes(q) ||
        (n.descricao ?? "").toLowerCase().includes(q)
      );
    });
  }, [noticias, filtro, pesquisa]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="input-focus flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm">
          <Search size={16} aria-hidden="true" className="shrink-0 text-stone-400" />
          <input
            type="search"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar notícias…"
            aria-label="Pesquisar notícias"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-stone-400"
          />
        </label>
        <div
          role="tablist"
          aria-label="Fonte das notícias"
          className="flex gap-1 self-start rounded-xl border border-stone-200 bg-stone-100 p-1 sm:self-auto"
        >
          {FILTROS.map((f) => {
            const n =
              f.id === "todas" ? contagens.todas : f.id === "Hacker News" ? contagens.hn : contagens.dev;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold tabular-nums transition ${
                  filtro === f.id
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-stone-500 hover:text-zinc-900"
                }`}
              >
                {f.rotulo} · {n}
              </button>
            );
          })}
        </div>
      </div>

      {!aoVivo && noticias !== null && (
        <p
          role="status"
          className="rounded-xl border border-amber-600/30 bg-amber-600/5 px-4 py-3 text-sm text-amber-800"
        >
          As APIs de notícias não responderam — a mostrar ligações de
          referência das fontes oficiais.
        </p>
      )}

      {noticias === null ? (
        <Esqueleto />
      ) : lista.length === 0 ? (
        <p className="glass-card py-10 text-center text-sm text-stone-500">
          Nenhuma notícia corresponde à pesquisa.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((n, i) => (
            <div
              key={n.id}
              style={{ animationDelay: `${Math.min(i, 11) * 50}ms` }}
              className="card-enter"
            >
              <CartaoNoticia noticia={n} />
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-stone-400">
        <Newspaper size={13} aria-hidden="true" />
        Fontes: Hacker News (Algolia) · Dev.to · abre em nova aba
      </p>
    </div>
  );
}

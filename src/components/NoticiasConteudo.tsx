"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
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
    <article className="card card-hover flex flex-col p-4">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium uppercase tracking-wide text-zinc-500">
          {noticia.fonte}
        </span>
        <span className="text-zinc-400">{tempoAtras(noticia.publicadoEm)}</span>
      </div>

      <h3 className="mt-2 text-sm font-medium leading-snug text-zinc-900">
        <a
          href={noticia.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 transition hover:underline hover:decoration-zinc-400"
        >
          {noticia.titulo}
        </a>
      </h3>

      {noticia.descricao && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
          {noticia.descricao}
        </p>
      )}

      <p className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] text-zinc-400">
        <span className="tabular-nums">
          {noticia.pontos} pontos
          {noticia.comentarios > 0 && ` · ${noticia.comentarios} comentários`}
        </span>
        <span className="truncate">{dominio(noticia.url)}</span>
      </p>
    </article>
  );
}

function Esqueleto() {
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card flex flex-col gap-2.5 p-4">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-3.5 w-2/3" />
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
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="input flex-1 px-3.5 py-2.5">
          <Search size={16} aria-hidden="true" className="shrink-0 text-zinc-400" />
          <input
            type="search"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar notícias…"
            aria-label="Pesquisar notícias"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>
        <div
          role="tablist"
          aria-label="Fonte das notícias"
          className="flex gap-1 self-start rounded-lg border border-zinc-200 bg-white p-1 sm:self-auto"
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
                className={`rounded-md px-3 py-1.5 text-xs font-medium tabular-nums transition ${
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

      {!aoVivo && noticias !== null && (
        <p
          role="status"
          className="rounded-lg border border-amber-600/30 bg-amber-600/5 px-4 py-3 text-sm text-amber-800"
        >
          As APIs de notícias não responderam — a mostrar ligações de
          referência das fontes oficiais.
        </p>
      )}

      {noticias === null ? (
        <Esqueleto />
      ) : lista.length === 0 ? (
        <p className="card px-6 py-10 text-center text-sm text-zinc-500">
          Nenhuma notícia corresponde à pesquisa.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((n) => (
            <CartaoNoticia key={n.id} noticia={n} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-zinc-400">
        Fontes: Hacker News (Algolia) · Dev.to · abre em nova aba
      </p>
    </div>
  );
}

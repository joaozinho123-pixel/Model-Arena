"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCw, Search } from "lucide-react";
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

type Ordem = "recentes" | "discutidas";

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "recentes", rotulo: "Recentes" },
  { id: "discutidas", rotulo: "Mais discutidas" },
];

/** Domínio legível de um URL (fallback silencioso). */
function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Números curtos em pt-PT (1.234 pontos). */
function numero(n: number): string {
  return n.toLocaleString("pt-PT");
}

/** Rótulo curto do dia de uma notícia ("Hoje", "Ontem", "12 nov"). */
function rotuloDia(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const agora = new Date();
  const umDia = 24 * 60 * 60 * 1000;
  const inicioHoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
  ).getTime();
  if (t >= inicioHoje) return "Hoje";
  if (t >= inicioHoje - umDia) return "Ontem";
  return new Date(iso)
    .toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
    .replace(".", "");
}

interface GrupoDia {
  chave: string;
  rotulo: string;
  itens: Noticia[];
}

/** Agrupa notícias por dia, mantendo a ordem cronológica recebida. */
function agruparDia(noticias: Noticia[]): GrupoDia[] {
  const grupos: GrupoDia[] = [];
  for (const n of noticias) {
    const rotulo = rotuloDia(n.publicadoEm);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.rotulo === rotulo) {
      ultimo.itens.push(n);
    } else {
      grupos.push({ chave: rotulo || "sem-data", rotulo, itens: [n] });
    }
  }
  return grupos;
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
          {numero(noticia.pontos)} pontos
          {noticia.comentarios > 0 &&
            ` · ${numero(noticia.comentarios)} comentários`}
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

/** Conteúdo do Radar IA: busca, filtros, ordenação e grelha de notícias. */
export function NoticiasConteudo() {
  const [noticias, setNoticias] = useState<Noticia[] | null>(null);
  const [aoVivo, setAoVivo] = useState(false);
  const [aAtualizar, setAAtualizar] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [pesquisa, setPesquisa] = useState("");
  /** Ref controls mounted state (avoids setState after unmount). */
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    // Fetch pós-load; setState apenas em callbacks assíncronos.
    buscarNoticias().then((r) => {
      if (!vivo) return;
      setNoticias(r.noticias);
      setAoVivo(r.aoVivo);
    });
    return () => {
      vivo = false;
    };
  }, []);

  /** Refetch manual (botão Atualizar), com checagem de desmontagem. */
  const atualizar = () => {
    if (aAtualizar) return;
    setAAtualizar(true);
    buscarNoticias()
      .then((r) => {
        if (!montadoRef.current) return;
        setNoticias(r.noticias);
        setAoVivo(r.aoVivo);
      })
      .finally(() => {
        if (montadoRef.current) setAAtualizar(false);
      });
  };

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

  const grupos = useMemo((): GrupoDia[] => {
    if (ordem === "discutidas") {
      const ordenada = [...lista].sort(
        (a, b) => b.pontos - a.pontos || b.comentarios - a.comentarios,
      );
      return [{ chave: "top", rotulo: "Mais discutidas", itens: ordenada }];
    }
    return agruparDia(lista);
  }, [lista, ordem]);

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
        <button
          type="button"
          onClick={atualizar}
          disabled={aAtualizar || noticias === null}
          className="btn-ghost shrink-0 px-3.5 py-2.5 text-sm disabled:cursor-wait disabled:opacity-60"
        >
          <RotateCw
            size={15}
            aria-hidden="true"
            className={aAtualizar ? "animate-spin" : ""}
          />
          {aAtualizar ? "A atualizar…" : "Atualizar"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Fonte das notícias"
          className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1"
        >
          {FILTROS.map((f) => {
            const n =
              f.id === "todas"
                ? contagens.todas
                : f.id === "Hacker News"
                  ? contagens.hn
                  : contagens.dev;
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

        <div
          role="group"
          aria-label="Ordenação das notícias"
          className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1"
        >
          {ORDENS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={ordem === o.id}
              onClick={() => setOrdem(o.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                ordem === o.id
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {o.rotulo}
            </button>
          ))}
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
      ) : grupos.length === 0 ? (
        <p className="card px-6 py-10 text-center text-sm text-zinc-500">
          Nenhuma notícia corresponde à pesquisa.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {grupos.map((g) => (
            <section
              key={g.chave}
              aria-label={g.rotulo}
              className="flex flex-col gap-3"
            >
              <h2 className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {g.rotulo}
                <span className="tabular-nums text-zinc-300">
                  {g.itens.length}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-zinc-200" />
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {g.itens.map((n) => (
                  <CartaoNoticia key={n.id} noticia={n} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-zinc-400">
        Fontes: Hacker News (Algolia) · Dev.to · abre em nova aba
      </p>
    </div>
  );
}

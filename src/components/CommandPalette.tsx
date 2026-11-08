"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CornerDownLeft,
  Newspaper,
  Search,
  Swords,
  Table2,
  X,
} from "lucide-react";
import { AI_MODELS } from "@/data/models";
import { formatContext, formatPrice } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";

/** Nome do evento global que abre a pesquisa (botão do nav reutiliza). */
export const EV_ABRIR_PESQUISA = "model-arena:abrir-pesquisa";

/** Páginas rápidas, sempre no topo dos resultados. */
const PAGINAS = [
  {
    href: "/",
    rotulo: "Duelo",
    dica: "Comparar dois modelos lado a lado",
    icone: Swords,
  },
  {
    href: "/rankings",
    rotulo: "Rankings",
    dica: "Inteligência · preço · contexto · velocidade",
    icone: BarChart3,
  },
  {
    href: "/catalogo",
    rotulo: "Catálogo",
    dica: "Todos os modelos, com pesquisa e filtros",
    icone: Table2,
  },
  {
    href: "/noticias",
    rotulo: "Radar IA",
    dica: "Notícias ao vivo · Hacker News · Dev.to",
    icone: Newspaper,
  },
] as const;

/** Navegador global (Ctrl+K): páginas rápidas + fichas de modelos. */
export function CommandPalette() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  // Ctrl+K / Cmd+K em todo o site + evento do botão do nav.
  useEffect(() => {
    const abrir = () => {
      setAberto(true);
      setPesquisa("");
      setCursor(0);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        abrir();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(EV_ABRIR_PESQUISA, abrir);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(EV_ABRIR_PESQUISA, abrir);
    };
  }, []);

  const fechar = () => {
    setAberto(false);
    setPesquisa("");
  };

  // Foco automático + travar scroll + fechar com Escape (janela inteira).
  // O cursor é reiniciado em `abrir` (Ctrl+K/botão), nunca de forma
  // síncrona no corpo do efeito.
  useEffect(() => {
    if (!aberto) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  const q = pesquisa.trim().toLowerCase();

  const paginasLista = useMemo(() => {
    if (!q) return [...PAGINAS];
    return [...PAGINAS].filter(
      (p) => p.rotulo.toLowerCase().includes(q) || p.dica.toLowerCase().includes(q),
    );
  }, [q]);

  const modelosLista = useMemo(() => {
    if (!q) return AI_MODELS.slice(0, 8);
    return AI_MODELS.filter(
      (m) =>
        m.nomeCurto.toLowerCase().includes(q) ||
        m.empresa.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [q]);

  const total = paginasLista.length + modelosLista.length;

  const ir = (href: string) => {
    router.push(href);
    setAberto(false);
    setPesquisa("");
  };

  /** Teclado: ↑/↓ percorrem a lista unificada; Enter abre o alvo. */
  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total === 0) return;
      const destino = Math.min(total - 1, cursor + 1);
      setCursor(destino);
      requestAnimationFrame(() => {
        listaRef.current
          ?.querySelector(`[data-idx="${destino}"]`)
          ?.scrollIntoView({ block: "nearest" });
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const destino = Math.max(0, cursor - 1);
      setCursor(destino);
      requestAnimationFrame(() => {
        listaRef.current
          ?.querySelector(`[data-idx="${destino}"]`)
          ?.scrollIntoView({ block: "nearest" });
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (cursor < paginasLista.length) {
        const p = paginasLista[cursor];
        if (p) ir(p.href);
      } else {
        const m = modelosLista[cursor - paginasLista.length];
        if (m) ir(`/modelo/${m.id}`);
      }
    }
  };

  if (!aberto) return null;

  return (
    <div
      className="overlay-fade fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/45 p-4 pt-[8vh]"
      role="presentation"
      onClick={() => setAberto(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisa rápida"
        className="dialog-fade card w-full max-w-xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
          <div className="input w-full px-3 py-2">
            <Search size={16} aria-hidden="true" className="shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              type="search"
              value={pesquisa}
              onChange={(e) => {
                setPesquisa(e.target.value);
                setCursor(0);
              }}
              onKeyDown={aoTeclar}
              placeholder="Pesquisar páginas e modelos — ex.: Claude, GPT, DeepSeek…"
              aria-label="Pesquisar páginas e modelos"
              className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar pesquisa"
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <ul ref={listaRef} className="max-h-[54vh] overflow-y-auto p-1.5" aria-label="Resultados">
          {total === 0 && (
            <li className="px-4 py-10 text-center text-sm text-zinc-500">
              Nada encontrado para “{pesquisa}”.
            </li>
          )}

          {paginasLista.length > 0 && (
            <li aria-hidden="true" className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Páginas
            </li>
          )}
          {[...paginasLista.entries()].map(([i, p]) => {
            const Icon = p.icone;
            const destacado = cursor === i;
            return (
              <li key={p.href} data-idx={i}>
                <button
                  type="button"
                  role="option"
                  aria-selected={destacado}
                  onClick={() => ir(p.href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    destacado ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-900">
                      {p.rotulo}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">
                      {p.dica}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}

          {modelosLista.length > 0 && (
            <li aria-hidden="true" className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Modelos do catálogo
            </li>
          )}
          {[...modelosLista.entries()].map(([j, m]) => {
            const i = paginasLista.length + j;
            const destacado = cursor === i;
            return (
              <li key={m.id} data-idx={i}>
                <button
                  type="button"
                  role="option"
                  aria-selected={destacado}
                  onClick={() => ir(`/modelo/${m.id}`)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
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
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">
                      {m.empresa} · {m.id}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[11px] leading-tight text-zinc-500 tabular-nums sm:block">
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
          <span className="kbd">↑</span> <span className="kbd">↓</span> navegam ·{" "}
          <span className="kbd">
            <CornerDownLeft size={10} aria-hidden="true" />
          </span>{" "}
          abre · <span className="kbd">Esc</span> fecha
        </p>
      </div>
    </div>
  );
}

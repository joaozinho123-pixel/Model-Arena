"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  CalendarRange,
  Clock,
  ExternalLink,
  Flame,
  Hash,
  LayoutList,
  LayoutGrid,
  Link2,
  MessageSquare,
  RotateCw,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  buscarNoticias,
  tempoAtras,
  type CategoriaNoticia,
  type FonteNoticia,
  type Noticia,
} from "@/lib/noticias";
import { AI_MODELS } from "@/data/models";
import { EmptyState } from "@/components/EmptyState";

/** Chave das notícias guardadas (localStorage). */
const LS_GUARDADAS = "model-arena-guardadas-v1";

/** Auto-refresh silencioso a cada 5 minutos. */
const AUTO_MS = 5 * 60 * 1000;

/** Cor-identidade de cada fonte (só no ponto, não em fundos). */
const COR_FONTE: Record<FonteNoticia, string> = {
  "Hacker News": "#ea580c",
  "Dev.to": "#7c3aed",
};

const FILTROS: { id: "todas" | FonteNoticia; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "Hacker News", rotulo: "Hacker News" },
  { id: "Dev.to", rotulo: "Dev.to" },
];

const CATEGORIAS: CategoriaNoticia[] = [
  "Modelos",
  "Benchmarks",
  "Open-source",
  "Ferramentas",
  "Indústria",
];

const PERIODOS: { id: Periodo; rotulo: string }[] = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "7d", rotulo: "7 dias" },
  { id: "30d", rotulo: "30 dias" },
  { id: "tudo", rotulo: "Tudo" },
];

type Periodo = "hoje" | "7d" | "30d" | "tudo";
type Ordem = "recentes" | "discutidas" | "relevancia";
type Vista = "cartoes" | "lista";

const ORDENS: { id: Ordem; rotulo: string; icone: typeof Clock }[] = [
  { id: "recentes", rotulo: "Recentes", icone: Clock },
  { id: "discutidas", rotulo: "Mais discutidas", icone: Flame },
  { id: "relevancia", rotulo: "Relevância", icone: Sparkles },
];

const VISTAS: { id: Vista; rotulo: string; icone: typeof LayoutGrid }[] = [
  { id: "cartoes", rotulo: "Cartões", icone: LayoutGrid },
  { id: "lista", rotulo: "Lista", icone: LayoutList },
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

/** Idade em horas (para o período e a relevância). */
function idadeHoras(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - t) / 3_600_000);
}

/** Relevância: pontos com decaimento suave de 48 h (nunca negativa). */
function relevancia(n: Noticia): number {
  const h = idadeHoras(n.publicadoEm);
  const peso = Math.exp(-h / 48);
  const social = 1 + n.pontos * 0.35 + n.comentarios * 0.5;
  return Number.isFinite(peso) ? social * peso : social;
}

interface GrupoDia {
  chave: string;
  rotulo: string;
  itens: Noticia[];
}

/** Agrupa notícias por dia, mantendo a ordem recebida. */
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

/**
 * Modelos mencionados: casa o nome curto (≥ 4 letras) de um modelo
 * do catálogo no título/descrição e liga à ficha. Só correspondência
 * exata de nome — nunca adivinha.
 */
const MODELOS_MENCAO: { nome: string; id: string }[] = [
  ...new Map(
    AI_MODELS.filter((m) => m.nomeCurto.trim().length >= 4).map((m) => [
      m.nomeCurto.toLowerCase(),
      { nome: m.nomeCurto, id: m.id },
    ]),
  ).values(),
];

function modelosMencionados(n: Noticia): { nome: string; id: string }[] {
  const texto = `${n.titulo} ${n.descricao ?? ""}`.toLowerCase();
  const vistos: { nome: string; id: string }[] = [];
  for (const m of MODELOS_MENCAO) {
    if (vistos.length >= 2) break;
    const nome = m.nome.toLowerCase();
    // Fronteira de palavra evita "gpt" dentro de "gpt-5" falso.
    const padrao = new RegExp(
      `(^|[^a-z0-9])${nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`,
    );
    if (padrao.test(texto)) vistos.push(m);
  }
  return vistos;
}

/** Copia a ligação com confirmação curta (silencioso se não houver clipboard). */
function useCopiar(): [boolean, (url: string) => void] {
  const [copiada, setCopiada] = useState(false);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (tRef.current) clearTimeout(tRef.current);
    },
    [],
  );
  const copiar = (url: string) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiada(true);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setCopiada(false), 1600);
  };
  return [copiada, copiar];
}

/** Ponto de origem + nome da fonte. */
function Origem({ fonte }: { fonte: FonteNoticia }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium uppercase tracking-wide text-zinc-500">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: COR_FONTE[fonte] }}
      />
      {fonte}
    </span>
  );
}

/** Estatísticas sociais (pontos/comentários) de uma notícia. */
function Social({ noticia }: { noticia: Noticia }) {
  return (
    <span className="flex items-center gap-3 tabular-nums">
      <span title="Pontos ou reações" className="flex items-center gap-1">
        <Flame size={12} aria-hidden="true" className="text-zinc-300" />
        {numero(noticia.pontos)}
      </span>
      <span title="Comentários" className="flex items-center gap-1">
        <MessageSquare size={12} aria-hidden="true" className="text-zinc-300" />
        {numero(noticia.comentarios)}
      </span>
    </span>
  );
}

/** Ligações para fichas dos modelos mencionados (máx. 2). */
function Mencionados({ noticia }: { noticia: Noticia }) {
  const modelos = modelosMencionados(noticia);
  if (modelos.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {modelos.map((m) => (
        <Link
          key={m.id}
          href={`/modelo/${m.id}`}
          title={`Ver ficha de ${m.nome} no Model Arena`}
          className="chip transition hover:text-zinc-900 hover:underline"
        >
          {m.nome} →
        </Link>
      ))}
    </span>
  );
}

/** Etiquetas (no máximo 3). */
function Etiquetas({ noticia }: { noticia: Noticia }) {
  const tags = (noticia.tags ?? []).slice(0, 3);
  if (tags.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Hash size={11} aria-hidden="true" className="text-zinc-300" />
      {tags.map((t) => (
        <span key={t} className="chip">
          {t}
        </span>
      ))}
    </span>
  );
}

/** Botões de ação: copiar ligação + guardar. */
function Acoes({
  noticia,
  guardada,
  onGuardar,
}: {
  noticia: Noticia;
  guardada: boolean;
  onGuardar: () => void;
}) {
  const [copiada, copiar] = useCopiar();
  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => copiar(noticia.url)}
        title="Copiar ligação"
        aria-label={`Copiar ligação de ${noticia.titulo}`}
        className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
      >
        {copiada ? (
          <span className="text-[10px] font-semibold text-emerald-600">
            copiada
          </span>
        ) : (
          <Link2 size={13} aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={onGuardar}
        title={guardada ? "Remover dos guardados" : "Guardar para ler"}
        aria-label={
          guardada
            ? `Remover ${noticia.titulo} dos guardados`
            : `Guardar ${noticia.titulo} para ler`
        }
        aria-pressed={guardada}
        className={`rounded-md p-1.5 transition hover:bg-zinc-100 ${
          guardada ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
        }`}
      >
        {guardada ? (
          <BookmarkCheck size={13} aria-hidden="true" />
        ) : (
          <Bookmark size={13} aria-hidden="true" />
        )}
      </button>
    </span>
  );
}

/** Cartão de notícia (vista cartões). */
function CartaoNoticia({
  noticia,
  guardada,
  onGuardar,
}: {
  noticia: Noticia;
  guardada: boolean;
  onGuardar: () => void;
}) {
  return (
    <article className="card card-hover flex flex-col p-4">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <Origem fonte={noticia.fonte} />
        <span className="flex items-center gap-1 text-zinc-400">
          {tempoAtras(noticia.publicadoEm)}
          <Acoes noticia={noticia} guardada={guardada} onGuardar={onGuardar} />
        </span>
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

      <p className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] text-zinc-400">
        <span className="flex items-center gap-3">
          <Social noticia={noticia} />
          {noticia.autor && (
            <span className="max-w-24 truncate">{noticia.autor}</span>
          )}
        </span>
        <span className="truncate">{dominio(noticia.url)}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2">
        <Etiquetas noticia={noticia} />
        <Mencionados noticia={noticia} />
        {noticia.categoria && (
          <span className="chip ml-auto shrink-0">{noticia.categoria}</span>
        )}
      </div>
    </article>
  );
}

/** Linha compacta de notícia (vista lista). */
function LinhaNoticia({
  noticia,
  guardada,
  onGuardar,
}: {
  noticia: Noticia;
  guardada: boolean;
  onGuardar: () => void;
}) {
  return (
    <article className="flex items-start gap-3 px-4 py-2.5">
      <Origem fonte={noticia.fonte} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-zinc-900">
          <a
            href={noticia.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 transition hover:underline hover:decoration-zinc-400"
          >
            {noticia.titulo}
          </a>
        </h3>
        <p className="mt-0.5 flex items-center gap-3 text-[11px] text-zinc-400">
          <span>{tempoAtras(noticia.publicadoEm)}</span>
          <span className="flex items-center gap-1">
            <Flame size={11} aria-hidden="true" className="text-zinc-300" />
            {numero(noticia.pontos)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={11} aria-hidden="true" className="text-zinc-300" />
            {numero(noticia.comentarios)}
          </span>
          {noticia.categoria && <span className="chip">{noticia.categoria}</span>}
        </p>
      </div>
      <Acoes noticia={noticia} guardada={guardada} onGuardar={onGuardar} />
    </article>
  );
}

/** Notícia em destaque (a mais discutida). */
function Destaque({
  noticia,
  guardada,
  onGuardar,
}: {
  noticia: Noticia;
  guardada: boolean;
  onGuardar: () => void;
}) {
  return (
    <article className="card flex flex-col gap-3 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2 py-0.5 font-semibold text-white">
          <Flame size={11} aria-hidden="true" />
          Destaque
        </span>
        <Origem fonte={noticia.fonte} />
        <span className="text-zinc-400">{tempoAtras(noticia.publicadoEm)}</span>
        {noticia.categoria && <span className="chip">{noticia.categoria}</span>}
        <span className="ml-auto">
          <Acoes noticia={noticia} guardada={guardada} onGuardar={onGuardar} />
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug text-zinc-900 sm:text-xl">
        <a
          href={noticia.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 transition hover:underline hover:decoration-zinc-400"
        >
          {noticia.titulo}
        </a>
      </h3>

      {noticia.descricao && (
        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
          {noticia.descricao}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3 text-[11px] text-zinc-400">
        <span className="flex items-center gap-3">
          <Social noticia={noticia} />
          {noticia.autor && <span>por {noticia.autor}</span>}
          <span className="truncate">{dominio(noticia.url)}</span>
        </span>
        <a
          href={noticia.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary px-3 py-1.5 text-xs"
        >
          Ler notícia
          <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Mencionados noticia={noticia} />
        <Etiquetas noticia={noticia} />
      </div>
    </article>
  );
}

function Esqueleto() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="card p-5">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton mt-4 h-6 w-3/4" />
        <div className="skeleton mt-2 h-4 w-1/2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card flex flex-col gap-2.5 p-4">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Conteúdo do Radar IA: destaque, filtros, vistas, guardados. */
export function NoticiasConteudo() {
  const [noticias, setNoticias] = useState<Noticia[] | null>(null);
  const [aoVivo, setAoVivo] = useState(false);
  const [aAtualizar, setAAtualizar] = useState(false);
  const [geradoEm, setGeradoEm] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todas" | FonteNoticia>("todas");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [vista, setVista] = useState<Vista>("cartoes");
  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState<CategoriaNoticia | null>(null);
  const [soGuardadas, setSoGuardadas] = useState(false);
  const [guardadas, setGuardadas] = useState<string[]>([]);
  const [limite, setLimite] = useState(12);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Ref controla o estado montado (evita setState após desmontagem). */
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Guardados (localStorage), lidos de forma assíncrona (evita
  // setState sincrono no efeito) e gravados com segurança.
  useEffect(() => {
    let vivo = true;
    void Promise.resolve().then(() => {
      if (!vivo) return;
      try {
        const raw = window.localStorage.getItem(LS_GUARDADAS);
        if (raw) {
          const j = JSON.parse(raw) as unknown;
          if (Array.isArray(j)) {
            setGuardadas(j.filter((x): x is string => typeof x === "string"));
          }
        }
      } catch {
        /* armazenamento indisponível: segue sem guardados */
      }
    });
    return () => {
      vivo = false;
    };
  }, []);
  const alternarGuardada = (id: string) =>
    setGuardadas((atuais) => {
      const novas = atuais.includes(id)
        ? atuais.filter((x) => x !== id)
        : [...atuais, id];
      try {
        window.localStorage.setItem(LS_GUARDADAS, JSON.stringify(novas));
      } catch {
        /* indisponível: mantém só em memória */
      }
      return novas;
    });

  /** Aplica um resultado (comum à busca inicial e ao auto-refresh). */
  const aplicar = (r: { noticias: Noticia[]; aoVivo: boolean }) => {
    if (!montadoRef.current) return;
    setNoticias(r.noticias);
    setAoVivo(r.aoVivo);
    setGeradoEm(new Date().toISOString());
  };

  useEffect(() => {
    let vivo = true;
    buscarNoticias().then((r) => {
      if (vivo) aplicar(r);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Auto-refresh silencioso a cada 5 min (sem spinner, sem interrupção).
  useEffect(() => {
    const t = window.setInterval(() => {
      buscarNoticias().then((r) => {
        if (montadoRef.current) aplicar(r);
      });
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, []);

  /** Refetch manual (botão Atualizar), com checagem de desmontagem. */
  const atualizar = () => {
    if (aAtualizar) return;
    setAAtualizar(true);
    buscarNoticias()
      .then((r) => {
        if (montadoRef.current) aplicar(r);
      })
      .finally(() => {
        if (montadoRef.current) setAAtualizar(false);
      });
  };

  // Atalho "/" foca a pesquisa; Esc limpa.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const aEscrever =
        alvo &&
        (alvo.tagName === "INPUT" ||
          alvo.tagName === "TEXTAREA" ||
          alvo.isContentEditable);
      if (e.key === "/" && !aEscrever) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && aEscrever) {
        setPesquisa("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const contagens = useMemo(() => {
    const base = noticias ?? [];
    return {
      todas: base.length,
      hoje: base.filter((n) => idadeHoras(n.publicadoEm) < 24).length,
      hn: base.filter((n) => n.fonte === "Hacker News").length,
      dev: base.filter((n) => n.fonte === "Dev.to").length,
      guardadas: guardadas.length,
      categorias: Object.fromEntries(
        CATEGORIAS.map((c) => [c, base.filter((n) => n.categoria === c).length]),
      ) as Record<CategoriaNoticia, number>,
    };
  }, [noticias, guardadas]);

  const dentroDoPeriodo = (n: Noticia): boolean => {
    const h = idadeHoras(n.publicadoEm);
    if (periodo === "hoje") return h < 24;
    if (periodo === "7d") return h < 24 * 7;
    if (periodo === "30d") return h < 24 * 30;
    return true;
  };

  const lista = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    const set = new Set(guardadas);
    return (noticias ?? []).filter((n) => {
      if (filtro !== "todas" && n.fonte !== filtro) return false;
      if (categoria && n.categoria !== categoria) return false;
      if (soGuardadas && !set.has(n.id)) return false;
      if (!dentroDoPeriodo(n)) return false;
      if (!q) return true;
      return (
        n.titulo.toLowerCase().includes(q) ||
        (n.descricao ?? "").toLowerCase().includes(q) ||
        (n.autor ?? "").toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticias, filtro, categoria, soGuardadas, guardadas, pesquisa, periodo]);

  const ordenada = useMemo(() => {
    const l = [...lista];
    if (ordem === "discutidas")
      l.sort((a, b) => b.pontos - a.pontos || b.comentarios - a.comentarios);
    else if (ordem === "relevancia") l.sort((a, b) => relevancia(b) - relevancia(a));
    // "recentes" já vem ordenada da busca (data desc).
    return l;
  }, [lista, ordem]);

  /** Destaque: mais discutida, só na vista principal sem filtros ativos. */
  const destaque = useMemo(() => {
    if (
      ordem !== "recentes" ||
      filtro !== "todas" ||
      categoria !== null ||
      soGuardadas ||
      pesquisa.trim() !== "" ||
      periodo !== "tudo" ||
      lista.length === 0
    ) {
      return null;
    }
    return [...lista].sort(
      (a, b) => b.pontos - a.pontos || b.comentarios - a.comentarios,
    )[0]!;
  }, [lista, ordem, filtro, categoria, soGuardadas, pesquisa, periodo]);

  const semDestaque = useMemo(
    () => (destaque ? ordenada.filter((n) => n.id !== destaque.id) : ordenada),
    [ordenada, destaque],
  );

  const grupos = useMemo((): GrupoDia[] => {
    // Lista compacta e "discutidas" dispensam o agrupamento por dia.
    if (vista === "lista" || ordem !== "recentes") {
      return [{ chave: "lista", rotulo: "", itens: semDestaque.slice(0, limite) }];
    }
    const porDia = agruparDia(semDestaque);
    let restantes = limite;
    return porDia
      .map((g) => {
        const itens = g.itens.slice(0, Math.max(0, restantes));
        restantes -= itens.length;
        return { ...g, itens };
      })
      .filter((g) => g.itens.length > 0);
  }, [semDestaque, vista, ordem, limite]);

  const totalVisiveis = grupos.reduce((s, g) => s + g.itens.length, 0);
  const setGuardadasIds = useMemo(() => new Set(guardadas), [guardadas]);
  const maisDiscutida = useMemo(
    () =>
      [...(noticias ?? [])].sort(
        (a, b) => b.pontos - a.pontos || b.comentarios - a.comentarios,
      )[0],
    [noticias],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      {/* ===== Barra de ferramentas ===== */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="input flex-1 px-3.5 py-2.5">
          <Search size={16} aria-hidden="true" className="shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="search"
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value);
              setLimite(12);
            }}
            placeholder="Pesquisar notícias…  (tecla /)"
            aria-label="Pesquisar notícias"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>
        <label className="input shrink-0 px-3 py-2.5">
          <CalendarRange size={15} aria-hidden="true" className="shrink-0 text-zinc-400" />
          <select
            value={periodo}
            onChange={(e) => {
              setPeriodo(e.target.value as Periodo);
              setLimite(12);
            }}
            aria-label="Período das notícias"
            className="cursor-pointer bg-transparent text-sm text-zinc-800 outline-none [&>option]:bg-white"
          >
            {PERIODOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.rotulo}
              </option>
            ))}
          </select>
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

      {/* ===== Fontes · ordem · vista ===== */}
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
                onClick={() => {
                  setFiltro(f.id);
                  setLimite(12);
                }}
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

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Ordenação das notícias"
            className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1"
          >
            {ORDENS.map((o) => {
              const Icon = o.icone;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={ordem === o.id}
                  onClick={() => setOrdem(o.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    ordem === o.id
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <Icon size={12} aria-hidden="true" />
                  {o.rotulo}
                </button>
              );
            })}
          </div>
          <div
            role="group"
            aria-label="Vista das notícias"
            className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1"
          >
            {VISTAS.map((v) => {
              const Icon = v.icone;
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={vista === v.id}
                  onClick={() => setVista(v.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    vista === v.id
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <Icon size={12} aria-hidden="true" />
                  {v.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Categorias + guardados ===== */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-pressed={categoria === null}
          onClick={() => setCategoria(null)}
          className={`chip transition hover:text-zinc-900 ${
            categoria === null ? "bg-zinc-900 text-white" : ""
          }`}
        >
          Todas as categorias
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={categoria === c}
            onClick={() => setCategoria(categoria === c ? null : c)}
            className={`chip tabular-nums transition hover:text-zinc-900 ${
              categoria === c ? "bg-zinc-900 text-white" : ""
            }`}
          >
            {c} · {contagens.categorias[c] ?? 0}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={soGuardadas}
          onClick={() => {
            setSoGuardadas(!soGuardadas);
            setLimite(12);
          }}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition ${
            soGuardadas
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {soGuardadas ? (
            <BookmarkCheck size={12} aria-hidden="true" />
          ) : (
            <Bookmark size={12} aria-hidden="true" />
          )}
          Guardadas · {contagens.guardadas}
        </button>
      </div>

      {/* ===== Resumo + estado das fontes ===== */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{numero(totalVisiveis)} notícia(s) na vista</span>
          <span className="tabular-nums">{numero(contagens.hoje)} nas últimas 24 h</span>
          {geradoEm && <span>atualizado {tempoAtras(geradoEm)}</span>}
          {maisDiscutida && (
            <span className="max-w-[16rem] truncate">
              mais discutida:{" "}
              <strong className="font-medium text-zinc-600">
                {maisDiscutida.titulo}
              </strong>
            </span>
          )}
        </span>
        {!aoVivo && noticias !== null && (
          <span className="rounded-md border border-amber-600/30 bg-amber-600/5 px-2 py-1 text-amber-800">
            APIs sem resposta — a mostrar ligações de referência
          </span>
        )}
      </div>

      {noticias === null ? (
        <Esqueleto />
      ) : totalVisiveis === 0 && !destaque ? (
        <EmptyState
          icone={Search}
          titulo="Nada por aqui"
          dica="Nenhuma notícia corresponde aos filtros. Tente outro período, limpe a categoria ou volte a todas as fontes."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {destaque && (
            <Destaque
              noticia={destaque}
              guardada={setGuardadasIds.has(destaque.id)}
              onGuardar={() => alternarGuardada(destaque.id)}
            />
          )}

          {vista === "lista" ? (
            <section aria-label="Lista de notícias" className="card divide-y divide-zinc-100 overflow-hidden">
              {grupos[0]?.itens.map((n) => (
                <LinhaNoticia
                  key={n.id}
                  noticia={n}
                  guardada={setGuardadasIds.has(n.id)}
                  onGuardar={() => alternarGuardada(n.id)}
                />
              ))}
            </section>
          ) : (
            grupos.map((g) =>
              g.rotulo ? (
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
                      <CartaoNoticia
                        key={n.id}
                        noticia={n}
                        guardada={setGuardadasIds.has(n.id)}
                        onGuardar={() => alternarGuardada(n.id)}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div
                  key={g.chave}
                  className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {g.itens.map((n) => (
                    <CartaoNoticia
                      key={n.id}
                      noticia={n}
                      guardada={setGuardadasIds.has(n.id)}
                      onGuardar={() => alternarGuardada(n.id)}
                    />
                  ))}
                </div>
              ),
            )
          )}

          {limite < ordenada.length - (destaque ? 1 : 0) && (
            <button
              type="button"
              onClick={() => setLimite((v) => v + 12)}
              className="btn-ghost self-center px-5 py-2.5 text-sm"
            >
              Carregar mais (
              {ordenada.length - (destaque ? 1 : 0) - limite} restantes)
            </button>
          )}
        </div>
      )}

      <p className="text-center text-xs text-zinc-400">
        Fontes: Hacker News (Algolia) · Dev.to · atualiza sozinha a cada 5 min ·
        abre em nova aba · tecla{" "}
        <kbd className="rounded border border-zinc-200 px-1">/</kbd> para
        pesquisar
      </p>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  Database,
  Dices,
  Scale,
  Swords,
  Trophy,
} from "lucide-react";
import {
  AI_MODELS,
  ARENA_PUBLISH_DATE,
  DATA_COUNT_TOTAL,
  DATA_GENERATED_AT,
  MODELS_BY_ID,
  buildCatalogo,
  buildProviderOptions,
} from "@/data/models";
import type { AIModel } from "@/types/ai-model";
import { headline, placarConfronto } from "@/lib/comparar";
import {
  buscarAaVivo,
  buscarCatalogoVivo,
  type AaVivo,
  type CatalogoVivo,
} from "@/lib/catalogo-vivo";
import { CompareSelectors } from "@/components/CompareSelectors";
import { ModelPicker } from "@/components/ModelPicker";
import { ModelLogo } from "@/components/ModelLogo";
import { CategoryShortcuts } from "@/components/CategoryShortcuts";
import { ModelDossier } from "@/components/ModelDossier";
import { ScoreCards } from "@/components/ScoreCards";
import { ComparisonTable } from "@/components/ComparisonTable";
import { IndicadoresDesempenho } from "@/components/IndicadoresDesempenho";
import { DesempenhoTempoReal } from "@/components/DesempenhoTempoReal";
import { CatalogSection } from "@/components/CatalogSection";
import { TopModels } from "@/components/TopModels";
import { Reveal } from "@/components/Reveal";
import { HeroStats } from "@/components/HeroStats";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { LogoMark } from "@/components/SiteLogo";

/** Rótulo numerado de secção com linha que se desenha. */
function Kicker({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-4">
      <span className="section-kicker">
        <span className="kicker-num">{num}</span>
        {label}
      </span>
      <div className="glow-line mt-2.5" aria-hidden="true" />
    </div>
  );
}

/** Letras animadas do título gigante (atraso escalonado). */
function TituloLetras({
  texto,
  base,
  tom,
}: {
  texto: string;
  base: number;
  tom: "branco" | "marca";
}) {
  return (
    <>
      {texto.split("").map((l, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={tom === "marca" ? "letter-brand" : "letter"}
          style={{ animationDelay: `${base + i * 0.07}s` }}
        >
          {l}
        </span>
      ))}
    </>
  );
}

/** Barra fina de progresso de scroll fixa no topo. */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const p = max > 0 ? h.scrollTop / max : 0;
        if (ref.current) ref.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div aria-hidden="true" className="scroll-progress">
      <div ref={ref} className="scroll-progress-bar" />
    </div>
  );
}

/**
 * Página principal: catálogo real do OpenRouter + comparação A/B.
 * Estado central (useState) para as seleções e o modal; dados
 * derivados (useMemo) para modelos e veredito (placar central).
 */
/** Cartão do duelo em destaque (#1 × #2 do ranking) no hero. */
function DueloDestaque({
  topA,
  topB,
  onAbrir,
}: {
  topA: AIModel | undefined;
  topB: AIModel | undefined;
  onAbrir: (a: string, b: string) => void;
}) {
  if (!topA || !topB) return null;
  const p = placarConfronto(topA, topB);
  const pct = p.vitoriasA + p.vitoriasB > 0
    ? (p.vitoriasA / (p.vitoriasA + p.vitoriasB)) * 100
    : 50;
  const linha = (m: typeof topA, lado: "A" | "B") => {
    const h = headline(m);
    const cor = lado === "A" ? "#0284c7" : "#7c3aed";
    return (
      <div className="flex min-w-0 items-center gap-3">
        <ModelLogo
          nome={m.nomeCurto}
          dominio={m.dominioLogo}
          cor={m.cor}
          tamanho={40}
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-extrabold tracking-[0.22em] uppercase"
            style={{ color: cor }}
          >
            #{m.rank} · Lado {lado}
          </p>
          <p className="truncate text-base font-extrabold text-zinc-900">
            {m.nomeCurto}
          </p>
          <p className="truncate text-xs text-stone-500">
            {m.empresa} · {h.valor} {h.valor !== "—" ? `· ${h.rotulo}` : ""}
          </p>
        </div>
      </div>
    );
  };
  return (
    <aside
      aria-label="Duelo em destaque"
      className="glass-card sheen card-enter relative w-full overflow-hidden p-5 text-left sm:p-6"
      style={{ animationDelay: "350ms" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, #0284c7, #4f46e5, #7c3aed)`,
        }}
      />
      <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.25em] text-indigo-600 uppercase">
        <span aria-hidden="true" className="pulse-neon inline-block h-2 w-2 rounded-full bg-indigo-600" />
        Duelo em destaque
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {linha(topA, "A")}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="duel-medal flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-600 text-[10px] font-black text-zinc-950">
            VS
          </span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>
        {linha(topB, "B")}
      </div>
      <div
        className="score-track mt-4 h-1.5 rounded-full"
        style={{ "--pct-a": `${pct}%` } as CSSProperties}
        aria-hidden="true"
      />
      <p className="mt-2 text-center text-xs font-bold text-zinc-600">
        {p.vencedor ? (
          <>{p.vencedor.nomeCurto} vence {p.vitoriasA}×{p.vitoriasB} nos quesitos</>
        ) : p.semDados ? (
          <>Sem métrica pública em comum</>
        ) : (
          <>Empate técnico {p.vitoriasA}×{p.vitoriasB}</>
        )}
      </p>
      <button
        type="button"
        onClick={() => onAbrir(topA.id, topB.id)}
        className="btn-primary cta-glow mt-4 w-full rounded-xl px-4 py-2.5 text-sm"
      >
        Abrir este duelo na arena
      </button>
    </aside>
  );
}

/** Estado vazio: ringue sem lutadores, com ações para começar. */
function EmptyDuel({
  onPickA,
  onPickB,
  onAleatorio,
  compacto = false,
}: {
  onPickA: () => void;
  onPickB: () => void;
  onAleatorio: () => void;
  compacto?: boolean;
}) {
  return (
    <div
      className={`glass-card flex flex-col items-center px-6 text-center ${compacto ? "py-8" : "py-12"}`}
    >
      <span className="duel-medal inline-flex rounded-full p-3">
        <Swords size={26} aria-hidden="true" className="text-indigo-600" />
      </span>
      <p className={`font-extrabold text-zinc-900 ${compacto ? "mt-4 text-base" : "mt-5 text-xl"}`}>
        O ringue está vazio
      </p>
      <p className="mt-1.5 max-w-md text-sm text-zinc-500">
        Escolha dois modelos para começar o duelo — ou deixe o destino
        decidir com um sorteio.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onAleatorio}
          className="btn-primary cta-glow inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm"
        >
          <Dices size={16} aria-hidden="true" />
          Duelo aleatório
        </button>
        <button
          type="button"
          onClick={onPickA}
          className="btn-ghost inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold"
        >
          Escolher A
        </button>
        <button
          type="button"
          onClick={onPickB}
          className="btn-ghost inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold"
        >
          Escolher B
        </button>
      </div>
    </div>
  );
}

/** Chave da persistência local do duelo escolhido pelo utilizador. */
const LS_DUELO = "model-arena-duelo-v1";

/** Lê o duelo guardado (ids válidos) ou começa com o ringue vazio. */
function dueloInicial(): { a: string | null; b: string | null } {
  if (typeof window === "undefined") return { a: null, b: null };
  try {
    const raw = window.localStorage.getItem(LS_DUELO);
    if (!raw) return { a: null, b: null };
    const j = JSON.parse(raw) as { a?: unknown; b?: unknown };
    const a = typeof j.a === "string" && MODELS_BY_ID[j.a] ? j.a : null;
    const b =
      typeof j.b === "string" && MODELS_BY_ID[j.b] && j.b !== a ? j.b : null;
    return { a, b };
  } catch {
    return { a: null, b: null };
  }
}

export default function Home() {
  // Ringue começa vazio: o duelo é sempre escolha do utilizador.
  const [ids, setIds] = useState<{ a: string | null; b: string | null }>(
    dueloInicial,
  );
  const modelAId = ids.a;
  const modelBId = ids.b;
  const setModelAId = (id: string | null) =>
    setIds((s) => ({ ...s, a: id }));
  const setModelBId = (id: string | null) =>
    setIds((s) => ({ ...s, b: id }));
  const [picker, setPicker] = useState<null | "A" | "B">(null);

  // Dados ao vivo: catálogo OpenRouter (público) + índices AA via
  // NOSSA rota `/api/aa/ratings` (a chave do servidor nunca chega ao
  // navegador). Falha graciosa em ambos: mantém o snapshot embutido.
  const [vivo, setVivo] = useState<CatalogoVivo | null>(null);
  const [aaVivo, setAaVivo] = useState<AaVivo | null>(null);
  const [aoVivo, setAoVivo] = useState(false);
  useEffect(() => {
    let vivo2 = true;
    buscarCatalogoVivo().then((snap) => {
      if (!vivo2 || !snap) return;
      setVivo(snap);
      setAoVivo(true);
    });
    buscarAaVivo().then((aa) => {
      if (vivo2 && aa) setAaVivo(aa);
    });
    return () => {
      vivo2 = false;
    };
  }, []);

  /** Catálogo efetivo: funde o ao vivo (se houver) com AA ao vivo. */
  const catalogo = useMemo(
    () =>
      vivo
        ? buildCatalogo(vivo.raw, aaVivo?.ratings)
        : { models: AI_MODELS, total: DATA_COUNT_TOTAL },
    [vivo, aaVivo],
  );
  const modelos = catalogo.models;
  const porId = useMemo(
    () => Object.fromEntries(modelos.map((m) => [m.id, m])),
    [modelos],
  );
  const opcoesFornecedor = useMemo(
    () => buildProviderOptions(modelos),
    [modelos],
  );
  const totalBruto = vivo?.total ?? DATA_COUNT_TOTAL;
  const geradoEm = vivo?.generatedAt ?? DATA_GENERATED_AT;

  // Persiste a escolha para as próximas visitas.
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_DUELO, JSON.stringify(ids));
    } catch {
      /* armazenamento indisponível: segue sem persistir */
    }
  }, [ids]);

  const modelA = useMemo(
    () => (modelAId ? (porId[modelAId] ?? MODELS_BY_ID[modelAId] ?? null) : null),
    [modelAId, porId],
  );
  const modelB = useMemo(
    () => (modelBId ? (porId[modelBId] ?? MODELS_BY_ID[modelBId] ?? null) : null),
    [modelBId, porId],
  );

  /** Troca com proteção: nunca permite A === B (faz swap). */
  const escolher = (slot: "A" | "B", id: string) => {
    if (slot === "A") {
      if (id === modelBId) setModelBId(modelAId);
      setModelAId(id);
    } else {
      if (id === modelAId) setModelAId(modelBId);
      setModelBId(id);
    }
  };

  /** Inverte os lados mantendo os mesmos modelos. */
  const trocarLados = () => {
    setModelAId(modelBId);
    setModelBId(modelAId);
  };

  /** Do catálogo/rankings: atribui ao lado e volta à comparação. */
  const atribuirDoCatalogo = (slot: "A" | "B", id: string) => {
    escolher(slot, id);
    document.getElementById("comparar")?.scrollIntoView({ behavior: "smooth" });
  };

  /** Duelo aleatório com confronto real (prefere pares comparáveis). */
  const sortearDuelo = () => {
    const pool = modelos.filter((m) => m.fonte !== "estimativa");
    const base = pool.length >= 2 ? pool : modelos;
    const par = (): [string, string] => {
      const i = Math.floor(Math.random() * base.length);
      let j = Math.floor(Math.random() * base.length);
      if (j === i) j = (j + 1) % base.length;
      return [base[i].id, base[j].id];
    };
    let [a, b] = par();
    // Tenta até 40 pares para garantir quesitos decidíveis.
    for (let t = 0; t < 40; t++) {
      const ma = MODELS_BY_ID[a];
      const mb = MODELS_BY_ID[b];
      if (ma && mb && placarConfronto(ma, mb).avaliados > 0) break;
      [a, b] = par();
    }
    setIds({ a, b });
    document.getElementById("comparar")?.scrollIntoView({ behavior: "smooth" });
  };

  /** Placar central do confronto direto (fonte única da pontuação). */
  const placar = useMemo(
    () => (modelA && modelB ? placarConfronto(modelA, modelB) : null),
    [modelA, modelB],
  );

  const dataSnapshot = geradoEm
    ? new Date(geradoEm).toLocaleDateString("pt-PT")
    : "";
  const dataArena = ARENA_PUBLISH_DATE
    ? new Date(`${ARENA_PUBLISH_DATE}T00:00:00`).toLocaleDateString("pt-PT")
    : "";

  const decisivos = placar ? placar.vitoriasA + placar.vitoriasB : 0;
  const pctA =
    placar && decisivos > 0 ? (placar.vitoriasA / decisivos) * 100 : 50;

  /** Faixa da fita de duelo: top 14 do catálogo com headline. */
  const fita = useMemo(() => modelos.slice(0, 14), [modelos]);

  return (
    <div id="top" className="min-h-screen text-stone-900">
      <ScrollProgress />
      <SiteNav
        pagina="inicio"
        selo={
          <span
            title={`${aoVivo ? "Catálogo ao vivo" : "Snapshot OpenRouter"} de ${dataSnapshot} · ${totalBruto} registos brutos`}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-500 shadow-sm"
          >
            <Database size={11} aria-hidden="true" className="text-indigo-600" />
            {dataSnapshot || "snapshot"}
          </span>
        }
      />

      {/* ===== Cabeçalho hero: MODEL ARENA ===== */}
      <header className="relative overflow-hidden border-b border-stone-200 pt-14">
        <div aria-hidden="true" className="spotlight" />
        <div aria-hidden="true" className="spotlight spotlight-b" />
        <div aria-hidden="true" className="aurora aurora-a" />
        <div aria-hidden="true" className="aurora aurora-b" />
        <div aria-hidden="true" className="aurora aurora-c" />
        <div aria-hidden="true" className="hero-grid absolute inset-0" />
        <span aria-hidden="true" className="float-p left-[12%] top-[30%] h-1.5 w-1.5 bg-indigo-500/50" />
        <span aria-hidden="true" className="float-p left-[22%] top-[62%] h-1 w-1 bg-sky-500/50" style={{ animationDelay: "-2s" }} />
        <span aria-hidden="true" className="float-p right-[16%] top-[26%] h-2 w-2 bg-violet-500/40" style={{ animationDelay: "-4s" }} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <span className="bob inline-flex" aria-hidden="true">
              <LogoMark className="h-14 w-14 sm:h-16 sm:w-16" />
            </span>
            <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-600/25 bg-indigo-600/5 px-3 py-1 text-xs font-bold text-indigo-700 lg:mx-0">
              <span
                aria-hidden="true"
                className="pulse-neon inline-block h-2 w-2 rounded-full bg-indigo-600"
              />
              Duelo de gigantes da IA · Benchmarks reais
            </p>

            <h1 aria-label="Model Arena" className="arena-title mt-6 text-6xl sm:text-7xl">
              <span className="arena-word-model block">
                <TituloLetras texto="MODEL" base={0.05} tom="branco" />
              </span>
              <span className="arena-word-arena block">
                <TituloLetras texto="ARENA" base={0.4} tom="marca" />
              </span>
            </h1>

            <p
              className="card-enter mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600 lg:mx-0"
              style={{ animationDelay: "150ms" }}
            >
              AA + LMArena + OpenRouter num só ringue: escolha dois modelos e
              descubra quem vence em código, texto, imagem, matemática,
              velocidade, preço e contexto.
            </p>

            <div
              className="card-enter mt-6 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start"
              style={{ animationDelay: "280ms" }}
            >
              <a
                href="#comparar"
                className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm"
              >
                <Swords size={15} aria-hidden="true" />
                Escolher os lutadores
              </a>
              <button
                type="button"
                onClick={sortearDuelo}
                className="btn-ghost inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                <Dices size={15} aria-hidden="true" />
                Duelo aleatório
              </button>
            </div>

            <ol
              className="card-enter mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-stone-500 lg:justify-start"
              style={{ animationDelay: "400ms" }}
            >
              {[
                { n: "1", t: "Escolhe dois modelos", href: "#comparar" },
                { n: "2", t: "Compara métricas nativas", href: "#analise" },
                { n: "3", t: "Vê o veredito", href: "#veredito" },
              ].map((s) => (
                <li key={s.n}>
                  <a
                    href={s.href}
                    className="group inline-flex items-center gap-2 transition hover:text-zinc-900"
                  >
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-indigo-600/30 bg-indigo-600/10 px-1.5 text-[11px] font-extrabold text-indigo-700 transition group-hover:border-indigo-600/60 group-hover:bg-indigo-600/20">
                      {s.n}
                    </span>
                    {s.t}
                  </a>
                </li>
              ))}
            </ol>

            <p className="mt-5 text-xs text-zinc-600">
              {aoVivo ? (
                <span
                  title={
                    aaVivo
                      ? "Catálogo OpenRouter e índices Artificial Analysis em tempo real"
                      : "Catálogo OpenRouter em tempo real · índices AA do snapshot embutido"
                  }
                  className="chip-in inline-flex items-center gap-1.5 rounded-full border border-emerald-700/30 bg-emerald-600/10 px-2.5 py-0.5 font-bold text-emerald-700"
                >
                  <span aria-hidden="true" className="dot-pulse inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Catálogo ao vivo · atualizado hoje ({dataSnapshot}
                  {aaVivo ? " · AA em tempo real" : ""})
                </span>
              ) : (
                <>
                  Snapshot OpenRouter de {dataSnapshot} ({totalBruto}{" "}
                  registos brutos)
                </>
              )}{" "}
              · {opcoesFornecedor.length} fornecedores · Elo LMArena de{" "}
              {dataArena}
            </p>
          </div>

          <DueloDestaque
            topA={modelos[0]}
            topB={modelos[1]}
            onAbrir={(a, b) => {
              setIds({ a, b });
              document
                .getElementById("comparar")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-8 text-center sm:px-6">
          <HeroStats models={modelos} />

          <a
            href="#comparar"
            className="mt-7 inline-flex flex-col items-center gap-1 text-[11px] font-bold tracking-[0.25em] text-stone-400 uppercase transition hover:text-indigo-600"
          >
            Explorar a arena
            <ChevronDown size={16} aria-hidden="true" className="bounce-y" />
          </a>
        </div>

        {/* Fita de duelo: top do catálogo em ticker */}
        <div className="ticker relative" aria-hidden="true">
          <div className="ticker-track py-2">
            {[...fita, ...fita].map((m, i) => {
              const h = headline(m);
              return (
                <span
                  key={`${m.id}-${i}`}
                  className="flex shrink-0 items-center gap-2 px-5 text-xs font-semibold whitespace-nowrap text-stone-500"
                >
                  <span
                    className={`font-black tabular-nums ${i % 14 < 3 ? "text-indigo-600" : "text-stone-400"}`}
                  >
                    {String((i % 14) + 1).padStart(2, "0")}
                  </span>
                  <ModelLogo
                    nome={m.nomeCurto}
                    dominio={m.dominioLogo}
                    cor={m.cor}
                    tamanho={18}
                  />
                  <span className="text-zinc-800">{m.nomeCurto}</span>
                  <span className="tabular-nums text-stone-500">{h.valor}</span>
                  <span className="pl-3 text-indigo-600/40">{"///"}</span>
                </span>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
        {/* ===== 01 · Duelo ===== */}
        <div>
          <Reveal>
            <Kicker num="01" label="Escolha os lutadores" />
            <CompareSelectors
              modelA={modelA}
              modelB={modelB}
              onAbrirA={() => setPicker("A")}
              onAbrirB={() => setPicker("B")}
              onTrocar={trocarLados}
              onAleatorio={sortearDuelo}
            />
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-4">
              <CategoryShortcuts
                onSelect={(aId, bId) => {
                  setModelAId(aId);
                  setModelBId(bId);
                }}
              />
            </div>
          </Reveal>
        </div>

        {/* ===== 02 · Veredito (placar) ===== */}
        <div>
          <Reveal delay={120}>
            <Kicker num="02" label="Veredito do duelo" />
            {placar && modelA && modelB ? (
            <section
              id="veredito"
              aria-labelledby="veredito-titulo"
              className="veredito-glow verdict-band scroll-mt-20 overflow-hidden"
              role="status"
              aria-live="polite"
            >
              <h2 id="veredito-titulo" className="sr-only">
                Veredito do confronto
              </h2>
              <div className="grid grid-cols-1 items-center gap-5 px-5 py-6 sm:grid-cols-[1fr_auto_1fr] sm:px-8">
                {/* Lado A */}
                <div className="flex items-center gap-4">
                  <ModelLogo
                    nome={modelA.nomeCurto}
                    dominio={modelA.dominioLogo}
                    cor={modelA.cor}
                    tamanho={56}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold tracking-[0.22em] text-sky-400 uppercase">
                      Modelo A
                    </p>
                    <p className="truncate text-lg font-extrabold text-zinc-50">
                      {modelA.nomeCurto}
                    </p>
                    <div
                      aria-hidden="true"
                      className="bar-shimmer mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"
                    >
                      <div
                        className="bar-fill h-full rounded-full bg-sky-400"
                        style={{ width: `${(placar.vitoriasA / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p
                    key={`sa-${placar.vitoriasA}`}
                    className="score-digit text-6xl text-sky-400 tabular-nums sm:text-7xl"
                    aria-label={`${placar.vitoriasA} vitórias do Modelo A`}
                  >
                    {placar.vitoriasA}
                  </p>
                </div>

                {/* Centro */}
                <div className="flex flex-col items-center gap-2">
                  <span
                    key={`${modelA.id}__${modelB.id}`}
                    aria-hidden="true"
                    className="duel-medal duel-clash flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-600 text-xs font-black text-zinc-950"
                  >
                    VS
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 uppercase">
                    {placar.semDados
                      ? "Sem dados"
                      : placar.vencedor
                        ? Math.abs(placar.vitoriasA - placar.vitoriasB) >= 3
                          ? "Nocaute"
                          : "Vitória"
                        : "Empate"}
                  </span>
                  <span
                    className="score-ring"
                    role="img"
                    aria-label={`${placar.avaliados} de 5 quesitos comparáveis`}
                    style={
                      {
                        "--p": `${(placar.avaliados / 5) * 100}`,
                        "--ring-hole": "#131228",
                        "--ring-text": "#fafafa",
                      } as CSSProperties
                    }
                  >
                    <span aria-hidden="true">{placar.avaliados}/5</span>
                  </span>
                </div>

                {/* Lado B */}
                <div className="flex items-center gap-4 sm:flex-row-reverse sm:text-right">
                  <ModelLogo
                    nome={modelB.nomeCurto}
                    dominio={modelB.dominioLogo}
                    cor={modelB.cor}
                    tamanho={56}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold tracking-[0.22em] text-violet-400 uppercase">
                      Modelo B
                    </p>
                    <p className="truncate text-lg font-extrabold text-zinc-50">
                      {modelB.nomeCurto}
                    </p>
                    <div
                      aria-hidden="true"
                      className="bar-shimmer mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"
                    >
                      <div
                        className="bar-fill h-full rounded-full bg-violet-400"
                        style={{ width: `${(placar.vitoriasB / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p
                    key={`sb-${placar.vitoriasB}`}
                    className="score-digit text-6xl text-violet-400 tabular-nums sm:text-7xl"
                    aria-label={`${placar.vitoriasB} vitórias do Modelo B`}
                  >
                    {placar.vitoriasB}
                  </p>
                </div>
              </div>

              <p className="border-t border-white/10 px-5 py-3.5 text-center text-sm sm:px-8 sm:text-base">
                {placar.semDados ? (
                  <span className="text-zinc-300">
                    <strong className="text-zinc-50">
                      Sem confronto possível
                    </strong>{" "}
                    — nenhuma métrica pública em comum. Desempate por preço e
                    contexto abaixo.
                  </span>
                ) : placar.vencedor ? (
                  <>
                    <Trophy
                      size={16}
                      aria-hidden="true"
                      className="bounce-in mr-1.5 inline text-cyan-300"
                    />
                    <strong className="text-zinc-50">
                      {placar.vencedor.nomeCurto}
                    </strong>{" "}
                    vence{" "}
                    <span className="text-zinc-500">
                      ({placar.vitoriasA}×{placar.vitoriasB} em quesitos
                      decidíveis)
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-300">
                    <Scale
                      size={16}
                      aria-hidden="true"
                      className="mr-1.5 inline text-zinc-400"
                    />
                    <strong className="text-zinc-50">Empate técnico</strong>{" "}
                    ({placar.vitoriasA}×{placar.vitoriasB}
                    {placar.empates > 0 && `, ${placar.empates} empate(s)`})
                  </span>
                )}
              </p>

              {/* Barra de proporção + chips */}
              <div className="border-t border-white/10 px-5 py-3 sm:px-8">
                <div
                  className="score-track h-1.5 rounded-full"
                  style={{ "--pct-a": `${pctA}%` } as CSSProperties}
                  aria-hidden="true"
                />
                <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-zinc-500">
                  {placar.empates > 0 && (
                    <span className="chip-in rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                      {placar.empates} empate(s) exato(s)
                    </span>
                  )}
                  <span className="chip-in rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                    {placar.avaliados}/5 quesitos comparáveis
                  </span>
                  {placar.semConfronto > 0 && (
                    <span className="chip-in rounded-full bg-zinc-800/60 px-2 py-0.5 text-zinc-400">
                      {placar.semConfronto} sem métrica comum
                    </span>
                  )}
                  <span className="text-zinc-400">
                    Preço e contexto entram como vantagens na tabela
                  </span>
                </p>
              </div>
            </section>
            ) : (
              <EmptyDuel
                onPickA={() => setPicker("A")}
                onPickB={() => setPicker("B")}
                onAleatorio={sortearDuelo}
              />
            )}
          </Reveal>
        </div>

        {/* ===== 03 · Análise detalhada ===== */}
        <div id="analise" className="flex scroll-mt-20 flex-col gap-8">
          <Reveal>
            <Kicker num="03" label="Raio-X dos lutadores" />
            {modelA && modelB ? (
              <ModelDossier modelA={modelA} modelB={modelB} />
            ) : (
              <EmptyDuel
                compacto
                onPickA={() => setPicker("A")}
                onPickB={() => setPicker("B")}
                onAleatorio={sortearDuelo}
              />
            )}
          </Reveal>

          {modelA && modelB && (
            <>
              <Reveal>
                <ScoreCards modelA={modelA} modelB={modelB} />
              </Reveal>

              <Reveal>
                <ComparisonTable modelA={modelA} modelB={modelB} />
              </Reveal>

              <Reveal>
                <IndicadoresDesempenho modelA={modelA} modelB={modelB} />
              </Reveal>
            </>
          )}
        </div>

        <div id="tempo-real" className="scroll-mt-20">
          <Reveal>
            <Kicker num="04" label="Pulso da arena" />
            {modelA && modelB ? (
              <DesempenhoTempoReal
                key={`${modelA.id}__${modelB.id}`}
                modelA={modelA}
                modelB={modelB}
              />
            ) : (
              <EmptyDuel
                compacto
                onPickA={() => setPicker("A")}
                onPickB={() => setPicker("B")}
                onAleatorio={sortearDuelo}
              />
            )}
          </Reveal>
        </div>

        <div id="rankings" className="scroll-mt-20">
          <Reveal>
            <Kicker num="05" label="Hall da fama" />
            <TopModels models={modelos} onAssign={atribuirDoCatalogo} />
          </Reveal>
        </div>

        <div>
          <Reveal>
            <Kicker num="06" label="Todos os lutadores" />
            <CatalogSection
              models={modelos}
              totalSnapshot={dataSnapshot}
              onAssign={atribuirDoCatalogo}
            />
          </Reveal>
        </div>

        <Reveal>
          <section
            aria-labelledby="nota-metodologica"
            className="glass-card px-5 py-4 text-sm text-zinc-500"
          >
            <h2 id="nota-metodologica" className="font-bold text-zinc-800">
              Nota metodológica
            </h2>
            <p className="mt-1">
              Sem notas 0–10: cada quesito exibe o valor{" "}
              <strong className="text-zinc-800">nativo</strong> — índices
              Artificial Analysis (API direta com chave + espelho OpenRouter),
              Elo Design Arena e Elo{" "}
              <strong className="text-zinc-800">LMArena</strong> (edição de{" "}
              {dataArena}), com prioridade AA direto → OpenRouter → LMArena. O
              travessão significa ausência de dado público (sem nota
              atribuída) — nenhum valor é inventado ou extrapolado. O
              ranking geral ordena pelo índice AA de Inteligência
              (modelos sem índice, pelo Elo LMArena). Selos
              teal/céu/rosa = 100% reais, âmbar = parcial,
              cinzento = sem dados. Índices AA verificados contra o board
              público da Artificial Analysis; Elos LMArena contra o dataset
              oficial. Preços, contexto e modalidades vêm do
              catálogo público (
              <code className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700">
                npm run models:fetch
              </code>
              ); latência, produtividade e fornecedores são lidos em tempo real
              da API de endpoints (
              <code className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700">
                /api/v1/models/{"{id}"}/endpoints
              </code>
              ).
            </p>
          </section>
        </Reveal>
      </main>

      <SiteFooter totalModelos={modelos.length} />

      <ModelPicker
        aberto={picker === "A"}
        titulo="Selecionar Modelo A"
        models={modelos}
        excludeId={modelBId}
        onSelect={(id) => escolher("A", id)}
        onClose={() => setPicker(null)}
      />
      <ModelPicker
        aberto={picker === "B"}
        titulo="Selecionar Modelo B"
        models={modelos}
        excludeId={modelAId}
        onSelect={(id) => escolher("B", id)}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

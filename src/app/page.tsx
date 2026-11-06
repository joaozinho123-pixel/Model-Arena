"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Dices, Gauge, Table2, Users } from "lucide-react";
import { ARENA_PUBLISH_DATE, MODELS_BY_ID } from "@/data/models";
import { placarConfronto } from "@/lib/comparar";
import { useCatalogo } from "@/lib/use-catalogo";
import { EmptyState } from "@/components/EmptyState";
import { CompareSelectors } from "@/components/CompareSelectors";
import { CategoryShortcuts } from "@/components/CategoryShortcuts";
import { ModelPicker } from "@/components/ModelPicker";
import { ModelLogo } from "@/components/ModelLogo";
import { ModelDossier } from "@/components/ModelDossier";
import { ComparisonTable } from "@/components/ComparisonTable";
import { IndicadoresDesempenho } from "@/components/IndicadoresDesempenho";
import { DesempenhoTempoReal } from "@/components/DesempenhoTempoReal";
import { HeroStats } from "@/components/HeroStats";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

/** Cabeçalho de secção: rótulo pequeno com filete e descrição. */
function Kicker({
  id,
  label,
  desc,
}: {
  id?: string;
  label: string;
  desc?: string;
}) {
  return (
    <div id={id} className="mb-3 scroll-mt-24 border-b border-zinc-200 pb-2.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </h2>
      {desc && (
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{desc}</p>
      )}
    </div>
  );
}

/** Ringue vazio: convidativo e curto. */
function EmptyDuel({
  onPickA,
  onPickB,
  onAleatorio,
}: {
  onPickA: () => void;
  onPickB: () => void;
  onAleatorio: () => void;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <p className="text-sm font-semibold text-zinc-900">
        Nenhum modelo selecionado
      </p>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        Escolha dois modelos — ou arranque com um duelo aleatório.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onAleatorio}
          className="btn-primary px-4 py-2 text-sm"
        >
          <Dices size={15} aria-hidden="true" />
          Duelo aleatório
        </button>
        <button type="button" onClick={onPickA} className="btn-ghost px-4 py-2 text-sm">
          Escolher A
        </button>
        <button type="button" onClick={onPickB} className="btn-ghost px-4 py-2 text-sm">
          Escolher B
        </button>
      </div>
    </div>
  );
}

/** Chave da persistência local do duelo escolhido pelo utilizador. */
const LS_DUELO = "model-arena-duelo-v1";

/** Formato mínimo de id OpenRouter (provider/modelo). */
const ID_OK = /^[\w.\-]+\/[\w.\-]+$/;

/** Lê o duelo guardado (ids válidos) ou começa com o ringue vazio. */
function dueloInicial(): { a: string | null; b: string | null } {
  if (typeof window === "undefined") return { a: null, b: null };
  try {
    const raw = window.localStorage.getItem(LS_DUELO);
    if (!raw) return { a: null, b: null };
    const j = JSON.parse(raw) as { a?: unknown; b?: unknown };
    const a = typeof j.a === "string" && ID_OK.test(j.a) ? j.a : null;
    const b =
      typeof j.b === "string" && ID_OK.test(j.b) && j.b !== a ? j.b : null;
    return { a, b };
  } catch {
    return { a: null, b: null };
  }
}

export default function Home() {
  // Ringue começa vazio no SSR e hidrata com a escolha guardada
  // APÓS o mount (evita mismatch de hidration com localStorage).
  const [ids, setIds] = useState<{ a: string | null; b: string | null }>({
    a: null,
    b: null,
  });
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => {
    // Lê a escolha guardada APÓS o mount (pós-paint): evita o
    // mismatch de hidratação SSR ↔ localStorage e evita setState
    // síncrono no corpo do efeito (nota de lint do React 19).
    // Deep-link ?a=<id>&b=<id> das fichas: vence o estado guardado
    // e desce à comparação.
    const id = requestAnimationFrame(() => {
      const inicial = dueloInicial();
      try {
        const sp = new URLSearchParams(window.location.search);
        const a = sp.get("a");
        const b = sp.get("b");
        // Aceita ids do snapshot E do catálogo ao vivo: os modelos
        // novos resolvem depois, quando o catálogo ao vivo carrega.
        if (a && ID_OK.test(a) && a !== b) inicial.a = a;
        if (b && ID_OK.test(b) && b !== inicial.a) inicial.b = b;
        if (inicial.a === inicial.b) inicial.b = null;
        if (a || b) {
          document
            .getElementById("comparar")
            ?.scrollIntoView({ behavior: "smooth" });
        }
      } catch {
        /* URL improvisado: segue com o duelo guardado */
      }
      setIds(inicial);
      setHidratado(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const modelAId = ids.a;
  const modelBId = ids.b;
  const setModelAId = (id: string | null) =>
    setIds((s) => ({ ...s, a: id }));
  const setModelBId = (id: string | null) =>
    setIds((s) => ({ ...s, b: id }));
  const [picker, setPicker] = useState<null | "A" | "B">(null);

  // Catálogo efetivo (hook partilhado com /rankings e /catalogo):
  // funde o ao vivo (se houver) com AA ao vivo.
  const { modelos, porId, opcoesFornecedor, aoVivo, geradoEm } =
    useCatalogo();

  // Persiste a escolha para as próximas visitas (só depois de
  // hidratar o duelo guardado, para não o limpar por engano).
  useEffect(() => {
    if (!hidratado) return;
    try {
      window.localStorage.setItem(LS_DUELO, JSON.stringify(ids));
    } catch {
      /* armazenamento indisponível: segue sem persistir */
    }
  }, [ids, hidratado]);

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

  const statusDuelo = placar
    ? placar.semDados
      ? "Sem dados"
      : placar.vencedor
        ? "Vitória"
        : "Empate"
    : "";

  return (
    <div id="top" className="min-h-screen">
      <SiteNav pagina="inicio" />

      {/* ===== Cabeçalho ===== */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 pt-24 pb-10 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Model Arena
          </h1>
          <p className="mx-auto mt-3.5 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Compare dois modelos de IA lado a lado: índices da Artificial
            Analysis, Elos da LMArena, preço, contexto e velocidade — sem
            notas inventadas.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <a href="#comparar" className="btn-primary px-5 py-2.5 text-sm">
              Comparar modelos
            </a>
            <button
              type="button"
              onClick={sortearDuelo}
              className="btn-ghost px-5 py-2.5 text-sm"
            >
              <Dices size={15} aria-hidden="true" />
              Duelo aleatório
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Explorar{" "}
            <Link
              href="/rankings"
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-zinc-900"
            >
              Rankings
            </Link>{" "}
            ·{" "}
            <Link
              href="/catalogo"
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-zinc-900"
            >
              Catálogo completo
            </Link>
          </p>

          <HeroStats models={modelos} />

          <p className="mt-7 text-xs text-zinc-400">
            {aoVivo ? "Catálogo ao vivo" : "Snapshot"} OpenRouter ·{" "}
            {dataSnapshot} · {opcoesFornecedor.length} fornecedores · Elo
            LMArena de {dataArena}
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-10 sm:px-6">
        {/* ===== Duelo (escolha dos modelos) ===== */}
        <section aria-labelledby="kicker-comparar" className="scroll-mt-20">
          <Kicker
            id="kicker-comparar"
            label="Duelo"
            desc="Escolha os dois concorrentes no ringue — ou deixe o sorteio decidir com pares comparáveis."
          />
          <div className="flex flex-col gap-4 pt-1">
            <CompareSelectors
              modelA={modelA}
              modelB={modelB}
              onAbrirA={() => setPicker("A")}
              onAbrirB={() => setPicker("B")}
              onTrocar={trocarLados}
              onAleatorio={sortearDuelo}
            />
          </div>
        </section>

        {/* ===== Duelos sugeridos ===== */}
        <section aria-labelledby="kicker-sugestoes" className="scroll-mt-20">
          <Kicker
            id="kicker-sugestoes"
            label="Duelos sugeridos"
            desc="Combinações clássicas de categoria: líderes por quesito para começar sem procurar."
          />
          <div className="pt-1">
            <CategoryShortcuts
              onSelect={(aId, bId) => {
                setModelAId(aId);
                setModelBId(bId);
                document
                  .getElementById("comparar")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>
        </section>

        {/* ===== Veredito (placar) ===== */}
        <section aria-labelledby="veredito-titulo">
          <Kicker
            id="veredito-titulo"
            label="Veredito"
            desc="Placar direto nos quesitos com métrica pública comum — sem notas inventadas."
          />
          {placar && modelA && modelB ? (
            <div
              className="card overflow-hidden"
              role="status"
              aria-live="polite"
            >
              <div className="grid grid-cols-1 items-center gap-5 px-5 py-6 sm:grid-cols-[1fr_auto_1fr] sm:px-8">
                {/* Lado A */}
                <div className="flex items-center gap-4">
                  <ModelLogo
                    nome={modelA.nomeCurto}
                    dominio={modelA.dominioLogo}
                    cor={modelA.cor}
                    tamanho={52}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                      Modelo A
                    </p>
                    <p className="truncate text-base font-semibold text-zinc-900">
                      {modelA.nomeCurto}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {placar.vitoriasA}/5 quesitos
                    </p>
                  </div>
                  <p
                    aria-label={`${placar.vitoriasA} vitórias do Modelo A`}
                    className="text-4xl font-bold tabular-nums text-zinc-900 sm:text-5xl"
                  >
                    {placar.vitoriasA}
                  </p>
                </div>

                {/* Centro */}
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-bold text-zinc-900"
                  >
                    VS
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {statusDuelo}
                  </span>
                </div>

                {/* Lado B */}
                <div className="flex items-center gap-4 sm:flex-row-reverse sm:text-right">
                  <ModelLogo
                    nome={modelB.nomeCurto}
                    dominio={modelB.dominioLogo}
                    cor={modelB.cor}
                    tamanho={52}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                      Modelo B
                    </p>
                    <p className="truncate text-base font-semibold text-zinc-900">
                      {modelB.nomeCurto}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {placar.vitoriasB}/5 quesitos
                    </p>
                  </div>
                  <p
                    aria-label={`${placar.vitoriasB} vitórias do Modelo B`}
                    className="text-4xl font-bold tabular-nums text-zinc-900 sm:text-5xl"
                  >
                    {placar.vitoriasB}
                  </p>
                </div>
              </div>

              <p className="border-t border-zinc-200 px-5 py-3.5 text-center text-sm sm:px-8">
                {placar.semDados ? (
                  <span className="text-zinc-500">
                    Sem confronto possível — nenhuma métrica pública em comum.
                    O desempate fica pelo preço e contexto abaixo.
                  </span>
                ) : placar.vencedor ? (
                  <span className="text-zinc-600">
                    <strong className="font-semibold text-zinc-900">
                      {placar.vencedor.nomeCurto}
                    </strong>{" "}
                    vence ({placar.vitoriasA}×{placar.vitoriasB} em quesitos
                    decidíveis)
                  </span>
                ) : (
                  <span className="text-zinc-600">
                    <strong className="font-semibold text-zinc-900">
                      Empate técnico
                    </strong>{" "}
                    ({placar.vitoriasA}×{placar.vitoriasB}
                    {placar.empates > 0 && `, ${placar.empates} empate(s)`})
                  </span>
                )}
              </p>

              <div className="border-t border-zinc-200 px-5 py-3.5 sm:px-8">
                <div
                  aria-hidden="true"
                  className="h-1 rounded-full bg-zinc-200"
                >
                  <div
                    className="h-full rounded-full bg-zinc-900"
                    style={{ width: `${pctA}%` }}
                  />
                </div>
                <p className="mt-2.5 text-center text-[11px] text-zinc-500">
                  {placar.avaliados}/5 quesitos comparáveis
                  {placar.empates > 0 && ` · ${placar.empates} empate(s) exato(s)`}
                  {placar.semConfronto > 0 && ` · ${placar.semConfronto} sem métrica comum`}
                </p>
              </div>
            </div>
          ) : (
            <EmptyDuel
              onPickA={() => setPicker("A")}
              onPickB={() => setPicker("B")}
              onAleatorio={sortearDuelo}
            />
          )}
        </section>

        {/* ===== Fichas ===== */}
        <section aria-labelledby="kicker-fichas" className="scroll-mt-20">
          <Kicker
            id="kicker-fichas"
            label="Fichas"
            desc="Identidade, descrição, preço, contexto e ligações oficiais dos dois concorrentes."
          />
          <div className="pt-1">
            {modelA && modelB ? (
              <ModelDossier modelA={modelA} modelB={modelB} />
            ) : (
              <EmptyState
                icone={Users}
                titulo="Nenhum modelo selecionado"
                dica="Escolha dois concorrentes no Duelo acima para ver as fichas."
              />
            )}
          </div>
        </section>

        {/* ===== Tabela comparativa ===== */}
        <section aria-labelledby="kicker-tabela" className="scroll-mt-20">
          <Kicker
            id="kicker-tabela"
            label="Tabela comparativa"
            desc="Todos os quesitos lado a lado, com fontes distintas identificadas — só valores nativos."
          />
          <div className="pt-1">
            {modelA && modelB ? (
              <ComparisonTable modelA={modelA} modelB={modelB} />
            ) : (
              <EmptyState
                icone={Table2}
                titulo="Tabela vazia"
                dica="A tabela comparativa aparece quando os dois lados do duelo estiverem escolhidos."
              />
            )}
          </div>
        </section>

        {/* ===== Indicadores (gráficos) ===== */}
        <section aria-labelledby="kicker-graficos" className="scroll-mt-20">
          <Kicker
            id="kicker-graficos"
            label="Indicadores"
            desc="Gráficos só com confrontos comparáveis: índices AA 0–100 quando os dois têm a métrica, Elos face a face na mesma arena — métricas de um lado ficam listadas, nunca viram barra sola."
          />
          <div className="pt-1">
            {modelA && modelB ? (
              <IndicadoresDesempenho modelA={modelA} modelB={modelB} />
            ) : (
              <EmptyState
                icone={BarChart3}
                titulo="Sem gráficos para mostrar"
                dica="Os indicadores só comparam métricas iguais dos dois lados — escolha o par para ver as barras."
              />
            )}
          </div>
        </section>

        {/* ===== Tempo real ===== */}
        <section aria-labelledby="kicker-tempo-real" className="scroll-mt-20">
          <Kicker
            id="kicker-tempo-real"
            label="Tempo real"
            desc="Latência e produtividade medidas ao vivo no endpoint de cada modelo (OpenRouter)."
          />
          <div className="pt-3">
            {modelA && modelB ? (
              <DesempenhoTempoReal
                key={`${modelA.id}__${modelB.id}`}
                modelA={modelA}
                modelB={modelB}
              />
            ) : (
              <EmptyState
                icone={Gauge}
                titulo="Medições ao vivo em pausa"
                dica="Latência e produtividade são lidas no endpoint de cada modelo quando o par está escolhido."
              />
            )}
          </div>
        </section>

      </main>

      <SiteFooter totalModelos={modelos.length} atualizadoEm={dataSnapshot} />

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

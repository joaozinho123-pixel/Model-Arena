import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  AI_MODELS,
  ARENA_PUBLISH_DATE,
  MODELS_BY_ID,
} from "@/data/models";
import { CATEGORIES } from "@/types/ai-model";
import type { AIModel } from "@/types/ai-model";
import { modeloVivoPorId } from "@/lib/modelo-vivo-servidor";
import { CapabilityChips } from "@/components/CapabilityChips";
import { VarianteBadge } from "@/components/VarianteBadge";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import {
  formatCompact,
  formatContext,
  formatPrice,
  modalityLabel,
} from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

/** SSG de todas as fichas do snapshot (id contém "/", rota catch-all). */
export function generateStaticParams(): { id: string[] }[] {
  // Só variantes base: ids com ":" (lote/grátis) criariam nomes de
  // pasta inválidos no Windows no prerender — ficam on-demand.
  return AI_MODELS.filter((m) => m.variante === "base").map((m) => ({
    id: m.id.split("/"),
  }));
}

interface PageProps {
  params: Promise<{ id: string[] }>;
}

/**
 * Ficha pelo id: snapshot embutido primeiro; a faltar, o catálogo ao
 * vivo (modelos novos que ainda não entraram no snapshot). Só dá 404
 * quando o modelo não existe em lado nenhum.
 */
async function fichaPorId(id: string): Promise<AIModel | null> {
  const direto = MODELS_BY_ID[id];
  if (direto) return direto;
  // O router codifica ":" como %3A nos links de variantes.
  const decodificado = MODELS_BY_ID[safeDecode(id)];
  if (decodificado) return decodificado;
  return modeloVivoPorId(id);
}

/** Decodifica %3A e %2F quando o router recebeu o id codificado. */
function safeDecode(id: string): string {
  try {
    return decodeURIComponent(id).replace(/%3A/gi, ":").replace(/%2F/gi, "/");
  } catch {
    return id;
  }
}

/** Pré-gera metadados por ficha (título, descrição e OpenGraph). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: segs } = await params;
  const model = await fichaPorId(segs.join("/"));
  if (!model) return { title: "Modelo não encontrado · Model Arena" };
  const descricaoCurta =
    model.descricao.length > 150
      ? `${model.descricao.slice(0, 147).trimEnd()}…`
      : model.descricao || `Ficha ${model.nomeCurto}: benchmarks, preço e contexto`;
  return {
    title: `${model.nomeCurto} (${model.empresa}) · Model Arena`,
    description: descricaoCurta,
    openGraph: { title: model.nomeCurto, description: descricaoCurta },
  };
}

/** Extrai jogos AA extras (frações 0–1 → %; outros valores nativos). */
function rotuloExtra(chave: string, v: unknown): string | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const valor = v <= 1.5 ? Math.round(v * 100) : v;
  const nome = chave.replace(/_/g, " ");
  return v <= 1.5 ? `${nome} · ${valor}%` : `${nome} · ${valor.toLocaleString("pt-PT")}`;
}

/** Secção com título pequeno + filete, padrão das restantes páginas. */
function Secao({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </h2>
      {children}
    </section>
  );
}

/** Chip informativo compacto. */
function Chip({ children, titulo }: { children: React.ReactNode; titulo?: string }) {
  return (
    <span
      title={titulo}
      className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600"
    >
      {children}
    </span>
  );
}

/** Ficha dedicada de um modelo (render estática, sem estado). */
export default async function ModelPage({ params }: PageProps) {
  const { id: segs } = await params;
  const model = await fichaPorId(segs.join("/"));
  if (!model) notFound();

  const m: AIModel = model;
  const modalidades = Array.from(
    new Set([...m.modalidades.entrada, ...m.modalidades.saida]),
  );
  const arenasArena = CATEGORIES.map((c) => ({
    cat: c.rotulo,
    elo: m.arena[c.key]?.elo,
    votos: m.arena[c.key]?.votos,
    rank: m.arena[c.key]?.rank,
    arena: m.arena[c.key]?.arena,
  })).filter((r) => typeof r.elo === "number");

  const extrasAA = Object.entries(m.extras ?? {})
    .map(([k, v]) => ({ rotulo: rotuloExtra(k, v) }))
    .filter((r): r is { rotulo: string } => r.rotulo !== null);

  const velTtft =
    typeof m.aa?.ttft === "number"
      ? `${(m.aa.ttft / 1000).toLocaleString("pt-PT", {
          maximumFractionDigits: 2,
        })} s`
      : null;

  /** Líder do catálogo (rank 1) para o atalho de comparação. */
  const topModel = AI_MODELS.reduce(
    (best, atual) => (atual.rank < best.rank ? atual : best),
    AI_MODELS[0]!,
  );

  return (
    <div id="top" className="page-in min-h-screen">
      <SiteNav pagina="ficha" />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-24 sm:px-6">
        {/* Migalha */}
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <ArrowLeft size={15} aria-hidden="true" />
          <Link href="/catalogo" className="transition-colors hover:text-zinc-900">
            Catálogo
          </Link>
          <span aria-hidden="true" className="text-zinc-300">/</span>
          <span className="truncate font-medium text-zinc-700">
            {m.nomeCurto}
          </span>
        </p>

        {/* ===== Cabeçalho da ficha ===== */}
        <header className="card flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <ModelLogo
              nome={m.nomeCurto}
              dominio={m.dominioLogo}
              cor={m.cor}
              tamanho={64}
              eager
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {m.nomeCurto}{" "}
                <VarianteBadge variante={m.variante} />
              </h1>
              <p className="mt-1 text-sm font-medium text-zinc-700">
                {m.empresa}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400">
                {m.id}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              <Chip titulo="Posição no catálogo (melhor métrica)">
                Top {m.rank}
              </Chip>
              {m.destaque && <Chip titulo="Destaque">{m.destaque}</Chip>}
            </div>
          </div>

          {m.descricao && (
            <p className="text-[15px] leading-relaxed text-zinc-700">
              {m.descricao}
            </p>
          )}

          {m.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {m.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[11px] text-zinc-500">Entrada / Saída</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-zinc-900">
                {formatPrice(m.precoEntrada)} / {formatPrice(m.precoSaida)}
                <span className="text-xs font-normal text-zinc-400"> /1M</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-zinc-500">Contexto</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-zinc-900">
                {formatContext(m.contexto)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[11px] text-zinc-500">Modalidades</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {modalidades.map((mod) => (
                  <span
                    key={mod}
                    title={modalityLabel(mod)}
                    className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600"
                  >
                    {modalityLabel(mod)}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <CapabilityChips model={m} className="mt-3" />

          {/* Atalho: comparar com o líder do catálogo */}
          {topModel && topModel.id !== m.id && (
            <p className="mt-2 text-xs text-zinc-500">
              <a
                href={`/?a=${encodeURIComponent(m.id)}&b=${encodeURIComponent(topModel.id)}`}
                className="inline-flex items-center gap-1 font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900"
              >
                Comparar com o líder do catálogo ({topModel.nomeCurto})
              </a>
            </p>
          )}

          {/* CTAs para o duelo */}
          <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
            <a
              href={`/?a=${encodeURIComponent(m.id)}`}
              className="btn-primary px-4 py-2 text-sm"
            >
              Usar como Modelo A
            </a>
            <a
              href={`/?b=${encodeURIComponent(m.id)}`}
              className="btn-ghost px-4 py-2 text-sm"
            >
              Usar como Modelo B
            </a>
            <ShareLinkButton
              href={`/modelo/${m.id}`}
              rotulo="Copiar ligação"
              className="self-center px-2 py-2"
            />
          </div>
        </header>

        {/* ===== Quesitos nativos ===== */}
        <Secao label="Quesitos (valores nativos)">
          <ul className="card divide-y divide-zinc-100 overflow-hidden">
            {CATEGORIES.map((c) => {
              const ev = m.evidencias[c.key];
              return (
                <li
                  key={c.key}
                  title={ev.titulo}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-zinc-900">
                      {c.rotulo}
                    </span>
                    <span className="truncate text-[11px] text-zinc-400">
                      {c.descricao}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-zinc-900">
                      {ev.valor}
                    </span>
                    {ev.valor !== "—" && (
                      <span className="block text-[10px] uppercase tracking-wide text-zinc-400">
                        {ev.origem}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-zinc-400">
            Sem notas 0–10: cada quesito mostra o valor nativo da fonte.
          </p>
        </Secao>

        {/* ===== Elo LMArena ===== */}
        {arenasArena.length > 0 && (
          <Secao label="Elo LMArena">
            <ul className="card divide-y divide-zinc-100 overflow-hidden">
              {arenasArena.map((r) => (
                <li
                  key={r.cat}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5"
                >
                  <span className="text-sm text-zinc-800">
                    {r.cat}
                    <span className="ml-2 text-[11px] text-zinc-400">
                      {r.arena}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-zinc-900">
                      {Math.round(r.elo as number)}
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      {typeof r.votos === "number" &&
                        `${r.votos.toLocaleString("pt-PT")} votos · rank ${r.rank ?? "?"}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {/* ===== Design Arena (todas as entradas) ===== */}
        {(m.designTodas?.length ?? 0) > 0 && (
          <Secao label="Design Arena">
            <ul className="card divide-y divide-zinc-100 overflow-hidden">
              {m.designTodas!.map((d) => (
                <li
                  key={d.arena}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5"
                >
                  <span className="text-sm text-zinc-800">
                    {d.category}
                    <span className="ml-2 text-[11px] text-zinc-400">
                      {d.arena}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-zinc-900">
                      {d.elo}
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      {d.win_rate != null && `${Math.round(d.win_rate)}% win rate`}{" "}
                      {typeof d.rank === "number" && `· rank ${d.rank}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {/* ===== Extras AA + velocidade ===== */}
        {(extrasAA.length > 0 || velTtft) && (
          <Secao label="Indicadores adicionais (Artificial Analysis)">
            <div className="card flex flex-wrap gap-1.5 p-4">
              {extrasAA.map((x) => (
                <Chip key={x.rotulo}>{x.rotulo}</Chip>
              ))}
              {velTtft && <Chip titulo="Tempo até o primeiro token (AA)">TTFT {velTtft}</Chip>}
            </div>
          </Secao>
        )}

        {/* ===== Hugging Face (open-weight) ===== */}
        {m.hf && (
          <Secao label="Peso aberto — Hugging Face">
            <div className="card flex flex-wrap items-center gap-4 p-4 text-sm text-zinc-700">
              <span className="tabular-nums">
                <strong className="font-semibold">{
                  m.hf.downloads != null
                    ? formatCompact(m.hf.downloads)
                    : "—"
                }</strong>{" "}
                downloads
              </span>
              <span className="tabular-nums">
                <strong className="font-semibold">
                  {m.hf.likes != null ? formatCompact(m.hf.likes) : "—"}
                </strong>{" "}
                likes
              </span>
              {m.hf.license && (
                <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">
                  {m.hf.license}
                </span>
              )}
              <a
                href={`https://huggingface.co/${m.hf.hf}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900"
              >
                Hugging Face <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>
          </Secao>
        )}

        {/* ===== Rodapé da ficha ===== */}
        <p className="text-center text-xs text-zinc-400">
          <a
            href={`https://openrouter.ai/${m.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-zinc-900"
          >
            Ver no OpenRouter <ExternalLink size={11} aria-hidden="true" />
          </a>
          {" · "}
          benchmarks AA/Design Arena ao vivo, Elo LMArena de{" "}
          {ARENA_PUBLISH_DATE
            ? new Date(`${ARENA_PUBLISH_DATE}T00:00:00`).toLocaleDateString("pt-PT")
            : "—"}
        </p>
      </main>

      <SiteFooter totalModelos={AI_MODELS.length} />
    </div>
  );
}

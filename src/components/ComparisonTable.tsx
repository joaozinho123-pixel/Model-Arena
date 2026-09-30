import {
  Check,
  CircleDollarSign,
  Code2,
  Database,
  Gauge,
  ImageIcon,
  Minus,
  Shapes,
  Sigma,
  Table2,
  Type,
} from "lucide-react";
import {
  CATEGORIES,
  type AIModel,
  type CategoryKey,
} from "@/types/ai-model";
import { formatContext, formatPrice, modalityLabel } from "@/lib/format";
import { placarConfronto, valorNativo, vencedorQuesito } from "@/lib/comparar";

/** Ícone por categoria de benchmark. */
const CATEGORY_ICONS: Record<CategoryKey, typeof Code2> = {
  codigo: Code2,
  texto: Type,
  imagem: ImageIcon,
  raciocinioMatematico: Sigma,
  velocidadeInferencia: Gauge,
};

/**
 * Tabela analítica em duas secções:
 * 1) Benchmarks em valores NATIVOS (Elo/índices, sem notas 0–10);
 * 2) Preço e contexto (dados reais do OpenRouter, sempre disponíveis).
 * O cabeçalho conta só os 5 quesitos (placar central) e mostra as
 * vantagens económicas separadamente — sem contagens duplicadas.
 */
interface ComparisonTableProps {
  modelA: AIModel;
  modelB: AIModel;
}

/** Célula numérica nativa (Elo/índice) com destaque ao vencedor. */
function ScoreCell({ valor, vence }: { valor: string; vence: boolean }) {
  // Travessão = ausência de dado público: pill intencional, não erro.
  if (valor === "—") {
    return (
      <span title="Sem benchmark público neste quesito" className="nodata">
        —
      </span>
    );
  }
  return (
    <span
      className={`inline-flex min-w-16 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 font-bold tabular-nums transition-colors ${
        vence
          ? "border-emerald-700/30 bg-emerald-600/10 text-emerald-700"
          : "border-stone-200 bg-stone-100 text-stone-700"
      }`}
    >
      {vence && <Check size={14} aria-hidden="true" />}
      {valor}
    </span>
  );
}

/** Célula de valor textual (preço/contexto) com destaque ao vencedor. */
function ValueCell({ texto, vence }: { texto: string; vence: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-bold tabular-nums transition-colors ${
        vence
          ? "border-emerald-700/30 bg-emerald-600/10 text-emerald-700"
          : "border-stone-200 bg-stone-100 text-stone-700"
      }`}
    >
      {vence && <Check size={14} aria-hidden="true" />}
      {texto}
    </span>
  );
}

export function ComparisonTable({ modelA, modelB }: ComparisonTableProps) {
  // Placar dos 5 quesitos de benchmark (fonte única, sem preço/contexto).
  const placar = placarConfronto(modelA, modelB);

  // Vantagens económicas contadas à parte (menor preço, maior contexto).
  let vantagensA = 0;
  let vantagensB = 0;
  if (modelA.precoEntrada !== modelB.precoEntrada) {
    if (modelA.precoEntrada < modelB.precoEntrada) vantagensA++;
    else vantagensB++;
  }
  if (modelA.precoSaida !== modelB.precoSaida) {
    if (modelA.precoSaida < modelB.precoSaida) vantagensA++;
    else vantagensB++;
  }
  if (modelA.contexto !== modelB.contexto) {
    if (modelA.contexto > modelB.contexto) vantagensA++;
    else vantagensB++;
  }

  // Destaque do confronto: primeiro quesito com vencedor decisivo.
  const destaque = CATEGORIES.map(({ key, rotulo }) => ({
    rotulo,
    vencedor: vencedorQuesito(modelA, modelB, key),
  })).find((d) => d.vencedor === "A" || d.vencedor === "B");

  return (
    <section
      aria-labelledby="tabela-analitica"
      className="glass-card overflow-hidden"
    >
      <div className="border-b border-stone-200 px-5 py-4">
        <h2
          id="tabela-analitica"
          className="flex items-center gap-2 text-base font-bold text-zinc-900"
        >
          <Table2 size={17} aria-hidden="true" className="text-indigo-600" />
          Tabela analítica
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Quesitos: {placar.vitoriasA}×{placar.vitoriasB} ({modelA.nomeCurto}{" "}
          × {modelB.nomeCurto})
          {placar.empates > 0 && ` · ${placar.empates} empate(s)`}
          {placar.semConfronto > 0 &&
            ` · ${placar.semConfronto} sem métrica comum`}
          {" · "}
          Vantagens económicas: {vantagensA}×{vantagensB} (preço + contexto)
          {destaque && (
            <>
              {" "}· Destaque: {destaque.rotulo} (
              {destaque.vencedor === "A"
                ? modelA.nomeCurto
                : modelB.nomeCurto}
              )
            </>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Comparação entre {modelA.nomeCurto} e {modelB.nomeCurto}: benchmarks,
            preço e contexto
          </caption>
          <thead>
            <tr className="bg-stone-100/80 text-xs tracking-wider text-stone-500 uppercase">
              <th scope="col" className="px-5 py-3 font-semibold">
                Métrica
              </th>
              <th scope="col" className="px-5 py-3 text-center font-semibold">
                <span
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ backgroundColor: modelA.cor }}
                  aria-hidden="true"
                />
                {modelA.nomeCurto}
              </th>
              <th scope="col" className="px-5 py-3 text-center font-semibold">
                <span
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ backgroundColor: modelB.cor }}
                  aria-hidden="true"
                />
                {modelB.nomeCurto}
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                Vantagem
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(({ key, rotulo, descricao }, idx) => {
              const va = valorNativo(modelA, key);
              const vb = valorNativo(modelB, key);
              const evA = modelA.evidencias[key];
              const evB = modelB.evidencias[key];
              // Mesma origem real (e mesmo canal de imagem) → comparável.
              const mesmaOrigem =
                evA.fonte !== "estimativa" &&
                evA.origem === evB.origem &&
                (key !== "imagem" || evA.via === evB.via);
              const algumReal =
                evA.fonte !== "estimativa" || evB.fonte !== "estimativa";
              const unidade =
                key === "velocidadeInferencia"
                  ? ""
                  : evA.origem === "AA"
                    ? "índice"
                    : "Elo";
              const resultado = vencedorQuesito(modelA, modelB, key);
              const aWins = resultado === "A";
              const bWins = resultado === "B";
              const Icon = CATEGORY_ICONS[key];
              const diff =
                va.num != null && vb.num != null
                  ? Math.abs(va.num - vb.num)
                  : null;
              const diffTexto =
                diff == null
                  ? null
                  : key === "velocidadeInferencia"
                    ? `+${(Math.round(diff * 10) / 10).toLocaleString("pt-PT")} tok/s`
                    : `+${unidade === "índice" ? diff.toFixed(1) : Math.round(diff)}`;
              return (
                  <tr
                    key={key}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className="row-enter border-t border-stone-100 transition-colors hover:bg-stone-50"
                  >
                    <th scope="row" className="px-5 py-3.5">
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            aWins || bWins ? "bg-indigo-600/10 text-indigo-700" : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block font-semibold text-zinc-900">
                            {rotulo}
                          </span>
                          <span className="block text-xs font-normal text-zinc-500">
                            {descricao} ·{" "}
                            {mesmaOrigem ? (
                              <span title={`${evA.titulo} · ${evB.titulo}`}>
                                {evA.origem} ·{" "}
                                {unidade ? `${unidade} ` : ""}
                                {evA.valor} × {evB.valor}
                              </span>
                            ) : algumReal ? (
                              <span title={`${evA.titulo} · ${evB.titulo}`}>
                                Parcial · fontes distintas
                              </span>
                            ) : (
                              "Sem dados públicos"
                            )}
                          </span>
                        </span>
                      </span>
                    </th>
                    <td className="px-5 py-3.5 text-center">
                      <ScoreCell valor={va.texto} vence={aWins} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <ScoreCell valor={vb.texto} vence={bWins} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {aWins ? (
                        <span className="text-xs font-bold text-emerald-700">
                          {modelA.nomeCurto}
                          {diffTexto ? ` ${diffTexto}` : ""}
                        </span>
                      ) : bWins ? (
                        <span className="text-xs font-bold text-emerald-700">
                          {modelB.nomeCurto}
                          {diffTexto ? ` ${diffTexto}` : ""}
                        </span>
                      ) : resultado === "empate" ? (
                        <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-zinc-500">
                          <Minus size={12} aria-hidden="true" /> Empate
                        </span>
                      ) : va.num != null || vb.num != null ? (
                        <span
                          title="Fontes distintas — sem vencedor neste quesito"
                          className="nodata"
                        >
                          —
                        </span>
                      ) : (
                        <span title="Nenhum dos modelos tem dado público" className="nodata">
                          sem dados
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

            {/* Secção preço/contexto — dados reais, sempre disponível */}
            <tr className="border-t border-stone-200 bg-stone-100/70">
              <th
                scope="row"
                colSpan={4}
                className="px-5 py-2 text-[11px] font-bold tracking-widest text-zinc-500 uppercase"
              >
                Preço e contexto · dados OpenRouter · não contam no placar
              </th>
            </tr>

            {(
              [
                {
                  icone: CircleDollarSign,
                  rotulo: "Preço de entrada",
                  descricao: "US$ por 1M de tokens · menor vence",
                  a: formatPrice(modelA.precoEntrada),
                  b: formatPrice(modelB.precoEntrada),
                  aWins: modelA.precoEntrada < modelB.precoEntrada,
                  bWins: modelB.precoEntrada < modelA.precoEntrada,
                },
                {
                  icone: CircleDollarSign,
                  rotulo: "Preço de saída",
                  descricao: "US$ por 1M de tokens · menor vence",
                  a: formatPrice(modelA.precoSaida),
                  b: formatPrice(modelB.precoSaida),
                  aWins: modelA.precoSaida < modelB.precoSaida,
                  bWins: modelB.precoSaida < modelA.precoSaida,
                },
                {
                  icone: Database,
                  rotulo: "Janela de contexto",
                  descricao: "Tokens · maior vence",
                  a: `${formatContext(modelA.contexto)} tokens`,
                  b: `${formatContext(modelB.contexto)} tokens`,
                  aWins: modelA.contexto > modelB.contexto,
                  bWins: modelB.contexto > modelA.contexto,
                },
              ] as const
            ).map((row, idx) => (
              <tr
                key={row.rotulo}
                style={{ animationDelay: `${300 + idx * 60}ms` }}
                className="row-enter border-t border-stone-100 transition-colors hover:bg-stone-50"
              >
                <th scope="row" className="px-5 py-3.5">
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                      <row.icone size={16} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold text-zinc-900">
                        {row.rotulo}
                      </span>
                      <span className="block text-xs font-normal text-zinc-500">
                        {row.descricao}
                      </span>
                    </span>
                  </span>
                </th>
                <td className="px-5 py-3.5 text-center">
                  <ValueCell texto={row.a} vence={row.aWins} />
                </td>
                <td className="px-5 py-3.5 text-center">
                  <ValueCell texto={row.b} vence={row.bWins} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  {row.aWins ? (
                    <span className="text-xs font-bold text-emerald-700">
                      {modelA.nomeCurto}
                    </span>
                  ) : row.bWins ? (
                    <span className="text-xs font-bold text-emerald-700">
                      {modelB.nomeCurto}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-zinc-500">
                      <Minus size={12} aria-hidden="true" /> Empate
                    </span>
                  )}
                </td>
              </tr>
            ))}

            <tr className="row-enter border-t border-stone-100 transition-colors hover:bg-stone-50">
              <th scope="row" className="px-5 py-3.5">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                    <Shapes size={16} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold text-zinc-900">
                      Modalidades
                    </span>
                    <span className="block text-xs font-normal text-stone-500">
                      Entrada → saída suportadas
                    </span>
                  </span>
                </span>
              </th>
              <td className="px-5 py-3.5 text-center text-xs text-zinc-700">
                {modelA.modalidades.entrada.map(modalityLabel).join(" + ")} →{" "}
                {modelA.modalidades.saida.map(modalityLabel).join(" + ")}
              </td>
              <td className="px-5 py-3.5 text-center text-xs text-zinc-700">
                {modelB.modalidades.entrada.map(modalityLabel).join(" + ")} →{" "}
                {modelB.modalidades.saida.map(modalityLabel).join(" + ")}
              </td>
              <td className="px-5 py-3.5 text-right text-xs text-zinc-600">
                Informativo
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="border-t border-stone-200 px-5 py-3 text-xs text-stone-500">
        Métricas nativas: índices Artificial Analysis, Elo Design Arena e Elo
        LMArena. — indica ausência de dado público (sem nota atribuída).
      </p>
    </section>
  );
}

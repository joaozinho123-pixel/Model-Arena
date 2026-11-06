import {
  CATEGORIES,
  type AIModel,
} from "@/types/ai-model";
import { formatContext, formatPrice, modalityLabel } from "@/lib/format";
import { placarConfronto, valorNativo, vencedorQuesito } from "@/lib/comparar";
import { Check } from "lucide-react";

/** Marca de capacidade: ✓ quando suportada, — quando não (dado real). */
function Marca({ sim }: { sim: boolean }) {
  return sim ? (
    <Check
      size={15}
      aria-hidden="true"
      className="ml-auto inline-block text-zinc-900"
    />
  ) : (
    <span title="Não suportado" className="nodata">
      —
    </span>
  );
}

/**
 * Tabela em três colunas: benchmarks nativos (5 quesitos) +
 * preço e contexto (dados reais do OpenRouter). O vencedor de
 * cada linha fica em peso, com a vantagem destacada. Sem pilhas
 * de pílulas: só tipografia.
 */
interface ComparisonTableProps {
  modelA: AIModel;
  modelB: AIModel;
}

/** Célula de valor nativo (Elo/índice) com destaque ao vencedor. */
function Valor({
  texto,
  vence,
  extra,
}: {
  texto: string;
  vence: boolean;
  extra?: string | null;
}) {
  // Travessão = ausência de dado público: intencional, não erro.
  if (texto === "—") {
    return (
      <span title="Sem benchmark público neste quesito" className="nodata">
        —
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 tabular-nums ${
        vence ? "font-semibold text-zinc-900" : "text-zinc-500"
      }`}
    >
      {texto}
      {extra && (
        <span className="text-[11px] font-medium text-emerald-600">{extra}</span>
      )}
    </span>
  );
}

export function ComparisonTable({ modelA, modelB }: ComparisonTableProps) {
  // Placar dos 5 quesitos de benchmark (fonte única, sem preço/contexto).
  const placar = placarConfronto(modelA, modelB);

  return (
    <section
      aria-labelledby="tabela-analitica"
      className="card overflow-hidden"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 px-5 py-4">
        <h2 id="tabela-analitica" className="text-sm font-semibold text-zinc-900">
          Tabela comparativa
        </h2>
        <p className="text-xs text-zinc-500">
          Quesitos {placar.vitoriasA}×{placar.vitoriasB}
          {placar.empates > 0 && ` · ${placar.empates} empate(s)`}
          {placar.semConfronto > 0 && ` · ${placar.semConfronto} sem métrica comum`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <caption className="sr-only">
            Comparação entre {modelA.nomeCurto} e {modelB.nomeCurto}: benchmarks,
            preço e contexto
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-400">
              <th scope="col" className="px-5 py-2.5 text-left font-medium">
                Métrica
              </th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">
                {modelA.nomeCurto}
              </th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">
                {modelB.nomeCurto}
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(({ key, rotulo, descricao }) => {
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
                  className="border-t border-zinc-100 transition-colors hover:bg-zinc-50"
                >
                  <th scope="row" className="px-5 py-3 text-left">
                    <span className="block font-medium text-zinc-900">{rotulo}</span>
                    <span className="block text-xs font-normal text-zinc-400">
                      {descricao}
                      {!mesmaOrigem && algumReal && (
                        <span title={`${evA.titulo} · ${evB.titulo}`}>
                          {" "}· fontes distintas
                        </span>
                      )}
                    </span>
                  </th>
                  <td className="px-5 py-3 text-right">
                    <Valor texto={va.texto} vence={aWins} extra={aWins ? diffTexto : null} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Valor texto={vb.texto} vence={bWins} extra={bWins ? diffTexto : null} />
                  </td>
                </tr>
              );
            })}

            {/* Secção preço/contexto — dados reais, sempre disponível */}
            <tr className="border-t border-zinc-200 bg-zinc-50">
              <th
                scope="row"
                colSpan={3}
                className="px-5 py-2 text-[11px] font-medium text-zinc-400"
              >
                Preço e contexto · dados OpenRouter · não contam no placar
              </th>
            </tr>

            {(
              [
                {
                  rotulo: "Preço de entrada",
                  descricao: "US$ por 1M de tokens · menor vence",
                  a: formatPrice(modelA.precoEntrada),
                  b: formatPrice(modelB.precoEntrada),
                  aWins: modelA.precoEntrada < modelB.precoEntrada,
                  bWins: modelB.precoEntrada < modelA.precoEntrada,
                },
                {
                  rotulo: "Preço de saída",
                  descricao: "US$ por 1M de tokens · menor vence",
                  a: formatPrice(modelA.precoSaida),
                  b: formatPrice(modelB.precoSaida),
                  aWins: modelA.precoSaida < modelB.precoSaida,
                  bWins: modelB.precoSaida < modelA.precoSaida,
                },
                {
                  rotulo: "Janela de contexto",
                  descricao: "Tokens · maior vence",
                  a: `${formatContext(modelA.contexto)} tokens`,
                  b: `${formatContext(modelB.contexto)} tokens`,
                  aWins: modelA.contexto > modelB.contexto,
                  bWins: modelB.contexto > modelA.contexto,
                },
              ] as const
            ).map((row) => (
              <tr
                key={row.rotulo}
                className="border-t border-zinc-100 transition-colors hover:bg-zinc-50"
              >
                <th scope="row" className="px-5 py-3 text-left">
                  <span className="block font-medium text-zinc-900">{row.rotulo}</span>
                  <span className="block text-xs font-normal text-zinc-400">
                    {row.descricao}
                  </span>
                </th>
                <td className="px-5 py-3 text-right">
                  <Valor texto={row.a} vence={row.aWins} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Valor texto={row.b} vence={row.bWins} />
                </td>
              </tr>
            ))}

            <tr className="border-t border-zinc-100 transition-colors hover:bg-zinc-50">
              <th scope="row" className="px-5 py-3 text-left">
                <span className="block font-medium text-zinc-900">Modalidades</span>
                <span className="block text-xs font-normal text-zinc-400">
                  Entrada → saída suportadas
                </span>
              </th>
              <td className="px-5 py-3 text-right text-xs text-zinc-500">
                {modelA.modalidades.entrada.map(modalityLabel).join(" + ")} →{" "}
                {modelA.modalidades.saida.map(modalityLabel).join(" + ")}
              </td>
              <td className="px-5 py-3 text-right text-xs text-zinc-500">
                {modelB.modalidades.entrada.map(modalityLabel).join(" + ")} →{" "}
                {modelB.modalidades.saida.map(modalityLabel).join(" + ")}
              </td>
            </tr>

            {/* Secção capacidades — dados reais do catálogo OpenRouter */}
            <tr className="border-t border-zinc-200 bg-zinc-50">
              <th
                scope="row"
                colSpan={3}
                className="px-5 py-2 text-[11px] font-medium text-zinc-400"
              >
                Capacidades · catálogo OpenRouter · não contam no placar
              </th>
            </tr>

            {(
              [
                {
                  rotulo: "Ferramentas",
                  descricao: "Function calling / tool use",
                  a: modelA.ferramentas,
                  b: modelB.ferramentas,
                },
                {
                  rotulo: "Saída estruturada",
                  descricao: "JSON com esquema definido",
                  a: modelA.saidaEstruturada,
                  b: modelB.saidaEstruturada,
                },
                {
                  rotulo: "Raciocínio",
                  descricao: "Modelo de reasoning",
                  a: modelA.raciocinio,
                  b: modelB.raciocinio,
                },
                {
                  rotulo: "Pesos abertos",
                  descricao: "Open-weight no Hugging Face",
                  a: modelA.hf != null,
                  b: modelB.hf != null,
                },
              ] as const
            ).map((row) => (
              <tr
                key={row.rotulo}
                className="border-t border-zinc-100 transition-colors hover:bg-zinc-50"
              >
                <th scope="row" className="px-5 py-3 text-left">
                  <span className="block font-medium text-zinc-900">
                    {row.rotulo}
                  </span>
                  <span className="block text-xs font-normal text-zinc-400">
                    {row.descricao}
                  </span>
                </th>
                <td className="px-5 py-3 text-right">
                  <Marca sim={row.a} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Marca sim={row.b} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-400">
        Índices Artificial Analysis, Elo Design Arena e Elo LMArena em valores
        nativos · capacidades segundo o catálogo OpenRouter · — indica
        ausência de dado público.
      </p>
    </section>
  );
}

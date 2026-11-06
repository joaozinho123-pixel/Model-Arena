import { Brain, Boxes, FileJson2, Wrench } from "lucide-react";
import type { AIModel } from "@/types/ai-model";

/**
 * Capacidades nativas do catálogo OpenRouter — só o que é real
 * (nunca inferido): ferramentas, saída estruturada, raciocínio e
 * pesos abertos (quando há registo Hugging Face).
 */
export function CapabilityChips({
  model,
  className = "",
}: {
  model: AIModel;
  className?: string;
}) {
  const itens: {
    chave: string;
    rotulo: string;
    icone: typeof Wrench;
    titulo: string;
  }[] = [
    {
      chave: "ferramentas",
      rotulo: "Ferramentas",
      icone: Wrench,
      titulo: "Suporta function calling / uso de ferramentas",
    },
    {
      chave: "saidaEstruturada",
      rotulo: "Saída estruturada",
      icone: FileJson2,
      titulo: "Respostas em JSON/com esquema estruturado",
    },
    {
      chave: "raciocinio",
      rotulo: "Raciocínio",
      icone: Brain,
      titulo: "Modelo de raciocínio (reasoning)",
    },
  ];
  const ativos = itens.filter((i) => model[i.chave as "ferramentas"]);
  const openWeights = model.hf != null;
  if (ativos.length === 0 && !openWeights) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {ativos.map(({ chave, rotulo, icone: Icon, titulo }) => (
        <span
          key={chave}
          title={titulo}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600"
        >
          <Icon size={11} aria-hidden="true" className="text-zinc-400" />
          {rotulo}
        </span>
      ))}
      {openWeights && (
        <span
          title={
            model.hf?.license
              ? `Pesos abertos · licença ${model.hf.license}`
              : "Pesos abertos no Hugging Face"
          }
          className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600"
        >
          <Boxes size={11} aria-hidden="true" className="text-zinc-400" />
          Open-weight{model.hf?.license ? ` · ${model.hf.license}` : ""}
        </span>
      )}
    </div>
  );
}

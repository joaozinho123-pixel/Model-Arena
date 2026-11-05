"use client";

import { useState } from "react";

/**
 * Logótipo do fornecedor: imagem sobre pastilha branca, com
 * fallback para avatar com a inicial quando não há logótipo ou
 * ele falha. Sem tilt, sem brilhos — só a pastilha plana.
 */
interface ModelLogoProps {
  /** Nome para extrair a inicial do fallback. */
  nome: string;
  /** URL direta do logótipo; ausente = avatar direto. */
  dominio?: string;
  /** Cor de destaque do fornecedor. */
  cor: string;
  /** Diâmetro em px. */
  tamanho?: number;
  /** Acima da dobra (hero): carrega de imediato em vez de lazy. */
  eager?: boolean;
}

/** Texto claro ou escuro conforme a luminosidade do fundo. */
function textoSobre(cor: string): string {
  const m = cor.replace("#", "");
  if (m.length !== 6) return "#fafafa";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.65 ? "#18181b" : "#fafafa";
}

export function ModelLogo({ nome, dominio, cor, tamanho = 32, eager = false }: ModelLogoProps) {
  const [falhou, setFalhou] = useState(false);
  const inicial = (nome.trim()[0] ?? "?").toUpperCase();

  if (!dominio || falhou) {
    return (
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold"
        style={{
          width: tamanho,
          height: tamanho,
          background: cor,
          color: textoSobre(cor),
          fontSize: tamanho * 0.44,
        }}
      >
        {inicial}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white"
      style={{ width: tamanho, height: tamanho }}
    >
      {/* <img> intencional: URLs remotas com fallback onError. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dominio}
        alt=""
        aria-hidden="true"
        width={Math.round(tamanho * 0.66)}
        height={Math.round(tamanho * 0.66)}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        referrerPolicy="no-referrer"
        onError={() => setFalhou(true)}
        className="object-contain"
        style={{
          width: Math.round(tamanho * 0.66),
          height: Math.round(tamanho * 0.66),
        }}
      />
    </span>
  );
}

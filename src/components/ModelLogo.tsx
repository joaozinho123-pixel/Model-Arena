"use client";

import { useState } from "react";

/**
 * Logótipo do fornecedor: URL de imagem verificada sobre pastilha
 * clara (legível no tema escuro), com fallback para avatar com
 * a inicial quando não há logótipo ou ele falha.
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
        className="logo-tilt relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black shadow-sm ring-2 ring-stone-900/10 transition-shadow hover:ring-stone-900/20"
        style={{
          width: tamanho,
          height: tamanho,
          background: `linear-gradient(135deg, ${cor} 0%, ${cor}55 130%)`,
          color: textoSobre(cor),
          fontSize: tamanho * 0.44,
          textShadow: "0 1px 6px rgba(0,0,0,0.45)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.5), transparent 55%)",
          }}
        />
        <span aria-hidden="true" className="relative">
          {inicial}
        </span>
      </span>
    );
  }

  return (
      <span
        aria-hidden="true"
        className="logo-tilt flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-stone-200 transition-shadow hover:ring-stone-300"
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

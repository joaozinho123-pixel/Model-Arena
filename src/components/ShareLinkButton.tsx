"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";

/**
 * Copia a ligação atual (ou uma construída) para a área de
 * transferência, com confirmação curta. Desativado sem `href`.
 */
export function ShareLinkButton({
  href,
  rotulo = "Partilhar",
  titulo = "Copiar ligação desta vista",
  className = "",
}: {
  href: string | null;
  rotulo?: string;
  titulo?: string;
  className?: string;
}) {
  const [copiada, setCopiada] = useState(false);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (tRef.current) clearTimeout(tRef.current);
    },
    [],
  );
  return (
    <button
      type="button"
      disabled={!href}
      onClick={() => {
        if (!href) return;
        const absoluta = href.startsWith("http")
          ? href
          : `${window.location.origin}${href.startsWith("/") ? "" : "/"}${href}`;
        navigator.clipboard?.writeText(absoluta).catch(() => {});
        setCopiada(true);
        if (tRef.current) clearTimeout(tRef.current);
        tRef.current = setTimeout(() => setCopiada(false), 1600);
      }}
      title={href ? titulo : "Escolha os dois modelos para partilhar"}
      aria-label={href ? titulo : "Indisponível até escolher os dois modelos"}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        copiada
          ? "text-emerald-600"
          : "text-zinc-500 hover:text-zinc-900"
      } ${className}`}
    >
      {copiada ? (
        <span className="pop-in flex items-center gap-1.5">
          <Check size={12} aria-hidden="true" />
          copiada
        </span>
      ) : (
        <>
          <Link2 size={12} aria-hidden="true" />
          {rotulo}
        </>
      )}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Botão de voltar ao topo: aparece depois de uma dobra de scroll,
 * some no início. Discreto, sem animações decorativas.
 */
export function BackToTop() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const aoScroll = () => setVisivel(window.scrollY > 800);
    aoScroll();
    window.addEventListener("scroll", aoScroll, { passive: true });
    return () => window.removeEventListener("scroll", aoScroll);
  }, []);
  return (
    <button
      type="button"
      hidden={!visivel}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      className="fixed bottom-5 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900"
    >
      <ArrowUp size={16} aria-hidden="true" />
    </button>
  );
}

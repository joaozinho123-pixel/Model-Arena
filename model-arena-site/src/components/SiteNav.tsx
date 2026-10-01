import type { ReactNode } from "react";
import { LogoMark } from "@/components/SiteLogo";

/** Links-âncora das secções da página inicial. */
const ANCORA_LINKS = [
  { href: "#comparar", rotulo: "Duelo" },
  { href: "#veredito", rotulo: "Veredito" },
  { href: "#analise", rotulo: "Análise" },
  { href: "#tempo-real", rotulo: "Tempo real" },
  { href: "#rankings", rotulo: "Rankings" },
  { href: "#catalogo", rotulo: "Catálogo" },
] as const;

/**
 * Navegação fixa partilhada: na página inicial ancora nas secções;
 * nas restantes, volta a "/" antes da âncora. Inclui sempre a
 * ligação para o Radar IA (/noticias).
 */
export function SiteNav({
  pagina,
  selo,
}: {
  pagina: "inicio" | "noticias";
  /** Conteúdo opcional à direita (ex.: data do snapshot). */
  selo?: ReactNode;
}) {
  const base = pagina === "inicio" ? "" : "/";
  return (
    <nav
      aria-label="Navegação principal"
      className="nav-glass fixed inset-x-0 top-0 z-40"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href={pagina === "inicio" ? "#top" : "/"}
          className="flex shrink-0 items-center gap-2 text-sm font-extrabold tracking-tight"
        >
          <LogoMark className="h-8 w-8 shrink-0" />
          <span className="hidden font-extrabold tracking-tight text-zinc-900 sm:inline">MODEL ARENA</span>
        </a>
        <ul className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto text-xs font-semibold text-stone-500 sm:gap-4 sm:text-[13px]">
          {ANCORA_LINKS.map(({ href, rotulo }) => (
            <li key={href} className="shrink-0">
              <a href={`${base}${href}`} className="nav-link whitespace-nowrap">
                {rotulo}
              </a>
            </li>
          ))}
          <li key="noticias" className="shrink-0">
            <a
              href="/noticias"
              aria-current={pagina === "noticias" ? "page" : undefined}
              className={`nav-link whitespace-nowrap ${
                pagina === "noticias" ? "font-extrabold text-indigo-700" : ""
              }`}
            >
              Notícias
            </a>
          </li>
        </ul>
        {selo ? (
          <div className="hidden shrink-0 md:block">{selo}</div>
        ) : null}
      </div>
    </nav>
  );
}

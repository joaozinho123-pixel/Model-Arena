import { LogoMark } from "@/components/SiteLogo";

/** Links-âncora das secções da página inicial. */
const ANCORA_LINKS = [
  { href: "#comparar", rotulo: "Duelo" },
  { href: "#veredito-titulo", rotulo: "Veredito" },
  { href: "#kicker-analise", rotulo: "Análise" },
  { href: "#kicker-rankings", rotulo: "Rankings" },
  { href: "#kicker-catalogo", rotulo: "Catálogo" },
] as const;

/**
 * Navegação fixa partilhada: na página inicial ancora nas secções;
 * nas restantes, volta a "/" antes da âncora. Inclui sempre a
 * ligação para o Radar IA (/noticias).
 */
export function SiteNav({
  pagina,
}: {
  pagina: "inicio" | "noticias" | "ficha";
}) {
  // Nas páginas não-iniciarias, anchors voltam a "/" antes da âncora.
  const base = pagina === "inicio" ? "" : "/";
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200 bg-white"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <a
          href={pagina === "inicio" ? "#top" : "/"}
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900"
        >
          <LogoMark className="h-7 w-7 shrink-0" />
          <span>Model Arena</span>
        </a>
        <ul className="flex min-w-0 flex-1 items-center justify-start gap-4 overflow-x-auto text-[13px] text-zinc-500 sm:justify-center sm:gap-5">
          {ANCORA_LINKS.map(({ href, rotulo }) => (
            <li key={href} className="shrink-0">
              <a href={`${base}${href}`} className="whitespace-nowrap transition-colors hover:text-zinc-900">
                {rotulo}
              </a>
            </li>
          ))}
          <li className="shrink-0">
            <a
              href="/noticias"
              aria-current={pagina === "noticias" ? "page" : undefined}
              className={`whitespace-nowrap transition-colors hover:text-zinc-900 ${
                pagina === "noticias" ? "font-semibold text-zinc-900" : ""
              }`}
            >
              Notícias
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

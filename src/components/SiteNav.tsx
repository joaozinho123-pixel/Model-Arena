import { LogoMark } from "@/components/SiteLogo";

/** Links-âncora das secções da página inicial. */
const ANCORA_LINKS = [
  { href: "#comparar", rotulo: "Duelo" },
  { href: "#veredito-titulo", rotulo: "Veredito" },
  { href: "#kicker-fichas", rotulo: "Fichas" },
  { href: "#kicker-graficos", rotulo: "Indicadores" },
  { href: "#kicker-tempo-real", rotulo: "Tempo real" },
] as const;

/** Páginas próprias (fora da home). */
const PAGINA_LINKS = [
  { href: "/rankings", rotulo: "Rankings", chave: "rankings" },
  { href: "/catalogo", rotulo: "Catálogo", chave: "catalogo" },
  { href: "/noticias", rotulo: "Notícias", chave: "noticias" },
] as const;

type Pagina = "inicio" | "rankings" | "catalogo" | "noticias" | "ficha";

/**
 * Navegação fixa partilhada: na página inicial ancora nas secções;
 * nas restantes, volta a "/" antes da âncora. Rankings, Catálogo e
 * Radar IA são páginas próprias do site.
 */
export function SiteNav({
  pagina,
}: {
  pagina: Pagina;
}) {
  // Nas páginas não-iniciarias, anchors voltam a "/" antes da âncora.
  const base = pagina === "inicio" ? "" : "/";
  const ativo = (chave: string) =>
    pagina === chave ? "font-semibold text-zinc-900" : "";
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
          {PAGINA_LINKS.map(({ href, rotulo, chave }) => (
            <li key={href} className="shrink-0">
              <a
                href={href}
                aria-current={pagina === chave ? "page" : undefined}
                className={`whitespace-nowrap transition-colors hover:text-zinc-900 ${ativo(chave)}`}
              >
                {rotulo}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

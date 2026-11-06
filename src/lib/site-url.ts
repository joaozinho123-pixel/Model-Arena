/**
 * Domínio público de produção, usado por robots, sitemap e metadados
 * (metadataBase/OG). Na Vercel, VERCEL_PROJECT_PRODUCTION_URL é
 * injetado em build; fora dela cai no project URL público do site.
 */
export const SITE_URL = `https://${
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "model-arena-beta.vercel.app"
}`;

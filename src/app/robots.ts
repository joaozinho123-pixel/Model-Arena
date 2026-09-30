import type { MetadataRoute } from "next";

/** TROCAR pelo domínio real em produção (ex.: https://seudominio.com). */
const SITE_URL = "https://example.com";

/** Robôs: indexação total das páginas públicas (sem áreas privadas). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

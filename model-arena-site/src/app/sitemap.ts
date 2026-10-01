import type { MetadataRoute } from "next";

/** TROCAR pelo domínio real em produção (ex.: https://seudominio.com). */
const SITE_URL = "https://example.com";

/** URLs públicas oficiais para indexação (sem temporários nem APIs). */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: agora },
    { url: `${SITE_URL}/noticias`, lastModified: agora },
  ];
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { AI_MODELS } from "@/data/models";

/** URLs públicas oficiais para indexação (sem temporários nem APIs). */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  // Fichas dos 60 modelos com melhor dados públicos (SEO útil sem inflar).
  const fichas: MetadataRoute.Sitemap = AI_MODELS.filter(
    (m) => m.fonte !== "estimativa" && m.rank <= 60,
  ).map((m) => ({
    url: `${SITE_URL}/modelo/${m.id}`,
    lastModified: agora,
  }));
  return [
    { url: `${SITE_URL}/`, lastModified: agora },
    { url: `${SITE_URL}/rankings`, lastModified: agora },
    { url: `${SITE_URL}/catalogo`, lastModified: agora },
    { url: `${SITE_URL}/imagens`, lastModified: agora },
    { url: `${SITE_URL}/noticias`, lastModified: agora },
    ...fichas,
  ];
}

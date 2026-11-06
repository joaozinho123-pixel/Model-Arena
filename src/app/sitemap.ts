import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** URLs públicas oficiais para indexação (sem temporários nem APIs). */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: agora },
    { url: `${SITE_URL}/noticias`, lastModified: agora },
  ];
}

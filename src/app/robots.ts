import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** Robôs: indexação total das páginas públicas (sem áreas privadas). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

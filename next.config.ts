import type { NextConfig } from "next";

/**
 * Endurecimento de respostas HTTP.
 *
 * CSP desenhada para EXATAMENTE o que o app usa (sem quebrar nada):
 * - scripts/estilos próprios + inline do Next.js/Recharts (sem
 *   scripts externos — XSS via <script src> bloqueado);
 * - imagens APENAS dos 2 CDNs de logótipos de marca usados
 *   (simpleicons + unavatar) — sem wildcard https:, bloqueia
 *   rastreio por pixels e carga de imagens de origem arbitrária;
 * - fetch só para as APIs públicas consumidas (OpenRouter, HN, Dev.to);
 * - sem frames/objectos (anti-clickjacking, com X-Frame-Options).
 *
 * NÃO ativados de propósito: COEP/CORP (bloqueariam imagens e fetch
 * cross-origin que o app precisa) — documentado no relatório.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://cdn.simpleicons.org https://unavatar.io",
  "font-src 'self'",
  "connect-src 'self' https://openrouter.ai https://hn.algolia.com https://dev.to",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Não expõe o framework nos cabeçalhos (#20).
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Normas de segurança para todo o site.
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        // Proxies de dados: fora do índice de motores de busca.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

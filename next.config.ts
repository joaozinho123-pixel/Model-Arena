import type { NextConfig } from "next";

/**
 * Endurecimento de respostas HTTP.
 *
 * CSP desenhada para EXATAMENTE o que o app usa (sem quebrar nada):
 * - scripts/estilos próprios + inline do Next.js/Recharts (sem
 *   scripts externos — XSS via <script src> bloqueado);
 * - imagens de qualquer https (logótipos remotos dos fornecedores);
 * - fetch só para as APIs públicas consumidas (OpenRouter, HN, Dev.to);
 * - áudio só do host do som surpresa (myinstants);
 * - sem frames/objectos (anti-clickjacking, com X-Frame-Options).
 *
 * NÃO ativados de propósito: COEP/CORP (bloqueariam imagens e fetch
 * cross-origin que o app precisa) — documentado no relatório.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://openrouter.ai https://hn.algolia.com https://dev.to",
  "media-src 'self' https://www.myinstants.com",
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
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
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
    ];
  },
};

export default nextConfig;

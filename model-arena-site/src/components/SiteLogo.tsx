/**
 * Marca Model Arena em SVG inline (sem ficheiros de imagem):
 * hexágono de arena em azul-marinho, rede interna e chevrons
 * de confronto em ciano, com brilho central. Escalável para
 * nav, hero e favicon — 100% pronta para deploy.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id="ma-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon
        points="32,4 7.8,18 7.8,46 32,60 56.2,46 56.2,18"
        stroke="#1e40af"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <polygon
        points="32,13 15.5,22.5 15.5,41.5 32,51 48.5,41.5 48.5,22.5"
        stroke="#06b6d4"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="20.5"
        x2="52"
        y2="43.5"
        stroke="#1e40af"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="52"
        y1="20.5"
        x2="12"
        y2="43.5"
        stroke="#1e40af"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="26,24 33,32 26,40"
        stroke="#0891b2"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="38,24 31,32 38,40"
        stroke="#0891b2"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="5" fill="url(#ma-glow)" />
    </svg>
  );
}

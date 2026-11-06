/**
 * Marca Model Arena em SVG inline: quadrado arredondado em tinta
 * cheia com dois chevrons brancos que convergem para o centro —
 * o duelo A vs B. Crispa em 16px (favicon) e 28px (nav).
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
      <rect x="3" y="3" width="58" height="58" rx="15" fill="#18181b" />
      <polyline
        points="27,21 16,32 27,43"
        stroke="#ffffff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="37,21 48,32 37,43"
        stroke="#ffffff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="4" fill="#818cf8" />
    </svg>
  );
}

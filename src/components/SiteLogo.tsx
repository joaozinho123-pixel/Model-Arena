/**
 * Marca Model Arena em SVG inline: hexágono de arena + dois
 * chevrons de confronto. Monocromática, escalável para nav,
 * hero e favicon.
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
      <polygon
        points="32,5 8,18.5 8,45.5 32,59 56,45.5 56,18.5"
        stroke="#18181b"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <polyline
        points="27.5,24 20.5,32 27.5,40"
        stroke="#4f46e5"
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="36.5,24 43.5,32 36.5,40"
        stroke="#4f46e5"
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

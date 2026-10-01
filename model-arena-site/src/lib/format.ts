/** Formatação pt-PT de preços, contexto e modalidades. */

/** Preço em US$ por 1M de tokens; 0 = grátis. */
export function formatPrice(value: number): string {
  if (!value || value <= 0) return "Grátis";
  if (value >= 100) return `US$ ${trimZeros(value.toFixed(0))}`;
  if (value >= 1) return `US$ ${trimZeros(value.toFixed(2))}`;
  return `US$ ${trimZeros(value.toFixed(3))}`;
}

function trimZeros(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

/** Janela de contexto: 1048576 -> "1M"; 262144 -> "262 mil". */
export function formatContext(tokens: number): string {
  if (!tokens || tokens <= 0) return "—";
  if (tokens >= 1_000_000) {
    const v = tokens / 1_000_000;
    return `${v.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}M`;
  }
  if (tokens >= 1_000) {
    const v = tokens / 1_000;
    return `${v.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} mil`;
  }
  return tokens.toLocaleString("pt-PT");
}

/** Rótulo pt-PT das modalidades do OpenRouter. */
const MODALITY_LABELS: Record<string, string> = {
  text: "Texto",
  image: "Imagem",
  audio: "Áudio",
  video: "Vídeo",
  file: "Ficheiros",
};

export function modalityLabel(modality: string): string {
  return MODALITY_LABELS[modality.toLowerCase()] ?? modality;
}

/** Elo com agrupamento pt-PT: 1533 -> "1 533". */
export function formatElo(elo: number): string {
  return Math.round(elo).toLocaleString("pt-PT", { maximumFractionDigits: 0 });
}

/** Throughput: 44 -> "44,0 tok/s". */
export function formatTokS(v: number): string {
  return `${v.toLocaleString("pt-PT", { maximumFractionDigits: 1 })} tok/s`;
}

/** Latência em ms -> "4,85 s". */
export function formatSegundos(ms: number): string {
  return `${(ms / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 2 })} s`;
}

/** Win rate 0-100 -> "99%". */
export function formatWinRate(v: number): string {
  return `${Math.round(v)}%`;
}

/** Contagem compacta pt-PT: 4927006 -> "4,9M"; 14281 -> "14,3 mil". */
export function formatCompact(v: number): string {
  if (!Number.isFinite(v) || v < 0) return "—";
  if (v >= 1_000_000) {
    return `${(Math.round((v / 1_000_000) * 10) / 10).toLocaleString("pt-PT")}M`;
  }
  if (v >= 1_000) {
    return `${(Math.round((v / 1_000) * 10) / 10).toLocaleString("pt-PT")} mil`;
  }
  return `${Math.round(v)}`;
}

/** Licença legível: "apache-2.0" -> "Apache 2.0". */
export function prettyLicense(lic: string | null | undefined): string | null {
  if (!lic || lic.toLowerCase() === "other" || lic.toLowerCase() === "unknown") {
    return null;
  }
  return lic
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

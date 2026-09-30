"use client";

import { useRef, useState } from "react";

const SOM_URL =
  "https://www.myinstants.com/media/sounds/verity-obesity-falsity-moggity.mp3";
const PAGINA_URL =
  "https://www.myinstants.com/instant/verity-obesity-falsity-moggity-23106/";

/**
 * Troll button escondido: parece o selo "VS" normal, mas ao clicar
 * toca o som surpresa de imediato. Se o áudio falhar, abre a página
 * do botão como fallback.
 */
export function TrollButton() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);

  const trollar = () => {
    const fallback = () => {
      setTocando(false);
      window.open(PAGINA_URL, "_blank", "noopener");
    };
    try {
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio(SOM_URL);
        audio.preload = "auto";
        audio.onended = () => setTocando(false);
        audio.onerror = fallback;
        audioRef.current = audio;
        // Expõe para QA automatizado.
        (window as unknown as { __trollAudio?: HTMLAudioElement }).__trollAudio =
          audio;
      } else if (audio.readyState > 0) {
        // Só reposiciona se já há metadados (evita InvalidStateError).
        try {
          audio.currentTime = 0;
        } catch {
          /* ignora: toca do início na mesma */
        }
      }
      setTocando(true);
      audio.play().catch(fallback);
    } catch {
      fallback();
    }
  };

  return (
    <button
      type="button"
      onClick={trollar}
      aria-label="Versus"
      title="VS — dizem que este botão morde…"
      data-troll={tocando ? "playing" : "idle"}
      className={`vs-pulse flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 text-sm font-black text-white shadow-lg shadow-zinc-900/20 transition active:scale-90 ${
        tocando ? "troll-shake" : ""
      }`}
    >
      VS
    </button>
  );
}

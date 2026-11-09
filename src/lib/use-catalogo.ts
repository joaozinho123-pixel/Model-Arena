"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AI_MODELS,
  DATA_COUNT_TOTAL,
  DATA_GENERATED_AT,
  RAW_MODELSDEV,
  buildCatalogo,
  buildProviderOptions,
} from "@/data/models";
import {
  buscarAaVivo,
  buscarCatalogoVivo,
  type AaVivo,
  type CatalogoVivo,
} from "@/lib/catalogo-vivo";

/**
 * Catálogo efetivo do site: snapshot embutido fundido com o catálogo
 * OpenRouter ao vivo e os índices AA ao vivo (nossa rota). Falha
 * graciosa em ambos — a UI mantém os dados embutidos.
 *
 * Partilhado pela home, /rankings e /catalogo para os três mostrarem
 * exactamente os mesmos modelos.
 */
export function useCatalogo() {
  const [vivo, setVivo] = useState<CatalogoVivo | null>(null);
  const [aaVivo, setAaVivo] = useState<AaVivo | null>(null);
  const [aoVivo, setAoVivo] = useState(false);
  useEffect(() => {
    let ativo = true;
    buscarCatalogoVivo().then((snap) => {
      if (!ativo || !snap) return;
      setVivo(snap);
      setAoVivo(true);
    });
    buscarAaVivo().then((aa) => {
      if (ativo && aa) setAaVivo(aa);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const catalogo = useMemo(
    () =>
      vivo
        ? buildCatalogo([...vivo.raw, ...RAW_MODELSDEV], aaVivo?.ratings)
        : { models: AI_MODELS, total: DATA_COUNT_TOTAL },
    [vivo, aaVivo],
  );
  const modelos = catalogo.models;
  const porId = useMemo(
    () => Object.fromEntries(modelos.map((m) => [m.id, m])),
    [modelos],
  );
  const opcoesFornecedor = useMemo(
    () => buildProviderOptions(modelos),
    [modelos],
  );
  const geradoEm = vivo?.generatedAt ?? DATA_GENERATED_AT;
  return { modelos, porId, opcoesFornecedor, aoVivo, geradoEm };
}

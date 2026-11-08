/**
 * Cria `src/data/aa-media.json` (modelos de imagem da Artificial
 * Analysis) e `src/data/descricoes-media.json` a partir da captura
 * da rota temporária /api/aa-media.
 *
 * Uso: node scripts/criar-aa-media.mjs <captura.json>
 * Só factos reais da captura (nome, criador, Elo, ci_95). Sem
 * correspondência de criador no registo testado: avatar com
 * inicial, nunca logótipo inventado.
 */
import fs from "node:fs";

const captura = process.argv[2];
if (!captura) {
  console.error("uso: node scripts/criar-aa-media.mjs <captura.json>");
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(captura, "utf8"));

/** Criadores com URL de logótipo já testada no registo do site. */
const LOGOS_TESTADOS = {
  OpenAI: "https://unavatar.io/openai.com?fallback=false",
  Google: "https://cdn.simpleicons.org/google",
  "Microsoft AI": "https://unavatar.io/microsoft.com?fallback=false",
  NVIDIA: "https://cdn.simpleicons.org/nvidia",
  Baidu: "https://cdn.simpleicons.org/baidu",
  Tencent: "https://unavatar.io/tencent.com?fallback=false",
  "ByteDance Seed": "https://cdn.simpleicons.org/bytedance",
  Bytedance: "https://cdn.simpleicons.org/bytedance",
  Meta: "https://cdn.simpleicons.org/meta",
  StepFun: "https://unavatar.io/stepfun.com?fallback=false",
  Meituan: "https://cdn.simpleicons.org/meituan",
  "Z AI": "https://unavatar.io/z.ai?fallback=false",
};

/** Paleta de cores para avatares (apresentação, não dados). */
const PALETA = [
  "#D97757", "#4285F4", "#7C3AED", "#059669", "#FF7000",
  "#EAB308", "#EC4899", "#0EA5E9", "#F43F5E", "#8B5CF6",
  "#76B900", "#00A4EF", "#0F62FE", "#CA8A04", "#475569",
];
function corDe(nome) {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.codePointAt(0)) % 100000;
  return PALETA[h % PALETA.length];
}

/** Fusão por id: geração e edição do MESMO modelo ficam juntas. */
const porId = new Map();
const add = (r, campo, elo, ci) => {
  const atual =
    porId.get(r.id) ??
    {
      id: r.id,
      nome: String(r.name ?? r.id),
      criador: r.model_creator?.name ?? "Desconhecido",
      eloT2i: null,
      ciT2i: null,
      eloIee: null,
      ciIee: null,
    };
  atual[campo] = typeof elo === "number" ? elo : null;
  atual[ci] = typeof r.ci_95 === "number" ? r.ci_95 : null;
  porId.set(r.id, atual);
};
for (const r of j.t2i ?? []) add(r, "eloT2i", r.elo, "ciT2i");
for (const r of j.iee ?? []) add(r, "eloIee", r.elo, "ciIee");

const modelos = [...porId.values()].map((m) => ({
  ...m,
  logo: LOGOS_TESTADOS[m.criador],
  cor: corDe(m.criador),
}));

// Rankings por capacidade (Elo desc; empates por nome).
const porT2i = modelos
  .filter((m) => m.eloT2i != null)
  .sort((a, b) => b.eloT2i - a.eloT2i || a.nome.localeCompare(b.nome));
const porIee = modelos
  .filter((m) => m.eloIee != null)
  .sort((a, b) => b.eloIee - a.eloIee || a.nome.localeCompare(b.nome));
porT2i.forEach((m, i) => {
  m.rankT2i = i + 1;
});
porIee.forEach((m, i) => {
  m.rankIee = i + 1;
});

// Ordem da página: melhor Elo disponível primeiro.
modelos.sort((a, b) => {
  const ma = Math.max(a.eloT2i ?? 0, a.eloIee ?? 0);
  const mb = Math.max(b.eloT2i ?? 0, b.eloIee ?? 0);
  return mb - ma || a.nome.localeCompare(b.nome);
});

/** Descrição composta: criador + papéis + valores reais da captura. */
function papel(m) {
  if (m.eloT2i != null && m.eloIee != null) return "geração e edição de imagens";
  if (m.eloT2i != null) return "geração de imagens a partir de texto";
  return "edição de imagens por instrução";
}
function descricaoDe(m) {
  const partes = [];
  if (m.eloT2i != null)
    partes.push(
      `Elo de ${m.eloT2i.toLocaleString("pt-PT")} em geração${
        m.ciT2i != null ? ` (±${m.ciT2i})` : ""
      }`,
    );
  if (m.eloIee != null)
    partes.push(
      `Elo de ${m.eloIee.toLocaleString("pt-PT")} em edição${
        m.ciIee != null ? ` (±${m.ciIee})` : ""
      }`,
    );
  return `Modelo de imagem da ${m.criador} — ${papel(m)}, medido pela Artificial Analysis. ${partes.join(" · ")}.`;
}

const descricoes = {};
for (const m of modelos) descricoes[m.id] = { descricao: descricaoDe(m) };

fs.writeFileSync(
  "src/data/aa-media.json",
  `${JSON.stringify(
    {
      generatedAt: j.generatedAt ?? new Date().toISOString(),
      fonte: "Artificial Analysis V2 (/media/text-to-image + /media/image-editing)",
      modelos,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
fs.writeFileSync(
  "src/data/descricoes-media.json",
  `${JSON.stringify(descricoes, null, 2)}\n`,
  "utf8",
);

console.log(
  `OK: ${modelos.length} modelos de imagem · t2i: ${porT2i.length} · iee: ${porIee.length} · ambos: ${
    modelos.filter((m) => m.eloT2i != null && m.eloIee != null).length
  }`,
);

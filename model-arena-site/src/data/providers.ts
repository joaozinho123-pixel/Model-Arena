/**
 * Metadados dos fornecedores: nome de exibição, URL verificada do
 * logótipo e cor de destaque. Só constam URLs testadas (HTTP 200 com
 * bytes de imagem reais e a carregar no browser — favicons diretos
 * falham por proteção anti-hotlink, por isso passam pelo unavatar) —
 * fornecedores sem `logo` usam avatar com inicial, nunca um ícone
 * genérico.
 */
export interface ProviderMeta {
  nome: string;
  /** URL direta do logótipo; omitida = avatar com inicial. */
  logo?: string;
  cor: string;
}

/** Ícone de marca (SVG) do CDN simpleicons — 404 limpo quando não há. */
const SIMPLE = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

/** Logótipo via agregador unavatar — 404 limpo com fallback=false. */
const AVATAR = (domain: string) => `https://unavatar.io/${domain}?fallback=false`;

export const PROVIDER_META: Record<string, ProviderMeta> = {
  anthropic: { nome: "Anthropic", logo: SIMPLE("anthropic"), cor: "#D97757" },
  openai: {
    nome: "OpenAI",
    logo: "https://unavatar.io/openai.com?fallback=false",
    cor: "#E4E4E7",
  },
  google: { nome: "Google", logo: SIMPLE("google"), cor: "#4285F4" },
  "x-ai": { nome: "xAI", logo: SIMPLE("x"), cor: "#A1A1AA" },
  deepseek: { nome: "DeepSeek", logo: SIMPLE("deepseek"), cor: "#7C3AED" },
  "meta-llama": { nome: "Meta Llama", logo: SIMPLE("meta"), cor: "#0866FF" },
  meta: { nome: "Meta", logo: SIMPLE("meta"), cor: "#0866FF" },
  mistralai: { nome: "Mistral AI", logo: SIMPLE("mistralai"), cor: "#FF7000" },
  moonshotai: { nome: "Moonshot AI", logo: SIMPLE("moonshotai"), cor: "#EAB308" },
  qwen: { nome: "Qwen", logo: SIMPLE("qwen"), cor: "#6D28D9" },
  microsoft: {
    nome: "Microsoft",
    logo: AVATAR("microsoft.com"),
    cor: "#00A4EF",
  },
  nvidia: { nome: "NVIDIA", logo: SIMPLE("nvidia"), cor: "#76B900" },
  amazon: {
    nome: "AWS",
    logo: AVATAR("amazon.com"),
    cor: "#FF9900",
  },
  perplexity: { nome: "Perplexity", logo: SIMPLE("perplexity"), cor: "#20808D" },
  "ibm-granite": {
    nome: "IBM",
    logo: AVATAR("ibm.com"),
    cor: "#0F62FE",
  },
  "arcee-ai": {
    nome: "Arcee AI",
    logo: AVATAR("arcee.ai"),
    cor: "#F43F5E",
  },
  minimax: { nome: "MiniMax", logo: SIMPLE("minimax"), cor: "#EC4899" },
  baidu: { nome: "Baidu", logo: SIMPLE("baidu"), cor: "#1D4ED8" },
  bytedance: { nome: "ByteDance", logo: SIMPLE("bytedance"), cor: "#475569" },
  "bytedance-seed": {
    nome: "ByteDance Seed",
    logo: SIMPLE("bytedance"),
    cor: "#475569",
  },
  meituan: { nome: "Meituan", logo: SIMPLE("meituan"), cor: "#CA8A04" },
  xiaomi: { nome: "Xiaomi", logo: SIMPLE("xiaomi"), cor: "#FF6900" },
  openrouter: { nome: "OpenRouter", logo: SIMPLE("openrouter"), cor: "#A3E635" },
  fireworks: {
    nome: "Fireworks",
    logo: AVATAR("fireworks.ai"),
    cor: "#F43F5E",
  },
  "z-ai": { nome: "Zhipu", logo: AVATAR("z.ai"), cor: "#2563EB" },
  tencent: {
    nome: "Tencent",
    logo: AVATAR("tencent.com"),
    cor: "#0052D9",
  },
  cohere: {
    nome: "Cohere",
    logo: AVATAR("cohere.com"),
    cor: "#059669",
  },
  upstage: { nome: "Upstage", logo: AVATAR("upstage.ai"), cor: "#4F46E5" },
  rekaai: { nome: "Reka", logo: AVATAR("reka.ai"), cor: "#0EA5E9" },
  stepfun: { nome: "StepFun", logo: AVATAR("stepfun.com"), cor: "#8B5CF6" },
  writer: {
    nome: "Writer",
    logo: AVATAR("writer.com"),
    cor: "#52525B",
  },
  nousresearch: {
    nome: "Nous Research",
    logo: AVATAR("nousresearch.com"),
    cor: "#A1A1AA",
  },
  thinkingmachines: {
    nome: "Thinking Machines",
    logo: AVATAR("thinkingmachines.ai"),
    cor: "#A1A1AA",
  },
  inception: {
    nome: "Inception",
    logo: AVATAR("inception.ai"),
    cor: "#22D3EE",
  },
  liquid: {
    nome: "Liquid AI",
    logo: AVATAR("liquid.ai"),
    cor: "#22D3EE",
  },
  kwaipilot: { nome: "KwaiPilot", logo: SIMPLE("kuaishou"), cor: "#F43F5E" },
  poolside: {
    nome: "Poolside",
    logo: AVATAR("poolside.ai"),
    cor: "#F59E0B",
  },
  relace: { nome: "Relace", logo: AVATAR("relace.ai"), cor: "#34D399" },
  sakana: {
    nome: "Sakana AI",
    logo: AVATAR("sakana.ai"),
    cor: "#FB7185",
  },
  mancer: {
    nome: "Mancer",
    logo: AVATAR("mancer.app"),
    cor: "#A1A1AA",
  },
  // Fornecedores novos/comunitários sem ícone verificado: avatar com inicial.
  stealth: { nome: "Stealth", cor: "#A1A1AA" },
  typesafe: { nome: "Typesafe", cor: "#A1A1AA" },
  inclusionai: { nome: "Inclusion AI", cor: "#A1A1AA" },
  "anthracite-org": { nome: "Anthracite", cor: "#A1A1AA" },
  "aion-labs": { nome: "Aion Labs", cor: "#A1A1AA" },
  "dots-studio": { nome: "Dots Studio", cor: "#A1A1AA" },
  morph: { nome: "Morph", cor: "#A1A1AA" },
  "nex-agi": { nome: "NEX AGI", cor: "#A1A1AA" },
  "inference-net": { nome: "InferenceNet", cor: "#A1A1AA" },
  perceptron: { nome: "Perceptron", cor: "#A1A1AA" },
  "prism-ml": { nome: "Prism ML", cor: "#A1A1AA" },
  unbiased: { nome: "Unbiased", cor: "#A1A1AA" },
  undi95: { nome: "Undi95", cor: "#A1A1AA" },
  sao10k: { nome: "Sao10K", cor: "#A1A1AA" },
  thedrummer: { nome: "TheDrummer", cor: "#A1A1AA" },
  gryphe: { nome: "Gryphe", cor: "#A1A1AA" },
  cognitivecomputations: { nome: "Cognitive Computations", cor: "#A1A1AA" },
};

/** Normaliza o slug do fornecedor (remove o prefixo "~" dos aliases). */
export function normalizeProvider(provider: string): string {
  return provider.startsWith("~") ? provider.slice(1) : provider;
}

/** Nome de exibição do fornecedor, com fallback para slugs desconhecidos. */
export function providerDisplayName(provider: string): string {
  const slug = normalizeProvider(provider);
  const meta = PROVIDER_META[slug];
  if (meta) return meta.nome;
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** URL verificada do logótipo ou undefined (avatar com inicial). */
export function providerLogoUrl(provider: string): string | undefined {
  return PROVIDER_META[normalizeProvider(provider)]?.logo;
}

/**
 * Logótipo ao nível do modelo: usa o sparkle oficial do Gemini para
 * modelos Gemini (o "G" genérico do Google continua nos restantes).
 * Só com correspondência exata no id — sem adivinhar.
 */
export function modelLogoUrl(provider: string, id: string): string | undefined {
  if (normalizeProvider(provider) === "google" && /gemini/i.test(id)) {
    return SIMPLE("googlegemini");
  }
  return providerLogoUrl(provider);
}

/** Cor de destaque do fornecedor (fallback cinza). */
export function providerColor(provider: string): string {
  return PROVIDER_META[normalizeProvider(provider)]?.cor ?? "#71717A";
}

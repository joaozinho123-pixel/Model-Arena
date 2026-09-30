# Model Arena 🥊

Comparador de modelos de IA lado a lado — código, texto, imagem, raciocínio
matemático, velocidade, preço e contexto — com **benchmarks reais** e zero
notas inventadas. Cada quesito exibe o valor **nativo** da fonte
(índices Artificial Analysis, Elo LMArena/Design Arena); travessão significa
ausência de dado público.

## ✨ Funcionalidades

- **Duelo A/B**: escolha dois modelos (pesquisa, catálogo, rankings ou
  atalhos), troque os lados ou sorteie um duelo aleatório — a escolha
  persiste no navegador (`localStorage`).
- **Veredito com placar**: vitórias por quesito em métricas comparáveis
  (mesma origem), com empates e "sem confronto" tratados corretamente.
- **Tabela analítica**: valores nativos + vantagens económicas (preço,
  contexto) contabilizadas em separado.
- **Rankings do catálogo**: melhor benchmark, menor preço e maior contexto.
- **Desempenho em tempo real**: latência/produtividade p50, fornecedores e
  uptime via API pública do OpenRouter (com retry gracioso).
- **Radar IA** (`/noticias`): notícias do mundo da IA via Hacker News
  (Algolia) e Dev.to, com pesquisa e filtros por fonte.
- **Catálogo ao vivo**: preços, contexto e novidades atualizados
  automaticamente da API do OpenRouter a cada visita (com fallback para o
  snapshot embutido).
- Tema claro profissional, animações CSS com `prefers-reduced-motion`,
  navegação por teclado e layout responsivo.

## 🛠️ Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Recharts · Lucide · Geist/Inter (next/font).

## 🚀 Como correr localmente

Pré-requisitos: **Node.js 20+** (recomendado LTS) e npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

No Windows, pode usar o lançador da pasta raiz (`iniciar-model-arena.bat`),
que instala as dependências na primeira execução e abre o site.

```bash
npm run build      # valida TypeScript + gera build de produção
npm run start      # serve o build (com headers de segurança)
npm run lint       # ESLint
```

## 🔑 Variáveis de ambiente

Copie `.env.example` para `.env` (ignorado pelo git — **nunca** commitar
valores reais):

```bash
AA_API_KEY=...     # opcional; só para atualizar os índices AA (npm run aa:fetch)
```

Sem chave, o site usa o snapshot AA embutido em `src/data/aa-ratings.json`.

## 📊 Dados e scripts

| Comando | Fonte | Saída |
|---|---|---|
| `npm run models:fetch` | OpenRouter `/api/v1/models` (público) | `src/data/openrouter-models.json` |
| `AA_API_KEY=… npm run aa:fetch` | Artificial Analysis (requer chave) | `src/data/aa-ratings.json` |
| `npm run hf:fetch` | Hugging Face (público) | `src/data/hf-stats.json` |
| `npm run arena:fetch` | Dataset `lmarena-ai/leaderboard-dataset` | `src/data/arena-raw.json` |
| `npm run arena:build` | Cruza arena bruta × catálogo | `src/data/arena-ratings.json` |

Regras de qualidade dos dados (ver `scripts/`):

- Correspondência **exata** de modelos; sem correspondência, sem dados.
- Elo vs índice **nunca** se comparam (unidades diferentes).
- Preços sentinela negativos (roteadores) são excluídos do catálogo.
- Ranking geral por índice AA de Inteligência; modelos sem índice,
  pelo Elo LMArena.

## 📁 Estrutura

```
src/
  app/            # rotas: / (arena), /noticias (Radar IA), robots, sitemap
  components/     # UI (dossier, tabela, rankings, catálogo, picker…)
  data/           # snapshots JSON + merge (models.ts) + fornecedores
  hooks/          # useCountUp
  lib/            # comparar, format, endpoints, catalogo-vivo, noticias
  types/          # AIModel e tipos de benchmark
scripts/          # fetchs + match (Node, sem dependências externas)
public/           # icon.svg, manifest.webmanifest, humans.txt
```

## 🔒 Segurança

- Headers via `next.config.ts`: CSP sob medida, HSTS, `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP; sem
  `X-Powered-By`.
- Sem `dangerouslySetInnerHTML`/`eval`, sem segredos no código, só HTTPS,
  links externos com `rel="noopener noreferrer"`, `npm audit` limpo.
- `robots.txt`, `sitemap.xml`, `humans.txt`, `manifest` e 404 próprio incluídos.
- Pendente do dono: domínio real em `robots.ts`/`sitemap.ts`, e-mail em
  `/.well-known/security.txt`, TLS/WAF no provedor de hospedagem.

## ☁️ Deploy

Qualquer hospedagem Next.js (ex.: Vercel) com `npm run build`. Os headers de
`next.config.ts` aplicam-se automaticamente. Sem variáveis obrigatórias.

### 🔑 Chaves de API no deploy (garantias)

- **O visitante não precisa de nenhuma chave**: no navegador só correm
  chamadas a APIs públicas sem autenticação (OpenRouter, Hacker
  News/Algolia, Dev.to) e à nossa própria rota `/api/aa/ratings`
  (same-origin) — cada visitante usa a própria conexão, sem quota sua.
- **Sua chave AA nunca é exposta**: vive SÓ no servidor, lida via
  `process.env.AA_API_KEY` (sem prefixo `NEXT_PUBLIC_*`) em
  `src/app/api/aa/ratings/route.ts`, que a usa para chamar a AA e
  devolve APENAS os benchmarks cruzados. Proteções: URLs a montante
  fixas (sem SSRF), cache 6h + `s-maxage` na CDN, rate limit por IP
  (30 req/min → 429), erros genéricos 503/502/429, sem logs da chave.
- **Vincular a chave (1 vez, 30 segundos, só você)**: a chave NUNCA vai
  no código nem no GitHub (lá ela vazaría em minutos) — ela mora SÓ no
  painel da hospedagem, que o visitante nunca vê:
  1. Abra o dashboard da hospedagem (ex.: Vercel → seu projeto →
     **Settings → Environment Variables**).
  2. Adicione a variável `AA_API_KEY` com a sua chave e salve
     (marque Production; redeploy se o painel pedir).
  3. Pronto para sempre: o site passa a buscar os índices AA ao vivo
     no servidor (cache de 6h) e o selo do hero mostra
     **"AA em tempo real"**. Nenhum visitante configura nada, nunca.
  Sem chave, a rota devolve 503 e o site usa o snapshot embutido —
  nada quebra.
- **Atualizar snapshots**: `AA_API_KEY=… npm run aa:fetch` (e demais
  scripts em [Dados e scripts](#-dados-e-scripts)), depois redeploy.
- Verificado por auditoria: zero `process.env`/`NEXT_PUBLIC_*` no código
  cliente, zero ocorrências da chave no código e no build (`.next/`),
  `.env` ignorado pelo git.

## 📄 Licença

[MIT](./LICENSE) © 2026 joaozinho123-pixel — ver o ficheiro `LICENSE`.

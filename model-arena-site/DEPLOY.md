# 🚀 Publicar o Model Arena (GitHub + Vercel)

Guia em 10 minutos. A raiz desta pasta **JÁ É** o projeto Next.js
(`package.json` + `src/app` aqui mesmo) — não mude a estrutura.

## 1. Subir para o GitHub (uma vez)

```bash
# dentro desta pasta:
git init            # só se ainda não for um repositório
git add -A
git commit -m "Model Arena: app completo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

> Confira no GitHub (web) se as pastas `src/app`, `src/components`,
> `src/data` e o arquivo `package.json` aparecem na raiz do repositório.
> Se faltarem, o deploy vai falhar — repita o `git add -A`.

## 2. Importar na Vercel (uma vez)

1. [vercel.com](https://vercel.com) → **Add New → Project** → **Import** o repositório.
2. **Framework Preset**: `Next.js` (detectado sozinho).
3. **Root Directory**: deixe vazio/padrão (o app está na raiz) ⚠️ só mude
   se o seu repositório tiver o app dentro de uma subpasta.
4. **Build Command**: padrão (vazio ou `npm run build`). Não use outro.
5. **Environment Variables** → Add: nome `AA_API_KEY`, valor a sua chave
   (marque **Production**). Sem ela o site funciona igual, mas com os
   dados AA do snapshot embutido em vez de tempo real.
6. **Deploy**.

## 3. Conferir que deu certo

- A página abre sem erro e o selo do hero mostra
  **"Catálogo ao vivo"** (+ **"AA em tempo real"** se configurou a chave).
- `https://SEU-DOMINIO/robots.txt` e `/sitemap.xml` respondem 200.
- DevTools → Network: nenhum `4xx/5xx` exceto o opcional `429` sob abuso.

## 4. Atualizar depois

```bash
git add -A && git commit -m "atualização" && git push
```

A Vercel faz redeploy sozinho a cada push na branch principal.

## 🔑 Regras da chave (importante)

- A chave **NUNCA** vai no código, no Git ou no `.env` commitado —
  só no painel **Environment Variables** da Vercel (e no `.env` local,
  que o `.gitignore` bloqueia).
- Visitantes **nunca** precisam de chave: o navegador deles só fala com
  APIs públicas (OpenRouter, Hacker News, Dev.to) e com a nossa rota
  `/api/aa/ratings`, que usa a SUA chave no servidor com cache de 6h
  e limite de 30 req/min por IP.

## 🆘 Se falhar com "couldn't find pages or app"

1. Confira no GitHub se `src/app/page.tsx` existe no repositório;
2. Confira o **Root Directory** (item 2.3 acima);
3. Confira se o **Build Command** está padrão (sem `vercel-build` custom).

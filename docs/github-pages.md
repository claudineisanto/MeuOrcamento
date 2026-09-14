# Publicação gratuita da PWA no GitHub Pages

Este projeto já está preparado para publicar a versão web/PWA no GitHub Pages.

## O que já foi configurado

- `app.config.ts` aplica `baseUrl` automaticamente no build de produção.
- `scripts/prepare-web-build.js` ajusta `manifest.json` e `sw.js` para a URL correta do Pages.
- `scripts/prepare-github-pages-dist.js` cria URLs amigáveis como `/profile/` e um `404.html` de fallback.
- `.github/workflows/deploy-gh-pages.yml` faz o build e deploy automático.

## Passo único no GitHub

1. Envie o projeto para um repositório no GitHub.
2. No repositório, abra `Settings > Pages`.
3. Em `Source`, selecione `GitHub Actions`.

Depois disso, cada `push` na branch `main` ou `master` publica a PWA automaticamente.

## Scripts locais úteis

```bash
npm run build:web
```

Gera o build web padrão em `dist`.

```bash
npm run serve:web:dist
```

Gera o build web e sobe uma prévia local da pasta `dist`.

```bash
npm run build:web:github
```

Gera o build pronto para GitHub Pages, incluindo URLs amigáveis e fallback.

## URLs finais

Se o repositório for um projeto comum:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

Se o repositório for um site de usuário (`SEU-USUARIO.github.io`):

```text
https://SEU-USUARIO.github.io/
```

## Observações importantes

- Os dados continuam locais no navegador, usando `localStorage`.
- O PIN continua local no dispositivo/navegador.
- O conteúdo publicado é público, mas os dados do usuário não são enviados para um servidor por esse fluxo.
- Se o usuário limpar os dados do navegador sem exportar backup antes, os dados locais serão perdidos.

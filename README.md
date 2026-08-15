# Sertão Cred

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Taxas

As taxas não ficam mais no código: vêm da API do repositório `NexoraCred-api`,
que também tem o painel administrativo onde elas são alteradas. O acesso fica em
`src/api/rates.js`, que guarda uma cópia no `localStorage` — se a API estiver
fora do ar, o simulador continua funcionando com a última consulta e exibe um
aviso de que as taxas podem estar desatualizadas.

Configure a URL da API antes de rodar:

```sh
cp .env.example .env
```

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
# Sertão Cred
```sh
git subtree push --prefix dist origin gh-pages
```

> **Atenção ao publicar:** o Vite embute o valor de `VITE_API_URL` no bundle em
> tempo de build. Rodar `npm run build` com o `.env` de desenvolvimento gera um
> `dist/` apontando para `http://localhost:3000`, que não funciona para ninguém
> além da sua máquina. Antes do `git subtree push`, defina `VITE_API_URL` com a
> URL pública da API e rode `npm run build` de novo.
>
> A URL da API precisa ser **HTTPS**: o GitHub Pages serve a página sob HTTPS e o
> navegador bloqueia chamadas HTTP a partir dela (mixed content). Inclua também a
> origem do Pages em `CORS_ORIGIN` no `.env` do backend.

# NexoraCred
# NexoraCred

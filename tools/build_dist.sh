#!/usr/bin/env bash
# Monta dist/ com SÓ o que o site público precisa. É o que o deploy publica.
# Tudo que não está nesta lista (docs/, supabase/, tools/, tasks/, .claude/,
# projetos.json, planilhas, backend.config.example.js, textos/*.rtf) fica fora do ar.
#
# Ao criar uma nova pasta de páginas na raiz (ex.: /novidades/), acrescente-a em PASTAS.
set -euo pipefail
cd "$(dirname "$0")/.."

ARQUIVOS=(
  index.html admin.html admin.js admin.css
  app_portfolio.js portfolio.css portfolio.config.js backend.config.js
  favicon.ico favicon-192.png apple-touch-icon.png
  _headers _redirects robots.txt sitemap.xml
)
PASTAS=(assets dossie curriculo portfolio quem contato auth)

rm -rf dist
mkdir dist

for f in "${ARQUIVOS[@]}"; do
  [ -f "$f" ] || { echo "ERRO: arquivo obrigatório ausente: $f" >&2; exit 1; }
  cp "$f" dist/
done

for d in "${PASTAS[@]}"; do
  [ -d "$d" ] || { echo "ERRO: pasta obrigatória ausente: $d" >&2; exit 1; }
  cp -R "$d" dist/
done

# textos/: o site lê só os .html (os .rtf são rascunhos)
mkdir dist/textos
cp textos/*.html dist/textos/

find dist -name '.DS_Store' -delete

# Conferência: o que precisa estar e o que não pode estar
for f in index.html admin.html app_portfolio.js portfolio.css _headers _redirects sitemap.xml \
         textos/inicio.html assets/giz-logo.png assets/og-image.png auth/confirm/index.html; do
  [ -f "dist/$f" ] || { echo "ERRO: dist/$f não foi gerado" >&2; exit 1; }
done
for p in docs supabase tools tasks .claude .github projetos.json projetos_metadata.xlsx backend.config.example.js; do
  [ ! -e "dist/$p" ] || { echo "ERRO: dist/$p não deveria ser publicado" >&2; exit 1; }
done

echo "dist/ pronto: $(find dist -type f | wc -l | tr -d ' ') arquivos, $(du -sh dist | cut -f1)"

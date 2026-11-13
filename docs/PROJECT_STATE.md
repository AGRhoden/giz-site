# Project State

## Snapshot

- Project: `giz-site`
- Goal: editorial portfolio site with a custom admin panel and a Supabase-backed content system
- Hosting: Cloudflare Pages
- Backend: Supabase project `epinzzvsbyglmztasspa`
- GitHub: `AGRhoden/giz-site` (privado → público, branch `main`)
- Current priority: redesign editorial do frontend público (fase 003)

## Arquivos canônicos confirmados (28 Mar 2026)

| Arquivo | Linhas | Data | Notas |
|---|---|---|---|
| `admin.html` | — | 17 Mar | HTML do painel admin |
| `admin.js` | 3635 | 17 Mar | JS completo do admin (ex admin 3.js) |
| `admin.css` | — | 17 Mar | CSS do admin |
| `app_portfolio.js` | 1548 | 18 Mar | Frontend público confirmado |
| `portfolio.css` | — | 18 Mar | CSS confirmado (par do app_portfolio.js) |
| `portfolio.config.js` | — | 18 Mar | Configuração de filtros e páginas |
| `index.html` | — | — | Shell do frontend público |
| `backend.config.js` | — | — | **NÃO commitado** (gitignored, credenciais) |

## Current Status

### Admin
- Login funcional: e-mail/senha, recuperação e magic link.
- Dois workspaces: `Projetos` e `Conteúdo do site`.
- `Projetos`: busca, filtro por status, navegação alfabética, edição, upload de imagens, tags, pares, batch.
- `Conteúdo do site`: labels de menu, HTML de páginas, trilha do portfólio.

### Supabase
- Schema completo aplicado remotamente (10 migrations).
- `published_project_feed` com `is_featured`, `sort_year`, metadados de pares.
- `site_config` como fonte editorial para navegação e conteúdo de páginas.
- 50 projetos no banco.

### Frontend público
- Versão canônica confirmada visualmente em 28 Mar 2026.
- Grid à esquerda, painel à direita, navegação discreta no topo.
- Botão de grid roxo com rotação anti-horária para navegação de pares (`grid-button-reverse`).
- Lê dados do Supabase (`published_project_feed`).
- **Próxima fase:** redesign editorial (003) — melhorar hierarquia, ritmo visual, navegação por filtros/cores/pares.

### Git
- Repositório inicializado do zero (28 Mar 2026, .git anterior corrompido).
- Remote: `https://github.com/AGRhoden/giz-site.git`
- Branch principal: `main`

## Working Assumptions

- Desktop é o alvo principal do admin. Mobile é secundário.
- O admin prioriza clareza e velocidade, não estética de dashboard.
- O frontend público não deve herdar a lógica visual do admin.
- Gastos de infraestrutura reais só começam quando o site estiver navegável e com conteúdo suficiente.

## Known Gaps

- Edição de conteúdo do site suporta apenas itens existentes (não cria novos menus ou trilhas).
- O dicionário público de labels ainda não é editável no admin.
- O redesign editorial do frontend está pendente.

## Resume Here

1. Servidor local: `ruby -run -e httpd . -p 3000` na pasta do projeto.
2. Admin: `http://localhost:3000/admin.html`
3. Front: `http://localhost:3000/index.html`
4. Ler `DECISIONS.md` antes de decisões de arquitetura.
5. Verificar `site_config` no Supabase se o conteúdo do site não carregar.

## Last Consolidated Direction

- Admin e backend estáveis para operações reais de conteúdo.
- Frontend público na versão canônica confirmada.
- Próxima fase: redesign editorial deliberado com linguagem visual própria, seguido de preparação para lançamento.

## Deploy

- O deploy de produção é só o GitHub Actions (`.github/workflows/deploy.yml`): `tools/build_dist.sh` monta `dist/` com os arquivos do site e `wrangler pages deploy dist` publica.
- O deploy automático pela integração Git da Cloudflare Pages foi desligado em 2026-11-13 (ele publicava o repositório inteiro, expondo `docs/`, `tools/` etc.).
- Nova pasta de páginas na raiz? Acrescente-a em `PASTAS` no `tools/build_dist.sh`, ou ela não vai ao ar.

### Páginas estáticas com texto do banco (dossiês, currículos) e sitemap
`tools/build_dist.sh` roda `tools/paginas_build.py` antes de montar `dist/`: cada deploy (push no main, deploy hook diário das 06:00 UTC ou Retry deployment) atualiza título, descrições, JSON-LD e `#seo-content` de `dossie/<slug>/{,en/,es/}` e `curriculo/<slug>/{,en/,es/}` com o texto atual do banco. A página já versionada serve de molde (ajustes manuais nela são preservados; a meta description dos currículos é texto de SEO manual e não é tocada); o endereço vem da coluna `slug`. Dossiê ou currículo novo criado no admin ganha página, entrada no `sitemap.xml` e (dossiê) link na lista de `dossie/index.html` no próximo deploy; item apagado sai do sitemap (a pasta da página fica e o build avisa no log). O `lastmod` do sitemap só sobe quando a data de edição no banco é mais recente (dossiês não têm trigger de `atualizado_em`: ao editar um dossiê, ajustar o `lastmod` à mão se quiser). As páginas atualizadas vão para o site, mas não são commitadas de volta ao repositório. Se o Supabase falhar, o build segue com as páginas versionadas. `python3 tools/paginas_build.py --check` mostra o que está defasado, sem gravar.

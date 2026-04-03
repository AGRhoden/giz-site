# Pipeline GIZ — Revisão e Correções

> Para usar: abra uma sessão e diga "leia o pipeline e vamos trabalhar no item X".
> Claude lê este arquivo e já sabe o contexto sem precisar de explicação.

---

## CONTEÚDO DAS PÁGINAS

### Início (`textos/inicio.html`)
- [x] Subtítulo reescrito: "Projeto gráfico editorial com identidade própria."
- [x] Intro reescrita
- [ ] **Revisar com o cliente** — tom e posicionamento corretos?

### Quem somos (`textos/quem-somos.html`)
- [x] Texto criado (2 parágrafos)
- [ ] **Revisar com o cliente** — história real, nomes, ano de fundação
- [ ] Adicionar informações específicas: equipe, diferenciais, abordagem

### Contato (`textos/contato.html`)
- [x] Estrutura correta
- [ ] **Confirmar email real** — usando giz@giz.com.br provisoriamente
- [ ] **Adicionar número WhatsApp real**
- [ ] Avaliar se "São Paulo, Brasil" é o correto

### Portfólio (`textos/portfolio.html`)
- [ ] Arquivo corrompido (RTF exportado como HTML) — substituir por HTML limpo
- [ ] Verificar se Supabase já tem versão salva via admin (prevalece sobre o estático)

### Dossiê (`textos/dossie.html`)
- [x] Conteúdo básico adequado — sem urgência

---

## PROJETOS

- [ ] Revisar projetos com `status: draft` — publicar ou descartar
- [ ] Verificar projetos sem thumb
- [ ] Verificar projetos sem tags de tema ou cor
- [ ] Confirmar se todos os projetos têm `sort_year` preenchido
- [ ] Revisar textos de descrição (campo `description`) — são finais ou provisórios?

---

## DOSSIÊS

- [ ] Verificar quais dossiês têm conteúdo PT mas não EN/ES — definir se multilíngue é necessário agora
- [ ] Confirmar que todos os dossiês têm mídia (carrossel)

---

## ÁLBUM SECRETO

- [ ] Upload da capa secreta (fazer no admin > Álbum, marcar "Capa secreta")
- [ ] Upload das fotos do álbum
- [ ] Preencher legendas de cada foto

---

## TÉCNICO / PENDÊNCIAS

- [ ] `portfolio.html` estático corrompido — corrigir arquivo
- [ ] Dual-source de conteúdo (estático vs Supabase): definir se o admin vai ser a fonte única ou manter os dois
- [ ] Confirmar que `site_config` no Supabase não tem versões antigas das páginas sobrescrevendo os textos novos
- [ ] WhatsApp no Contato: adicionar link `https://wa.me/55...` quando número definido
- [ ] Revisar `labels` em `portfolio.config.js` — todos os slugs de editoras e serviços têm label legível?

---

## COMO TRAZER PARA O CLAUDE

Diga: **"leia o pipeline"** — Claude lê `.claude/pipeline.md` e segue a partir daí.
Para um item específico: **"pipeline, item Quem somos"**.
Para marcar como feito: Claude edita o `[ ]` para `[x]` ao concluir.

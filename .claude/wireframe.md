# Wireframe GIZ — Mapa Completo do Front

> Documento de referência para análise, decisões e correções.
> Atualizar sempre que uma tela ou comportamento mudar.

---

## ESTRUTURA BASE

O site tem duas zonas fixas visíveis simultaneamente:

```
┌─────────────────────┬────────────────────────────────────┐
│                     │                                    │
│   COLUNA ESQUERDA   │         ÁREA DIREITA               │
│   (panel / left)    │    (grid  |  viewer)               │
│                     │                                    │
│   ~25% da largura   │         ~75%                       │
└─────────────────────┴────────────────────────────────────┘
```

**Menu:** topo da coluna esquerda. Fixo. Ítens: Início · Portfólio · Quem somos · Contato · Dossiê

---

## TELAS / ESTADOS

### 1. INÍCIO
**Coluna esq.:** título GIZ + subtítulo + intro
**Área dir.:** grid completo de projetos (embaralhado)
**Card secreto:** injetado aqui, posição aleatória
**Interações:** clicar em projeto → Estado 5 | clicar no card secreto → Estado 9

---

### 2. PORTFÓLIO — Intro
**Coluna esq.:**
- Título "Portfólio"
- Texto curto (vem de `textos/portfolio.html` ou Supabase)
- Botões de filtro: Destaques · Editoras · Temas · Cores · Tipos · Execução
- Overview: contador "X de Y projetos" + botão limpar filtros (se houver)

**Área dir.:** mesmo grid
**Interações:** clicar num botão → Estado 3

---

### 3. PORTFÓLIO — Critério ativo
**Coluna esq.:**
- Nome do critério (ex: "Editoras")
- Descrição do critério
- Lista de opções clicáveis (multisseleção)
- Setas ‹ › para navegar entre critérios
- Botões: limpar filtros ✖ · voltar à intro ❖

**Área dir.:** grid filtrado em tempo real
**Interações:** selecionar opção → filtra grid | clicar projeto → Estado 5

---

### 4. QUEM SOMOS
**Coluna esq.:** título + subtítulo + 2 parágrafos
**Área dir.:** grid (sem alteração)

---

### 5. CONTATO
**Coluna esq.:** título + subtítulo + intro + dados de contato + botão "Ver o acervo"
**Área dir.:** grid (sem alteração)

---

### 6. DOSSIÊ — Lista
**Coluna esq.:** título "Dossiê" + subtítulo + lista de dossiês (botões clicáveis)
**Área dir.:** grid (sem alteração)
**Interações:** clicar dossiê → Estado 7

---

### 7. DOSSIÊ — Detalhe (tela cheia)
**Layout:** substitui o layout inteiro. Coluna e grid somem.
**Conteúdo:**
- Cabeçalho com menu replicado
- Nav: ← título anterior · · · próximo título →
- Título com fio (réguas flanqueantes)
- Seletor de idioma: P · EN · ES (círculos teal)
- Carrossel de stills (se houver mídia)
- Texto do dossiê (rich text, multilíngue)

**Voltar:** não há botão explícito — navegação pelo menu ou links prev/next
⚠️ **Problema:** não há como voltar à lista de dossiês exceto pelo menu (que reabre a lista)

---

### 8. PROJETO ABERTO (viewer)
**Coluna esq.:**
- Badge "Destaque" (se `is_featured`)
- Título do projeto
- Subtítulo (se houver)
- Linha de contexto: cliente · ano · serviço · tipo
- Descrição (se preenchida e não for o placeholder)
- Pares: "Trabalhos relacionados" (thumbs clicáveis)
- Tags: cores (com swatch) + temas (clicáveis → filtram grid)

**Área dir.:** viewer de imagens
- Imagem grande
- Navegação ← → entre imagens
- Lupa (hover, desktop)
- Botão fechar / voltar ao grid
- Botão "ver par" (se em modo par-foco)

---

### 9. ÁLBUM — Descoberta
**Coluna esq.:** "Você descobriu a capa que não existe." + chips [Entrar] [Sair]
**Área dir.:** grid normal (ainda com projetos)
**Card secreto:** visível, foi clicado

---

### 10. ÁLBUM — Modo ativo
**Coluna esq.:** mesmo texto + chips (fixo enquanto ativo)
**Área dir.:** grid de fotos (embaralhadas)
**Menus:** travados (pointer-events: none, opacidade reduzida)
**Interações:** clicar foto → fullscreen landscape (overlay escuro, 55vw × 55vh)

---

## CRUZAMENTOS E NAVEGAÇÃO

```
Início ──────────────────────────────── grid completo
   └── clicar projeto ──────────────── Projeto aberto
   └── clicar card secreto ─────────── Descoberta → Álbum

Portfólio Intro ─────────────────────── grid completo
   └── selecionar critério ─────────── Critério ativo
       └── selecionar opção ─────────── grid filtrado
           └── clicar projeto ────────── Projeto aberto

Dossiê ───────────────────────────────── lista
   └── clicar dossiê ────────────────── Detalhe (tela cheia)
       └── menu ─────────────────────── qualquer página

Projeto aberto:
   └── clicar tag ────────────────────── Critério ativo (filtrado)
   └── clicar par ────────────────────── outro Projeto aberto
   └── clicar "ver par" ─────────────── Modo par-foco (grid 2 projetos)
   └── fechar ────────────────────────── estado anterior (grid)
```

---

## PROBLEMAS IDENTIFICADOS

### Redundâncias
- `renderRelatedProjects()` — função completa ("Do mesmo catálogo") que **nunca é chamada**. Código morto.
- `portfolio.html` estático — arquivo corrompido (RTF exportado). Inócuo se o Supabase tem o conteúdo, mas é lixo no repo.

### Falhas / Pontos cegos
- **Dossiê sem botão de retorno explícito** — só o menu devolve à lista. Intuitivo para quem conhece, confuso para quem não conhece.
- **Serviço (`servico`)** na linha de contexto do projeto — campo existe, aparece no front, mas a alimentação pelo admin está "não resolvida" (decisão pendente sobre que valores usar).
- **Subtítulo (`subtitulo`)** — campo no modelo de dados e no painel, mas não há campo de preenchimento visível no admin de projetos (verificar).
- **Álbum: menus travados** — impossível navegar para outras páginas sem sair do modo álbum. Intencional, mas é uma armadilha se o usuário não encontrar os chips.
- **Dois filtros "Destaques"** — `isFeatured` (campo booleano) e a tag `"destaque"` coexistem. O filtro usa a tag. São a mesma coisa alimentada de duas formas? Risco de inconsistência.

### Informações ausentes no projeto aberto
- **Ano** — aparece na linha de contexto, mas não há campo de ano explícito no admin (existe como `sort_year` — é o mesmo? verificar)
- **Serviço** — não resolvido
- **Tipo** — aparece só quando não é "livro" (decisão de código). Intencional?

### Informações desnecessárias (à luz do contexto do site)
- **Badge "Destaque"** — se Destaques já é um filtro, o badge no painel do projeto pode ser redundante visualmente
- **Descrição** — decisão ainda em aberto (o dossiê pode cobrir isso)

### Decisões abertas
- [ ] Descrição por projeto: manter, remover ou redirecionar para dossiê?
- [ ] Serviço: quais valores? Como alimentar consistentemente?
- [ ] Tipo "livro" oculto na linha de contexto — proposital?
- [ ] Subtítulo: para que serve? Algum projeto usa?
- [ ] Badge Destaque: manter no painel ou remover?
- [ ] Dossiê: adicionar botão "← Lista de dossiês" explícito?
- [ ] `renderRelatedProjects` ("Do mesmo catálogo"): ativar, remover ou repensar?

---

## COMO USAR ESTE DOCUMENTO

Diga **"leia o wireframe"** — Claude lê este arquivo e trabalha a partir do mapa real, sem reexplicar.
Para atacar um item específico: **"wireframe, problema: serviço"**.
Atualizar os `[ ]` para `[x]` conforme as decisões forem tomadas.

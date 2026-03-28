# Mapa Definitivo do ePub Premium (MDDEPP)

Guia prático e documentado para extrair o máximo do **EPUB Premium 2.0** e da exportação do InDesign, com foco em resultado “premium” e eficiência real de produção.

Este documento foi pensado para **ambientes de produção pesada** (500–1000+ páginas), com gráficos, imagens com legenda, páginas com fundo ilustrativo e demandas de entrega rápida.

---

## 1) Visão Geral: O que é “Premium” no ePub

**Premium** = EPUB limpo, sem overrides, com estilos consistentes, tags semânticas bem mapeadas, metadados completos, navegação robusta (TOC + links) e CSS enxuto/controlado.

O **EPUB Premium 2.0** entrega:

1. **Pré‑flight de estilos** (renomeia para CSS-safe, limpa overrides e aplica estilo padrão em parágrafos “sem estilo”).
2. **Export Tagging** automático (tags HTML + classes CSS controladas por regra).
3. **Vínculos** (TOC → títulos, notas de rodapé → texto da nota + backlink opcional).
4. **Selo OK** quando não há divergências.

---

## 2) Diagrama Macro do Fluxo

```
[Documento Original]
        |
        v
  [Cópia de Produção]  ->  (Congelar layout, links, assets)
        |
        v
[EPUB Premium 2.0 - Preflight]
        |
        v
[EPUB Premium 2.0 - Tagging]
        |
        v
[EPUB Premium 2.0 - TOC/Notas]
        |
        v
[Exportação EPUB]
        |
        v
[Validação & Ajustes Finos]
```

---

## 3) Guia PCPP (Modo BABÁ) — Passo a Passo

Objetivo: qualquer pessoa consegue fazer **sem travar o projeto**.

**Checklist de entrada (30 segundos):**
- Documento abre e não está corrompido.
- Tudo que é texto está dentro de text frames.
- Você sabe onde ficam os estilos de parágrafo e caractere.

**Passo a passo (documento cascudo):**

1. Abra o arquivo no InDesign.
2. Salve uma **cópia** com outro nome (por exemplo, `livro_epub_versao1.indd`).
3. Abra o painel Scripts e rode `epub_premium.jsx`.
4. Na aba **Preflight**: marque tudo (renomear, limpar overrides, aplicar padrão).
5. No campo “Nome do estilo padrão”, use `texto`.
6. Na aba **Tagging**: deixe ligado Parágrafo e Caractere. Revise as regras rápidas.
7. Na aba **TOC & Notas**, se existir TOC estilizado marque “Linkar entradas do índice” e, se existir notas, marque “Linkar referências de notas”.
8. Na aba **Export**: deixe desmarcado (por enquanto). Primeiro valide.
9. Clique **Executar**.
10. Se aparecer marcação vermelha (EPUB_FLAG), resolva.
11. Se aparecer marcação azul (EPUB_AUTO), é correção automática.
12. Rode novamente até o alerta final dizer **OK**.
13. Só então exporte o EPUB.

**Se o documento for muito grande (1000+ páginas):**
1. Divida por capítulos (Book file).
2. Rode o script capítulo por capítulo.
3. Exporte EPUB por capítulo e teste.
4. Depois unifique no pós‑processo (se necessário).

---

## 4) Decisão Estratégica: Reflowable ou Fixed Layout?

**Regra-mãe (Adobe/Apple/Kindle):**
- **Reflowable** = texto se adapta ao dispositivo (ideal para leitura contínua).
- **Fixed Layout** = preserva design/diagramação (ideal para páginas ilustradas).

### Árvore de decisão rápida

```
Tem texto sobre imagem/fundo ilustrativo?
    |-- sim -> FIXED LAYOUT
    |-- não -> continue

Há muitos quadros, tabelas complexas, infográficos, HQ?
    |-- sim -> FIXED LAYOUT
    |-- não -> continue

Texto principal linear, leitura contínua?
    |-- sim -> REFLOWABLE
    |-- não -> avaliar caso a caso
```

---

## 5) Classificador Automático (Script 2.0) — Especificação

**Objetivo:** o script lê o documento e recomenda **Reflowable** ou **Fixed Layout**.

### Métricas sugeridas

- % páginas com **imagem de página inteira**
- % frames de texto **sobre imagem**
- Nº de **objetos ancorados complexos**
- Nº de **tabelas grandes / infográficos**
- Uso de **textos curvos, rotacionados ou em path**

### Regra de decisão (pseudocódigo)

```
score = 0

if fullBleedImagePages >= 20%: score += 1
if textOverImageFrames >= 15%: score += 1
if complexAnchors >= 30: score += 1
if bigTablesOrInfographics >= 10: score += 1
if textOnPathOrRotation >= 5: score += 1

if score >= 2: recommend = FIXED_LAYOUT
else: recommend = REFLOWABLE
```

### Saída para o usuário

- Mensagem clara: “Este arquivo é melhor indicado para FIXED LAYOUT”
- Log com score e métricas

---

## 6) Pré‑Flight Premium (EPUB Premium 2.0)

### 6.1 Configuração recomendada (produção rápida)

- ✅ Renomear estilos para CSS‑safe
- ✅ Limpar overrides
- ✅ Aplicar estilo padrão em `[Parágrafo básico]`
- ✅ Marcar alterações automáticas (EPUB_AUTO)
- ✅ Marcar divergências (EPUB_FLAG)

**Estilo padrão recomendado:** `texto`

### 6.2 Regra CSS‑safe (padrão do script)

- minúsculas, sem acento, sem espaço, sem underscore
- exemplo: `capitular`, `titulo1`, `nota`, `recuo`, `texto`

### 6.3 Overrides (padrão “sem suor”)

- **Override de parágrafo**: limpar automático
- **Override de caractere**: limpar automático
- Para manter ênfase, use **estilo de caractere**

---

## 7) Export Tagging (Semântica premium)

### 7.1 Padrão recomendado

**Parágrafos**

```
titulo1  => h1
titulo2  => h2
titulo3  => h3
texto    => p
nota     => p
recuo    => p
capitular=> p
```

**Caracteres**

```
italico  => em
negrito  => strong
```

### 7.2 Classes com prefixo de grupo

```
Grupo “Texto” + estilo “capitular” => texto-capitular
```

---

## 8) TOC & Notas (Vínculos Premium)

- TOC → títulos (navegação real)
- Notas → texto da nota (+ backlink opcional)

---

## 9) Exportação “Premium” no InDesign

### 9.1 Reflowable (Recomendação Premium)

- **Include classes in HTML**: ON
- **Generate CSS**: ON
- **Preserve Local Overrides**: OFF (para CSS mais limpo)
- **Add Style Sheet**: ON (CSS externo; InDesign não valida a existência/validade do CSS)
- **Object > CSS Size**: “Relative to Text Flow”
- **Metadados**: preencha título/autor/descrição no documento

### 9.2 Fixed Layout (Recomendação Premium)

- **CSS (Fixed Layout)**: adicione CSS externo com cuidado
- **JavaScript**: só se necessário (InDesign não valida a existência/validade do JS)
- **TOC**: use TOC por estilo ou bookmarks

### 9.3 Pós‑export (limpo e rápido)

- O arquivo `.epub` é um ZIP. Se precisar, renomeie para `.zip` e ajuste o CSS diretamente.

---

## 10) Template CSS Premium (pós‑export)

```css
:root {
  --font-body: "Literata", serif;
  --font-sans: "Source Sans 3", sans-serif;
  --color-text: #1c1c1c;
  --color-muted: #666666;
  --max-width: 38em;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
  padding: 0;
}

main, .book {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 1.5em 1.2em;
}

p { margin: 0 0 1em 0; }

h1, h2, h3 {
  font-family: var(--font-sans);
  line-height: 1.2;
  margin: 1.6em 0 0.6em 0;
}

h1 { font-size: 1.6em; }
h2 { font-size: 1.35em; }
h3 { font-size: 1.2em; }

blockquote {
  border-left: 3px solid #ddd;
  padding-left: 1em;
  color: var(--color-muted);
}

img { max-width: 100%; height: auto; }

.note { font-size: 0.92em; color: var(--color-muted); }
```

---

## 11) Checklist por Plataforma (Validação Premium)

### 11.1 Apple Books

- EPUB 3.3 suportado (somente EPUB 3).
- TOC (`nav epub:type="toc"`) é **obrigatório**.
- Metadata mínima: título, ID, idioma e data de modificação.
- Fixed Layout exige `rendition:layout=pre-paginated` e viewport consistente.
- Imagens internas não podem exceder **5.6 milhões de pixels**.

### 11.2 Kindle / KDP

- MOBI não é aceito (desde 18 de março de 2025).
- Para reflowable e fixed layout: use **EPUB** ou **KPF**.
- Reflowable: texto ajustável; Fixed Layout: página fixa, normalmente com fundo ilustrado.
- Teste no Kindle Previewer / KDP Previewer antes de publicar.

### 11.3 Geral (independente da loja)

- Rode **EPUBCheck** para validar conformidade com o padrão EPUB.
- Corrija erros antes de subir o arquivo.

---

## 12) Cenários “Desastrosos” (1000 páginas, imagens, fundos, etc.)

1. **Trabalhe sempre com cópia**
2. **Divida em capítulos** (Book file)
3. Rode o script por partes
4. Ajuste CSS fora do InDesign

---

## 13) O que diferencia um EPUB Premium

| Critério | Exportação crua | EPUB Premium |
|---------|------------------|--------------|
| Estilos | Sujos / soltos | CSS-safe e limpos |
| Overrides | Mantidos | Zerados |
| HTML | Genérico | Semântico (tagging) |
| CSS | Inchado | Enxuto e controlado |
| TOC | Estático | Navegável |
| Notas | Texto | Links bidirecionais |
| Metadados | Básico | Completo e consistente |

---

## 14) Leituras e Referências (documentação oficial)

- Adobe: Export content for EPUB (Reflowable/Fixed) — opções de exportação, CSS/JS, metadados, TOC.  
  https://helpx.adobe.com/indesign/using/export-content-epub-cc.html
- Adobe Developer: StyleExportTagMap — mapeamento de tags/classes no export.  
  https://developer.adobe.com/indesign/dom/api/s/StyleExportTagMap/
- Adobe: Text resizing options (EPUB Reflowable).  
  https://helpx.adobe.com/indesign/using/adjust-text-resizing-for-accesibility.html
- Apple Books Asset Guide 5.3.1 — regras EPUB 3, TOC obrigatório, fixed layout, metadata, imagens.  
  https://help.apple.com/itc/booksassetguide/en.lproj/static.html
- Apple Books: EPUB 3 Fixed Layout — `rendition:layout` e requisitos.  
  https://help.apple.com/itc/booksassetguide/en.lproj/itcef2bad6b8.html
- KDP: MOBI Support FAQ — formatos aceitos, definição reflowable vs fixed.  
  https://kdp.amazon.com/en_US/help/topic/GULSQMHU5MNH4EZM
- EPUBCheck (W3C) — validação oficial.  
  https://www.w3.org/publishing/epubcheck/

---

## 15) Próximas features sugeridas para o Script 2.0

1. **Classificador automático Reflowable vs Fixed Layout**
2. **Relatório de risco (score)** com base no layout real
3. **Exportador automático** com perfil “Premium”
4. **Validador interno** (EPUBCheck externo)

---

## 16) Resumo executivo (para decidir rápido)

1. Rode EPUB Premium 2.0 com renomeio + limpeza
2. Faça o tagging com regras claras
3. Vincule TOC e notas
4. Exporte com classes + CSS externo
5. Valide (EPUBCheck + Previewer)

Fim.

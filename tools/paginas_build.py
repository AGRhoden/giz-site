#!/usr/bin/env python3
"""
Mantém as páginas estáticas com texto (dossiês e currículos) e o sitemap em dia com o banco.

Uso: python3 tools/paginas_build.py [--dry-run] [--check]

Por que existe: o texto de dossiês e currículos é editado no admin e fica no Supabase. O app (JavaScript) lê do
banco, mas buscadores e visitantes sem JavaScript só enxergam o HTML estático. Esta ferramenta mantém os dois
iguais, inclusive para dossiês/currículos criados no futuro. Roda em todo build (tools/build_dist.sh).

Como funciona: a página já versionada é o MOLDE; só os trechos que vêm do texto são trocados.
  Dossiê   (dossie/<slug>/{,en/,es/}index.html):
     <title>, og:title, "headline" do JSON-LD            <- título no idioma
     meta description, og:description, "description"     <- descrição (decide_descricao: mantém a da página
                                                            enquanto ainda for começo da descrição do banco)
     "articleBody" do JSON-LD                             <- texto puro do conteúdo (5000 primeiros caracteres)
     <article id="seo-content">                           <- HTML do conteúdo
  Currículo (curriculo/<slug>/{,en/,es/}index.html):
     <title>, og:title, "name"/"jobTitle" do JSON-LD     <- nome e cargo no idioma
     "description" do JSON-LD                             <- texto puro do conteúdo
     <article id="seo-content">                           <- HTML do conteúdo
     (a meta description dos currículos é texto de SEO escrito à mão e NÃO é tocada, exceto em página nova)
  dossie/index.html: lista de links dos dossiês dentro do #seo-anchor (descoberta por buscadores).
  sitemap.xml: uma entrada por página de dossiê/currículo existente (novas entram, as de itens apagados saem;
     lastmod sobe só quando a data de edição no banco é mais recente; entradas novas usam essa data).
Todo o resto (canonical www, twitter:card, favicons, versões ?v= dos scripts) é preservado byte a byte.
Página nova (sem molde próprio) usa como molde a de outro item do mesmo tipo e idioma, com o endereço trocado.

--dry-run : mostra o que mudaria, sem gravar.   --check : como --dry-run, mas sai com 1 se algo estiver defasado.
Falha de rede/dados nunca apaga nada: as páginas versionadas ficam como estão.
"""
import os, sys, re, json, html, datetime, urllib.request

SUPABASE_URL = "https://epinzzvsbyglmztasspa.supabase.co"
ANON_KEY = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaW56enZzYnlnbG16dGFzc3BhIiwicm9sZSI6ImFub24i"
            "LCJpYXQiOjE3NzM2MzQxNzQsImV4cCI6MjA4OTIxMDE3NH0.BZSIHOjrVlG5sgmabDe-AInR-90bElUJGSYEead-GIs")  # chave pública (anon)
HEADERS = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
DRY_RUN = "--dry-run" in sys.argv or "--check" in sys.argv
CHECK = "--check" in sys.argv
HOJE = datetime.date.today().isoformat()
BASE = "https://www.giz.art.br"

SUFIXO_TITLE = " — GIZ Oficina Editorial"
LIMITE_DESC = 160
LIMITE_ARTICLE_BODY = 5000
LANGS = (("pt", "", ""), ("en", "en/", "_en"), ("es", "es/", "_es"))  # (idioma, subpasta, sufixo da coluna)

TIPOS = {
    "dossie": {
        "tabela": "dossies", "pasta": "dossie", "ordem": "criado_em.asc",
        "ts": "atualizado_em",
        "colunas": "id,slug,atualizado_em,criado_em,titulo,titulo_en,titulo_es,descricao,descricao_en,descricao_es,conteudo,conteudo_en,conteudo_es",
    },
    "curriculo": {
        "tabela": "curriculos", "pasta": "curriculo", "ordem": "created_at.asc", "ts": "updated_at",
        "colunas": "id,slug,updated_at,created_at,nome,titulo_profissional,titulo_profissional_en,titulo_profissional_es,"
                   "descricao,descricao_en,descricao_es,conteudo,conteudo_en,conteudo_es",
    },
}


# ---------- texto ----------
def fetch(tipo):
    t = TIPOS[tipo]
    url = f"{SUPABASE_URL}/rest/v1/{t['tabela']}?select={t['colunas']}&order={t['ordem']}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as r:
        return json.loads(r.read())


def strip_data_uris(h):
    return re.sub(r'<img[^>]+src=["\']data:[^"\']+["\'][^>]*>', "", h or "")


def texto_puro(h):
    t = re.sub(r"<[^>]+>", " ", h or "").replace("﻿", "")
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def truncar(t, n=LIMITE_DESC):
    if len(t) <= n:
        return t
    return t[:n - 1].rsplit(" ", 1)[0] + "…"


def norm(t):
    return re.sub(r"\s+", " ", html.unescape(t or "")).strip()


def decide_descricao(atual, db):
    """Mantém a descrição da página se ainda for um começo do texto do banco (algumas foram ajustadas à mão);
    se o texto do banco foi editado e não bate mais, usa o do banco cortado em 160 caracteres."""
    db = norm(db)
    if not db:
        return atual
    a = norm(atual).rstrip("…").rstrip()
    if a and (db == a or db.startswith(a)):
        return atual
    return truncar(db)


def attr(t):
    """Escapa & < > e aspas duplas; o apóstrofo fica como está (é o que as páginas já têm)."""
    return html.escape(t, quote=True).replace("&#x27;", "'")


def sub1(padrao, repl, s, flags=0):
    novo, n = re.subn(padrao, lambda m: repl(m), s, count=1, flags=flags)
    if n != 1:
        raise ValueError(f"molde sem o trecho: {padrao[:45]}")
    return novo


def campo(d, base, col):
    return d.get(base + col) or d.get(base) or ""


def render(tipo, molde, d, col, forcar_desc):
    conteudo = strip_data_uris(d.get("conteudo" + col) or "")
    corpo = texto_puro(conteudo)
    s = molde
    if tipo == "dossie":
        titulo = campo(d, "titulo", col)
        m = re.search(r'<meta name="description" content="([^"]*)"', s)
        atual = html.unescape(m.group(1)) if m else ""
        desc = truncar(norm(d.get("descricao" + col))) if forcar_desc else decide_descricao(atual, d.get("descricao" + col))
        s = sub1(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), s)
        s = sub1(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), s)
        s = sub1(r'("headline": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(titulo, ensure_ascii=False), s)
        s = sub1(r'("description": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(desc, ensure_ascii=False), s)
        s = sub1(r'("articleBody": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(corpo[:LIMITE_ARTICLE_BODY]), s)
        rotulo = titulo
    else:
        nome = d.get("nome") or ""
        cargo = campo(d, "titulo_profissional", col)
        rotulo = f"{nome} — {cargo}" if cargo else nome
        if forcar_desc:
            desc = truncar(norm(d.get("descricao" + col)))
            s = sub1(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), s)
            s = sub1(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), s)
        s = sub1(r'("name": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(nome, ensure_ascii=False), s)
        s = sub1(r'("jobTitle": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(cargo, ensure_ascii=False), s)
        s = sub1(r'("description": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(corpo, ensure_ascii=False), s)
    s = sub1(r"(<title>)[^<]*(</title>)", lambda m: m.group(1) + attr(rotulo + SUFIXO_TITLE) + m.group(2), s)
    s = sub1(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + attr(rotulo) + m.group(2), s)
    s = sub1(r'(<article id="seo-content"[^>]*>\n    ).*?(\n  </article>)', lambda m: m.group(1) + conteudo + m.group(2), s, re.S)
    for _, _, c in LANGS[1:]:  # não anuncia (hreflang) idioma que não tem conteúdo
        if not (d.get("conteudo" + c) or "").strip():
            s = re.sub(r'[ \t]*<link rel="alternate" hreflang="' + c[1:] + r'"[^>]*>\n', "", s)
    return s


# ---------- arquivos ----------
def ler(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None


def caminho(tipo, slug, sub):
    return os.path.join(ROOT, TIPOS[tipo]["pasta"], slug, *([sub.rstrip("/")] if sub else []), "index.html")


def gravar(path, conteudo):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".new"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(conteudo)
    os.replace(tmp, path)


def molde_de(tipo, slug, sub, itens):
    s = ler(caminho(tipo, slug, sub))
    if s is not None:
        return s, False
    pasta = TIPOS[tipo]["pasta"]
    for o in itens:
        outro = o.get("slug")
        if outro and outro != slug:
            s = ler(caminho(tipo, outro, sub))
            if s is not None:
                return s.replace(f"/{pasta}/{outro}/", f"/{pasta}/{slug}/"), True
    return None, False


# ---------- sitemap e índice de dossiês ----------
def atualizar_sitemap(vivos, datas):
    """vivos: {(tipo, slug, sub)} páginas que devem existir; datas: {(tipo, slug, sub): 'AAAA-MM-DD'} da última
    edição segundo o banco. Edita o sitemap no lugar: tira as entradas de itens que não existem mais, sobe o
    lastmod só quando a data do banco é mais recente que a registrada (assim não muda a cada build) e acrescenta
    as novas logo depois da última entrada do mesmo tipo (copiando o formato de uma irmã)."""
    caminho_sm = os.path.join(ROOT, "sitemap.xml")
    sm = ler(caminho_sm)
    if sm is None:
        print("  sitemap.xml: não encontrado, pulado"); return 0
    pad = re.compile(r"[ \t]*<url>\s*<loc>" + re.escape(BASE) + r"/(dossie|curriculo)/([^/<]+)/((?:en|es)/)?</loc>.*?</url>\n?", re.S)
    chave = lambda m: (m.group(1), m.group(2), m.group(3) or "")

    def troca_lastmod(b, data):
        return re.sub(r"(<lastmod>)[^<]*(</lastmod>)", lambda m: m.group(1) + data + m.group(2), b, count=1)

    def ajusta(m):
        k = chave(m)
        if k not in vivos:
            return ""
        atual = re.search(r"<lastmod>([^<]*)</lastmod>", m.group(0))
        d = datas.get(k) or ""
        return troca_lastmod(m.group(0), d) if (atual and d > atual.group(1)) else m.group(0)

    novo = pad.sub(ajusta, sm)
    existentes = {chave(m) for m in pad.finditer(novo)}
    ordem_sub = {"": 0, "en/": 1, "es/": 2}
    for tipo in ("dossie", "curriculo"):
        faltam = sorted((k for k in vivos if k[0] == tipo and k not in existentes), key=lambda k: (k[1], ordem_sub[k[2]]))
        if not faltam:
            continue
        blocos = [m for m in pad.finditer(novo) if m.group(1) == tipo]
        if not blocos:
            print(f"  sitemap: nenhuma entrada de {tipo} para copiar o formato, novas não adicionadas"); continue
        texto = ""
        for (_, slug, sub) in faltam:
            irmao = next((m for m in blocos if (m.group(3) or "") == sub), None)
            if irmao is None:
                print(f"  sitemap: sem modelo de entrada para {tipo}/{slug}/{sub}, pulado"); continue
            bloco = troca_lastmod(irmao.group(0).replace(f"/{tipo}/{irmao.group(2)}/", f"/{tipo}/{slug}/"), datas.get((tipo, slug, sub)) or HOJE)
            for outra in ("en/", "es/"):  # não aponta hreflang para idioma sem página
                if (tipo, slug, outra) not in vivos:
                    bloco = re.sub(r'[ \t]*<xhtml:link rel="alternate" hreflang="' + outra[:2] + r'"\s+href="'
                                   + re.escape(f"{BASE}/{tipo}/{slug}/{outra}") + r'"/>\n', "", bloco)
            texto += bloco
        fim = blocos[-1].end()
        novo = novo[:fim] + texto + novo[fim:]
    if novo == sm:
        print("  sitemap.xml: igual"); return 0
    print("  sitemap.xml: ATUALIZADO" + (" [dry-run]" if DRY_RUN else ""))
    if not DRY_RUN:
        gravar(caminho_sm, novo)
    return 1


def atualizar_indice_dossies(dossies):
    p = os.path.join(ROOT, "dossie", "index.html")
    s = ler(p)
    if s is None:
        print("  dossie/index.html: não encontrado, pulado"); return 0
    itens = "".join(f'<li><a href="/dossie/{d["slug"]}/">{html.escape(d.get("titulo") or d["slug"], quote=False)}</a></li>'
                    for d in dossies if (d.get("slug") or "").strip() and (d.get("conteudo") or "").strip())
    lista = f'<ul data-auto="dossies">{itens}</ul>'
    if 'data-auto="dossies"' in s:
        novo = re.sub(r'<ul data-auto="dossies">.*?</ul>', lambda m: lista, s, count=1, flags=re.S)
    else:
        novo, n = re.subn(r'(<div id="seo-anchor"[^>]*>.*?)(</div>)', lambda m: m.group(1) + lista + m.group(2), s, count=1, flags=re.S)
        if n != 1:
            print("  dossie/index.html: sem #seo-anchor, pulado"); return 1
    if novo == s:
        print("  dossie/index.html: igual"); return 0
    print("  dossie/index.html: lista de dossiês ATUALIZADA" + (" [dry-run]" if DRY_RUN else ""))
    if not DRY_RUN:
        gravar(p, novo)
    return 1


# ---------- principal ----------
def main():
    mudou = erros = 0
    vivos, datas, dossies_ok = set(), {}, []
    for tipo in ("dossie", "curriculo"):
        print(f"Buscando {TIPOS[tipo]['tabela']} no Supabase...")
        itens = fetch(tipo)
        print(f"{len(itens)} encontrados.")
        if not itens:
            print(f"Nenhum item de {tipo} veio do banco: nada a fazer para este tipo (páginas versionadas intactas).")
            erros += 1
            continue
        if tipo == "dossie":
            dossies_ok = itens
        for d in itens:
            slug = (d.get("slug") or "").strip()
            if not slug:
                print(f"  [PULADO] {tipo} {d.get('id')} sem slug"); erros += 1; continue
            for lang, sub, col in LANGS:
                rotulo = f"{TIPOS[tipo]['pasta']}/{slug}/{sub}index.html"
                if not (d.get("conteudo" + col) or "").strip():
                    print(f"  {rotulo}: sem conteúdo em {lang}, mantida como está")
                    if ler(caminho(tipo, slug, sub)) is not None:
                        vivos.add((tipo, slug, sub))
                        datas[(tipo, slug, sub)] = (d.get(TIPOS[tipo]["ts"]) or "")[:10]
                    continue
                try:
                    molde, novo = molde_de(tipo, slug, sub, itens)
                    if molde is None:
                        print(f"  {rotulo}: sem molde, pulada"); erros += 1; continue
                    saida = render(tipo, molde, d, col, forcar_desc=novo)
                except Exception as e:
                    print(f"  {rotulo}: ERRO {e}"); erros += 1; continue
                vivos.add((tipo, slug, sub))
                datas[(tipo, slug, sub)] = (d.get(TIPOS[tipo]["ts"]) or d.get("criado_em") or d.get("created_at") or "")[:10]
                atual = ler(caminho(tipo, slug, sub))
                if atual == saida:
                    print(f"  {rotulo}: igual")
                    continue
                mudou += 1
                print(f"  {rotulo}: {'NOVA' if novo else 'ATUALIZADA'} ({len(saida)}b)" + (" [dry-run]" if DRY_RUN else ""))
                if not DRY_RUN:
                    gravar(caminho(tipo, slug, sub), saida)
    for tipo in ("dossie", "curriculo"):
        pasta = os.path.join(ROOT, TIPOS[tipo]["pasta"])
        if os.path.isdir(pasta) and not erros:
            no_banco = {k[1] for k in vivos if k[0] == tipo}
            for nome in sorted(os.listdir(pasta)):
                if os.path.isdir(os.path.join(pasta, nome)) and nome not in no_banco:
                    print(f"  AVISO: {TIPOS[tipo]['pasta']}/{nome}/ existe no repositório mas não está no banco (item apagado?). A página continua no ar; remova a pasta se não for mais desejada.")
    if dossies_ok:
        mudou += atualizar_indice_dossies(dossies_ok)
    if vivos and not erros:
        mudou += atualizar_sitemap(vivos, datas)
    elif vivos:
        print("  sitemap.xml: não mexo porque houve erro acima (evita apagar entradas por dado incompleto)")
    print(f"{mudou} item(ns) {'defasado(s)' if DRY_RUN else 'atualizado(s)'}, {erros} erro(s).")
    if erros:
        return 1
    return 1 if (CHECK and mudou) else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"ERRO: {e}")
        sys.exit(1)

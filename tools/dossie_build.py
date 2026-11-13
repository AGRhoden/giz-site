#!/usr/bin/env python3
"""
Atualiza as páginas estáticas dos dossiês (dossie/<slug>/{,en/,es/}index.html) a partir do banco.

Uso: python3 tools/dossie_build.py [--dry-run] [--check]

Por que existe: o texto dos dossiês é editado no admin e fica no Supabase; o app (JavaScript) lê do banco,
mas buscadores e visitantes sem JavaScript só enxergam o HTML estático. Esta ferramenta mantém os dois iguais.

Como funciona: a página já versionada no repositório é o MOLDE. Só são trocados os trechos que vêm do texto:
  - <title>, og:title e "headline" do JSON-LD   <- título do dossiê no idioma
  - meta description, og:description e "description" do JSON-LD   <- descrição (veja decide_descricao)
  - "articleBody" do JSON-LD   <- texto puro do conteúdo (primeiros 5000 caracteres)
  - <article id="seo-content">   <- HTML do conteúdo
Todo o resto (canonical www, twitter:card, favicons, versões ?v= dos scripts, estrutura) é preservado
byte a byte, então ajustes feitos à mão no molde não são desfeitos. O endereço vem da coluna `slug`.
Dossiê novo (sem página ainda) usa como molde a página de outro dossiê no mesmo idioma.

--dry-run : mostra o que mudaria, sem gravar.
--check   : como --dry-run, mas sai com código 1 se alguma página estiver defasada.
Em qualquer modo, falhas de rede/dados NUNCA apagam nada: as páginas já versionadas ficam como estão.
"""
import os, sys, re, json, html, urllib.request

SUPABASE_URL = "https://epinzzvsbyglmztasspa.supabase.co"
ANON_KEY = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaW56enZzYnlnbG16dGFzc3BhIiwicm9sZSI6ImFub24i"
            "LCJpYXQiOjE3NzM2MzQxNzQsImV4cCI6MjA4OTIxMDE3NH0.BZSIHOjrVlG5sgmabDe-AInR-90bElUJGSYEead-GIs")  # chave pública (anon)
HEADERS = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
DRY_RUN = "--dry-run" in sys.argv or "--check" in sys.argv
CHECK = "--check" in sys.argv

SUFIXO_TITLE = " — GIZ Oficina Editorial"
LIMITE_DESC = 160
LIMITE_ARTICLE_BODY = 5000
LANGS = (("pt", "", ""), ("en", "en/", "_en"), ("es", "es/", "_es"))  # (idioma, subpasta, sufixo da coluna)


def fetch_dossies():
    url = (SUPABASE_URL + "/rest/v1/dossies"
           "?select=id,slug,titulo,titulo_en,titulo_es,descricao,descricao_en,descricao_es,conteudo,conteudo_en,conteudo_es"
           "&order=criado_em.asc")
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as r:
        return json.loads(r.read())


def strip_data_uris(h):
    return re.sub(r'<img[^>]+src=["\']data:[^"\']+["\'][^>]*>', "", h or "")


def texto_puro(h):
    t = re.sub(r"<[^>]+>", " ", h or "")
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def truncar(t, n=LIMITE_DESC):
    if len(t) <= n:
        return t
    return t[:n - 1].rsplit(" ", 1)[0] + "…"


def norm(t):
    return re.sub(r"\s+", " ", html.unescape(t or "")).strip()


def decide_descricao(atual, db):
    """Descrição que vai na página. Se a que já está na página continua sendo um começo do texto do banco
    (inclusive cortada com …), ela é mantida: algumas foram ajustadas à mão. Se o texto do banco foi
    editado e não bate mais, usa o do banco, cortado em 160 caracteres."""
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
    """Substitui exatamente uma ocorrência; se o molde não tiver o trecho, avisa (molde fora do padrão)."""
    novo, n = re.subn(padrao, lambda m: repl(m), s, count=1, flags=flags)
    if n != 1:
        raise ValueError(f"molde sem o trecho: {padrao[:40]}")
    return novo


def render(molde, d, lang, col):
    titulo = d.get("titulo" + col) or d.get("titulo") or ""
    conteudo = strip_data_uris(d.get("conteudo" + col) or "")
    desc_db = d.get("descricao" + col) or ""
    s = molde
    # descrição atual da página (para decidir se mantém)
    m = re.search(r'<meta name="description" content="([^"]*)"', s)
    atual = html.unescape(m.group(1)) if m else ""
    desc = decide_descricao(atual, desc_db)
    s = sub1(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), s)
    s = sub1(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), s)
    s = sub1(r"(<title>)[^<]*(</title>)", lambda m: m.group(1) + attr(titulo + SUFIXO_TITLE) + m.group(2), s)
    s = sub1(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + attr(titulo) + m.group(2), s)
    # JSON-LD: troca só os 3 campos de texto, mantendo o resto do bloco como está
    s = sub1(r'("headline": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(titulo, ensure_ascii=False), s)
    s = sub1(r'("description": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(desc, ensure_ascii=False), s)
    corpo = texto_puro(conteudo)[:LIMITE_ARTICLE_BODY]
    s = sub1(r'("articleBody": )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + json.dumps(corpo), s)
    s = sub1(r'(<article id="seo-content"[^>]*>\n    ).*?(\n  </article>)', lambda m: m.group(1) + conteudo + m.group(2), s, re.S)
    return s


def ler(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None


def caminho(slug, sub):
    return os.path.join(ROOT, "dossie", slug, *([sub.rstrip("/")] if sub else []), "index.html")


def gravar(path, conteudo):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".new"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(conteudo)
    os.replace(tmp, path)


def molde_de(slug, sub, dossies):
    """Página já existente deste dossiê/idioma; senão a de outro dossiê no mesmo idioma, com o endereço trocado."""
    s = ler(caminho(slug, sub))
    if s is not None:
        return s, False
    for o in dossies:
        outro = o.get("slug")
        if not outro or outro == slug:
            continue
        s = ler(caminho(outro, sub))
        if s is not None:
            return s.replace(f"/dossie/{outro}/", f"/dossie/{slug}/"), True
    return None, False


def main():
    print("Buscando dossiês no Supabase...")
    dossies = fetch_dossies()
    print(f"{len(dossies)} dossiês encontrados.")
    if not dossies:
        print("Nenhum dossiê veio do banco: nada a fazer (páginas versionadas intactas).")
        return 1
    mudou = erros = 0
    for d in dossies:
        slug = (d.get("slug") or "").strip()
        if not slug:
            print(f"  [PULADO] dossiê {d.get('id')} sem slug"); erros += 1; continue
        for lang, sub, col in LANGS:
            rotulo = f"dossie/{slug}/{sub}index.html"
            if not (d.get("conteudo" + col) or "").strip():
                print(f"  {rotulo}: sem conteúdo em {lang}, mantida como está"); continue
            try:
                molde, novo = molde_de(slug, sub, dossies)
                if molde is None:
                    print(f"  {rotulo}: sem molde, pulada"); erros += 1; continue
                saida = render(molde, d, lang, col)
            except Exception as e:
                print(f"  {rotulo}: ERRO {e}"); erros += 1; continue
            atual = ler(caminho(slug, sub))
            if atual == saida:
                print(f"  {rotulo}: igual")
                continue
            mudou += 1
            print(f"  {rotulo}: {'NOVA' if novo else 'ATUALIZADA'} ({len(saida)}b)" + (" [dry-run]" if DRY_RUN else ""))
            if not DRY_RUN:
                gravar(caminho(slug, sub), saida)
    print(f"{mudou} página(s) {'defasada(s)' if DRY_RUN else 'atualizada(s)'}, {erros} erro(s).")
    if erros:
        return 1
    return 1 if (CHECK and mudou) else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"ERRO: {e}")
        sys.exit(1)

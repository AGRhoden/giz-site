#!/usr/bin/env python3
"""
Gera páginas estáticas para cada dossiê em dossie/[slug]/[lang]/index.html
Uso: python3 tools/dossie_build.py [--dry-run]
"""
import os, sys, re, json, unicodedata, urllib.request, base64, subprocess

SUPABASE_URL = "https://epinzzvsbyglmztasspa.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaW56enZzYnlnbG16dGFzc3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzQxNzQsImV4cCI6MjA4OTIxMDE3NH0.BZSIHOjrVlG5sgmabDe-AInR-90bElUJGSYEead-GIs"
HEADERS = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
BASE_URL = "https://giz.art.br"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
DRY_RUN = "--dry-run" in sys.argv

LANG_CONFIG = {
    "pt": {"html_lang": "pt-BR", "field_titulo": "titulo",    "field_conteudo": "conteudo",    "back_label": "← GIZ Dossiê",  "soon": "Conteúdo em breve."},
    "en": {"html_lang": "en",    "field_titulo": "titulo_en", "field_conteudo": "conteudo_en", "back_label": "← GIZ Dossier", "soon": "Content coming soon."},
    "es": {"html_lang": "es",    "field_titulo": "titulo_es", "field_conteudo": "conteudo_es", "back_label": "← GIZ Dosier",  "soon": "Contenido próximamente."},
}

INLINE_CSS = """
  body{margin:0;font-family:laca-variable,sans-serif;color:#111;background:#fff;font-size:16px;line-height:1.6}
  .dp{max-width:720px;margin:0 auto;padding:2rem 1.5rem 4rem}
  .dp-back{font-size:13px;color:#16b35f;text-decoration:none;display:inline-block;margin-bottom:1.5rem}
  .dp-back:hover{text-decoration:underline}
  .dp h1{font-size:2rem;margin:0 0 .5rem;line-height:1.2}
  .dp-desc{color:#6f6f6f;margin:0 0 1.5rem}
  .dp hr{border:none;border-top:1px solid rgba(0,0,0,.12);margin:0 0 2rem}
  .dp-body p{margin:0 0 1.2em}
  .dp-body h2{font-size:1.25rem;margin:2rem 0 .75rem}
  .dp-body h3{font-size:1.05rem;margin:1.5rem 0 .5rem}
  .dp-body img{max-width:100%;height:auto;display:block;margin:1.5rem 0}
  .dp-body blockquote{border-left:3px solid #16b35f;margin:1.5rem 0;padding:.5rem 1rem;color:#444}
"""


def slugify(text):
    text = unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def strip_data_uris(html):
    return re.sub(r'<img[^>]+src=["\']data:[^"\']+["\'][^>]*>', "", html or "")


def fetch_dossies():
    url = (SUPABASE_URL +
           "/rest/v1/dossies"
           "?select=id,titulo,titulo_en,titulo_es,descricao,conteudo,conteudo_en,conteudo_es,thumb_path"
           "&order=criado_em.asc")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def build_page(d, slug, lang):
    cfg = LANG_CONFIG[lang]
    titulo = d.get(cfg["field_titulo"]) or d.get("titulo") or d.get("titulo_en") or ""
    conteudo = strip_data_uris(d.get(cfg["field_conteudo"]) or "")
    descricao = d.get("descricao") or ""
    thumb = d.get("thumb_path") or ""
    thumb_url = f"{BASE_URL}/assets/{thumb}" if thumb else f"{BASE_URL}/assets/giz-logo.png"
    canonical_pt = f"{BASE_URL}/dossie/{slug}/"
    canonical = canonical_pt if lang == "pt" else f"{canonical_pt}{lang}/"
    plain = re.sub(r"<[^>]+>", "", conteudo).strip()
    meta_desc = (descricao or plain[:160]).replace('"', "&quot;")
    hreflang = (
        f'  <link rel="alternate" hreflang="pt-BR" href="{canonical_pt}">\n'
        f'  <link rel="alternate" hreflang="en"    href="{canonical_pt}en/">\n'
        f'  <link rel="alternate" hreflang="es"    href="{canonical_pt}es/">\n'
        f'  <link rel="alternate" hreflang="x-default" href="{canonical_pt}">'
    )
    body = f'<div class="dp-body">{conteudo}</div>' if conteudo else f'<p style="color:#6f6f6f">{cfg["soon"]}</p>'
    desc_html = f'<p class="dp-desc">{descricao}</p>' if descricao else ""
    return f"""<!DOCTYPE html>
<html lang="{cfg['html_lang']}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titulo} — GIZ Oficina Editorial</title>
  <meta name="description" content="{meta_desc}">
  <link rel="canonical" href="{canonical}">
{hreflang}
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{titulo} — GIZ">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:image" content="{thumb_url}">
  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"Article","headline":"{titulo}","description":"{meta_desc}","publisher":{{"@type":"Organization","name":"GIZ Oficina Editorial","url":"{BASE_URL}"}},"url":"{canonical}"}}
  </script>
  <link rel="stylesheet" href="https://use.typekit.net/ccx3zve.css">
  <style>{INLINE_CSS}</style>
</head>
<body>
  <div class="dp">
    <a class="dp-back" href="{BASE_URL}/#dossie">{cfg['back_label']}</a>
    <h1>{titulo}</h1>
    {desc_html}
    <hr>
    {body}
  </div>
</body>
</html>"""


def atomic_write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".new"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    try:
        os.write(fd, content.encode("utf-8"))
    finally:
        os.close(fd)
    os.rename(tmp, path)


def gh_commit(repo_path, content, message):
    sha_r = subprocess.run(
        ["gh", "api", f"repos/AGRhoden/giz-site/contents/{repo_path}", "--jq", ".sha"],
        capture_output=True, text=True
    )
    sha = sha_r.stdout.strip() if sha_r.returncode == 0 else ""
    encoded = base64.b64encode(content.encode("utf-8")).decode()
    cmd = ["gh", "api", "--method", "PUT", f"repos/AGRhoden/giz-site/contents/{repo_path}",
           "-f", f"message={message}", "-f", f"content={encoded}"]
    if sha:
        cmd += ["-f", f"sha={sha}"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode == 0


def main():
    print("Buscando dossiês no Supabase...")
    dossies = fetch_dossies()
    print(f"{len(dossies)} dossiês encontrados.")
    for d in dossies:
        slug = slugify(d.get("titulo") or d.get("titulo_en") or d["id"])
        for lang in ("pt", "en", "es"):
            html = build_page(d, slug, lang)
            sub = "" if lang == "pt" else f"{lang}/"
            repo_path = f"dossie/{slug}/{sub}index.html"
            out_path = os.path.join(ROOT, "dossie", slug, *(([lang] if lang != "pt" else []) + ["index.html"]))
            print(f"  {repo_path} ({len(html)}b)", end=" ")
            if DRY_RUN:
                print("[dry-run]")
                continue
            try:
                atomic_write(out_path, html)
                print("[ok local]")
            except Exception as e:
                print(f"[atomic write: {e}] -> gh api...", end=" ")
                ok = gh_commit(repo_path, html, f"seo: dossiê {slug} [{lang}]")
                print("[ok gh]" if ok else "[ERRO]")


if __name__ == "__main__":
    main()

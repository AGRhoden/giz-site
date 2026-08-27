#!/usr/bin/env python3
"""
Gera páginas estáticas para cada dossiê em dossie/[slug]/index.html
Uso: python3 tools/dossie_build.py [--dry-run]
"""
import os, sys, re, json, unicodedata, urllib.request, urllib.error, base64, subprocess

SUPABASE_URL = "https://epinzzvsbyglmztasspa.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaW56enZzYnlnbG16dGFzc3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzQxNzQsImV4cCI6MjA4OTIxMDE3NH0.BZSIHOjrVlG5sgmabDe-AInR-90bElUJGSYEead-GIs"
HEADERS = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
BASE_URL = "https://giz.art.br"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")

DRY_RUN = "--dry-run" in sys.argv


def slugify(text):
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text


def fetch_dossies():
    url = (SUPABASE_URL +
           "/rest/v1/dossies"
           "?select=id,titulo,titulo_en,titulo_es,descricao,conteudo,conteudo_en,conteudo_es,thumb_path"
           "&order=criado_em.asc")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def strip_data_uris(html):
    """Remove <img> tags with data: URIs (base64 embedded images) — too large for static pages."""
    return re.sub(r'<img[^>]+src=["\']data:[^"\']+["\'][^>]*>', "", html)


def build_page(d, slug):
    titulo_pt = d.get("titulo") or ""
    titulo_en = d.get("titulo_en") or ""
    titulo_es = d.get("titulo_es") or ""
    descricao = d.get("descricao") or ""
    conteudo_pt = strip_data_uris(d.get("conteudo") or "")
    conteudo_en = strip_data_uris(d.get("conteudo_en") or "")
    conteudo_es = strip_data_uris(d.get("conteudo_es") or "")
    thumb = d.get("thumb_path") or ""
    thumb_url = f"{BASE_URL}/assets/{thumb}" if thumb else f"{BASE_URL}/assets/giz-logo.png"

    # Título canônico para <title> e OG: usa PT, fallback EN
    display_title = titulo_pt or titulo_en
    canonical = f"{BASE_URL}/dossie/{slug}/"

    # Conteúdo principal em texto puro para description meta
    plain = re.sub(r"<[^>]+>", "", conteudo_pt or conteudo_en or "").strip()
    meta_desc = (descricao or plain[:160]).replace('"', "&quot;")

    blocks = ""
    if conteudo_pt:
        # PT é o idioma principal — sem cabeçalho de idioma
        blocks += f'<div class="dossie-lang" lang="pt-BR">{conteudo_pt}</div>'
    if conteudo_en:
        label = titulo_en if conteudo_pt else ""
        header = f"<h2>{label}</h2>" if label else ""
        blocks += f'<div class="dossie-lang" lang="en">{header}{conteudo_en}</div>'
    if conteudo_es:
        label = titulo_es if (conteudo_pt or conteudo_en) else ""
        header = f"<h2>{label}</h2>" if label else ""
        blocks += f'<div class="dossie-lang" lang="es">{header}{conteudo_es}</div>'

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{display_title} — GIZ Oficina Editorial</title>
  <meta name="description" content="{meta_desc}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{display_title} — GIZ">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:image" content="{thumb_url}">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{display_title}",
    "description": "{meta_desc}",
    "publisher": {{"@type": "Organization", "name": "GIZ Oficina Editorial", "url": "{BASE_URL}"}},
    "url": "{canonical}"
  }}
  </script>
  <link rel="stylesheet" href="https://use.typekit.net/ccx3zve.css">
  <link rel="stylesheet" href="{BASE_URL}/portfolio.css">
  <style>
    .dossie-page {{ max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }}
    .dossie-page header {{ border-bottom: 1px solid var(--color-line); margin-bottom: 2.5rem; padding-bottom: 1.5rem; }}
    .dossie-page .back {{ font-size: var(--font-size-note); color: var(--color-accent); text-decoration: none; display: inline-block; margin-bottom: 1.5rem; }}
    .dossie-page h1 {{ font-size: var(--font-size-title); margin: 0 0 0.5rem; }}
    .dossie-page .desc {{ color: var(--color-muted); margin: 0; }}
    .dossie-lang + .dossie-lang {{ margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--color-line); }}
    .dossie-lang h2 {{ font-size: 1.1rem; color: var(--color-muted); margin-bottom: 1.5rem; }}
    .dossie-lang p {{ line-height: 1.7; margin: 0 0 1.2em; }}
  </style>
</head>
<body class="portfolio-page">
  <div class="dossie-page">
    <header>
      <a class="back" href="{BASE_URL}/#dossie">&#8592; GIZ Dossiê</a>
      <h1>{display_title}</h1>
      {f'<p class="desc">{descricao}</p>' if descricao else ""}
    </header>
    <main>
      {blocks if blocks else "<p>Conteúdo em breve.</p>"}
    </main>
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
    """Commit a file to GitHub via gh CLI (fallback for filesystem timeout)."""
    sha_result = subprocess.run(
        ["gh", "api", f"repos/AGRhoden/giz-site/contents/{repo_path}", "--jq", ".sha"],
        capture_output=True, text=True
    )
    sha = sha_result.stdout.strip() if sha_result.returncode == 0 else ""
    encoded = base64.b64encode(content.encode("utf-8")).decode()
    cmd = [
        "gh", "api", "--method", "PUT",
        f"repos/AGRhoden/giz-site/contents/{repo_path}",
        "-f", f"message={message}",
        "-f", f"content={encoded}",
    ]
    if sha:
        cmd += ["-f", f"sha={sha}"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0


def main():
    print("Buscando dossiês no Supabase...")
    dossies = fetch_dossies()
    print(f"{len(dossies)} dossiês encontrados.")

    for d in dossies:
        slug = slugify(d.get("titulo") or d.get("titulo_en") or d["id"])
        html = build_page(d, slug)
        out_path = os.path.join(ROOT, "dossie", slug, "index.html")
        repo_path = f"dossie/{slug}/index.html"

        print(f"  {slug}/index.html ({len(html)} bytes)", end=" ")

        if DRY_RUN:
            print("[dry-run]")
            continue

        try:
            atomic_write(out_path, html)
            print("[ok local]")
        except Exception as e:
            print(f"[atomic write falhou: {e}] -> gh api...", end=" ")
            ok = gh_commit(repo_path, html, f"seo: página estática dossiê {slug}")
            print("[ok gh]" if ok else "[ERRO]")

    if not DRY_RUN:
        print("\nPróximo passo: commit dos arquivos dossie/ para o GitHub.")
        print("  gh api para cada arquivo já foi chamado se atomic write falhou.")
        print("  Se atomic write funcionou, commit com gh CLI:")
        print("  cd ~/Documents/giz-site && git add dossie/ && git push  (se git funcionar)")
        print("  ou: python3 tools/dossie_build.py --commit-all")


if __name__ == "__main__":
    main()

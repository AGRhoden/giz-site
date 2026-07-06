#!/usr/bin/env python3
"""
Injeta a lista de projetos publicados no #seo-anchor do index.html.

Uso:
    python3 tools/seo_build.py [--dry-run]

Busca todos os projetos publicados no Supabase e substitui o conteúdo de
#seo-anchor por links de texto simples, visíveis para crawlers mas
posicionados fora da viewport via CSS (position:absolute; left:-9999px).

Execute sempre antes de publicar/fazer deploy do site.
"""

import os, re, sys, requests

SUPABASE_URL = "https://epinzzvsbyglmztasspa.supabase.co"
ANON_KEY     = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaW56enZzYnlnbG16dGFzc3BhIiwic"
    "m9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzQxNzQsImV4cCI6MjA4OTIxMDE3NH0"
    ".BZSIHOjrVlG5sgmabDe-AInR-90bElUJGSYEead-GIs"
)

HEADERS  = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
BASE_URL = "https://giz.art.br"

# Caminho do index.html relativo a este script (tools/seo_build.py → ../index.html)
HERE     = os.path.dirname(os.path.abspath(__file__))
INDEX    = os.path.join(HERE, "..", "index.html")


def fetch_projects():
    url = (f"{SUPABASE_URL}/rest/v1/projects"
           "?status=eq.published&select=slug,titulo,subtitulo,tipo"
           "&order=sort_year.asc,slug.asc&limit=1000")
    r = requests.get(url, headers=HEADERS, timeout=15)
    r.raise_for_status()
    return r.json()


def build_anchor(projects):
    lines = ["<ul>"]
    for p in projects:
        slug   = p.get("slug", "")
        titulo = p.get("titulo", "")
        sub    = p.get("subtitulo") or ""
        label  = f"{titulo} — {sub}".strip(" —") if sub else titulo
        lines.append(f'  <li><a href="#{slug}">{label}</a></li>')
    lines.append("</ul>")
    return "\n".join(lines)


def inject(html: str, anchor_html: str) -> str:
    pattern = r'(<div id="seo-anchor"[^>]*>).*?(</div>)'
    replacement = rf'\g<1>\n{anchor_html}\n\g<2>'
    new_html, n = re.subn(pattern, replacement, html, flags=re.DOTALL)
    if n == 0:
        print("AVISO: #seo-anchor não encontrado no index.html", file=sys.stderr)
    return new_html


def atomic_write(path: str, content: str):
    tmp = path + ".new"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(content)
    os.rename(tmp, path)


def main():
    dry_run = "--dry-run" in sys.argv

    print("Buscando projetos publicados…")
    projects = fetch_projects()
    print(f"  {len(projects)} projetos encontrados")

    anchor_html = build_anchor(projects)

    with open(INDEX, encoding="utf-8") as f:
        html = f.read()

    new_html = inject(html, anchor_html)

    if dry_run:
        print("--- Conteúdo do #seo-anchor (dry-run) ---")
        print(anchor_html)
        return

    atomic_write(INDEX, new_html)
    print(f"index.html atualizado: {len(projects)} projetos no #seo-anchor")


if __name__ == "__main__":
    main()

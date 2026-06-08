"""
process_miolo.py — Extrai páginas de miolo com sombra de lombada.

Uso:
  python3.13 process_miolo.py <arquivo.pdf> --pages "1-15,20-21,68-69" [--slug livro] [--upload]

Saída em output/<slug>/:
  <slug>_p001.jpg   página 1 (folha de rosto, sombra à direita)
  <slug>_p002.jpg   página 2 (verso, sombra à direita)
  <slug>_p003.jpg   página 3 (recto, sombra à esquerda)
  ...

Regra de sombra:
  Página 1 e ímpares → recto (página direita) → sombra na borda ESQUERDA
  Pares              → verso (página esquerda)  → sombra na borda DIREITA
"""

import sys
import re
import json
import argparse
import subprocess
import tempfile
import os
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

SCRIPT_DIR  = Path(__file__).parent
OUTPUT_DIR  = SCRIPT_DIR / "output"
PAGE_W      = 960            # largura de cada página, 2x a resolução anterior p/ nitidez no zoom (spread = 2×960 = 1920px)
PAGE_H      = 1360           # altura (mesma proporção ~14×21, escalada 2x junto com PAGE_W)
SHADOW_W    = 100            # largura do gradiente de sombra em px (escalada 2x junto com PAGE_W/PAGE_H)
SHADOW_MAX  = 130            # opacidade máxima da sombra (0-255)


# ── Seleção de páginas ──────────────────────────────────────────────────────

def parse_pages(spec: str) -> list[int]:
    """
    "1-15, 20-21, 68-69" → [1,2,...,15, 20,21, 68,69]
    "1-15"                → [1..15]
    "5"                   → [5]
    """
    pages = []
    for part in re.split(r'[,;]\s*', spec.strip()):
        part = part.strip()
        if '-' in part:
            a, b = part.split('-', 1)
            pages.extend(range(int(a), int(b) + 1))
        elif part:
            pages.append(int(part))
    return sorted(set(pages))


# ── Renderização ────────────────────────────────────────────────────────────

def get_pdf_page_count(pdf_path: str) -> int:
    import pypdf
    return len(pypdf.PdfReader(pdf_path).pages)


def get_trimbox_px(pdf_path: str, page_num: int, dpi: int):
    """Retorna (left, top, right, bottom) em pixels do TrimBox para o DPI dado."""
    import pypdf
    reader = pypdf.PdfReader(pdf_path)
    page = reader.pages[page_num - 1]
    mb = page.mediabox
    tb = page.trimbox if hasattr(page, "trimbox") and page.trimbox else mb

    mw = float(mb.upper_right[0]) - float(mb.lower_left[0])
    mh = float(mb.upper_right[1]) - float(mb.lower_left[1])

    px_per_pt = dpi / 72
    img_w = int(mw * px_per_pt)
    img_h = int(mh * px_per_pt)

    l = int((float(tb.lower_left[0])  - float(mb.lower_left[0])) * px_per_pt)
    t = int((float(mb.upper_right[1]) - float(tb.upper_right[1])) * px_per_pt)
    r = int((float(tb.upper_right[0]) - float(mb.lower_left[0])) * px_per_pt)
    b = int((float(mb.upper_right[1]) - float(tb.lower_left[1])) * px_per_pt)

    return (l, t, r, b)


def render_page_gs(pdf_path: str, page_num: int, dpi: int) -> Image.Image:
    """Renderiza página com Ghostscript (sRGB) e corta no TrimBox."""
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run([
            "gs", "-dBATCH", "-dNOPAUSE", "-dSAFER", "-dQUIET",
            "-sDEVICE=png16m",
            "-sColorConversionStrategy=sRGB",
            "-dUseCIEColor=true",
            f"-r{dpi}",
            f"-dFirstPage={page_num}", f"-dLastPage={page_num}",
            f"-sOutputFile={tmp_path}",
            pdf_path,
        ], check=True, capture_output=True)
        img = Image.open(tmp_path).convert("RGB")
        img.load()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Corta no TrimBox — remove marcas de corte
    box = get_trimbox_px(pdf_path, page_num, dpi)
    img = img.crop(box)
    return img


# ── Sombra de lombada ───────────────────────────────────────────────────────

def apply_spine_shadow(img: Image.Image, side: str) -> Image.Image:
    """
    Aplica gradiente de sombra simulando a lombada.
    side = 'left'  → sombra cresce da esquerda para direita (recto)
    side = 'right' → sombra cresce da direita para esquerda (verso)
    """
    w, h = img.size
    shadow_w = min(SHADOW_W, w // 6)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for x in range(shadow_w):
        # Gradiente: opaco na borda, transparente para dentro
        if side == "left":
            px = x
            alpha = int(SHADOW_MAX * (1 - x / shadow_w) ** 1.8)
        else:
            px = w - 1 - x
            alpha = int(SHADOW_MAX * (1 - x / shadow_w) ** 1.8)
        draw.line([(px, 0), (px, h)], fill=(0, 0, 0, alpha))

    base = img.convert("RGBA")
    result = Image.alpha_composite(base, overlay)
    return result.convert("RGB")


# ── Fit com fundo branco ────────────────────────────────────────────────────

def fit_page(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """
    Redimensiona pela largura exata (sem bordas brancas laterais).
    Se a altura proporcional exceder target_h, corta pelo centro verticalmente.
    """
    iw, ih = img.size
    # Escala pela largura
    scale = target_w / iw
    nw = target_w
    nh = int(ih * scale)
    resized = img.resize((nw, nh), Image.LANCZOS)

    if nh <= target_h:
        # Página mais curta que o target: fundo branco só embaixo
        canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
        canvas.paste(resized, (0, 0))
        return canvas
    else:
        # Página mais alta: corta pelo centro
        top = (nh - target_h) // 2
        return resized.crop((0, top, target_w, top + target_h))


def make_blank_page(target_w: int, target_h: int) -> Image.Image:
    """Página em branco do mesmo tamanho — usada como página 0."""
    return Image.new("RGB", (target_w, target_h), (255, 255, 255))


# ── Save com limite de tamanho ──────────────────────────────────────────────

def save_jpeg(img: Image.Image, path: Path, max_kb=500, quality_start=88):
    import io
    q = quality_start
    while q >= 60:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=q, optimize=True, progressive=True)
        if buf.tell() / 1024 <= max_kb:
            path.write_bytes(buf.getvalue())
            return buf.tell() / 1024, q
        q -= 3
    img.save(path, format="JPEG", quality=60, optimize=True)
    return path.stat().st_size / 1024, 60


# ── Principal ───────────────────────────────────────────────────────────────

def process_miolo(pdf_path: str, pages: list[int], slug: str,
                  dpi=200, upload=False) -> dict:

    pdf_path = str(Path(pdf_path).resolve())
    total = get_pdf_page_count(pdf_path)
    print(f"  PDF: {total} páginas total")
    print(f"  Exportando: {len(pages)} páginas — {pages[:5]}{'…' if len(pages)>5 else ''}")

    out_dir = OUTPUT_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    outputs = {}

    # Página 0 — branco, para formar spread com a folha de rosto (p001)
    blank = make_blank_page(PAGE_W, PAGE_H)
    blank_path = out_dir / f"{slug}_p000.jpg"
    save_jpeg(blank, blank_path, max_kb=50, quality_start=80)
    outputs[0] = str(blank_path)
    print(f"  → p000: branco ({PAGE_W}×{PAGE_H}px)")

    for page_num in pages:
        if page_num < 1 or page_num > total:
            print(f"  ⚠ Página {page_num} fora do range (1-{total}), pulando")
            continue

        print(f"  → p{page_num:03d}…", end=" ", flush=True)
        raw = render_page_gs(pdf_path, page_num, dpi)

        # Sombra: p1 e ímpares = recto = sombra esquerda; pares = verso = sombra direita
        if page_num == 1 or page_num % 2 == 1:
            shadow_side = "left"
        else:
            shadow_side = "right"

        with_shadow = apply_spine_shadow(raw, shadow_side)
        fitted = fit_page(with_shadow, PAGE_W, PAGE_H)

        out_path = out_dir / f"{slug}_p{page_num:03d}.jpg"
        kb, q = save_jpeg(fitted, out_path, max_kb=1200)
        outputs[page_num] = str(out_path)
        print(f"{out_path.name}  {kb:.0f}KB  (sombra={shadow_side}, q={q})")

    print(f"\n  ✓ {len(outputs)} páginas em output/{slug}/")
    return outputs


def upload_pages(slug: str, outputs: dict):
    """Sobe páginas ao Supabase Storage e vincula ao projeto."""
    try:
        config_js = SCRIPT_DIR.parent.parent / "backend.config.js"
        url_line = key_line = None
        with open(config_js) as f:
            for line in f:
                if "supabaseUrl" in line:
                    url_line = line
                if "supabaseKey" in line or "anonKey" in line:
                    key_line = line

        import re as _re
        supabase_url = _re.search(r'["\']([^"\']+supabase[^"\']+)["\']', url_line).group(1)
        supabase_key = _re.search(r'["\']([a-zA-Z0-9._-]{30,})["\']', key_line).group(1)

        from supabase import create_client
        client = create_client(supabase_url, supabase_key)

        # Garante que projeto existe
        proj = client.table("projects").select("id").eq("slug", slug).execute()
        if not proj.data:
            res = client.table("projects").insert({
                "slug": slug, "title": slug.replace("-", " ").title(), "status": "draft"
            }).execute()
            project_id = res.data[0]["id"]
        else:
            project_id = proj.data[0]["id"]

        bucket = "project-images"
        for page_num, local_path in sorted(outputs.items()):
            fname = f"{slug}/{Path(local_path).name}"
            with open(local_path, "rb") as f:
                data = f.read()
            client.storage.from_(bucket).upload(
                fname, data, {"content-type": "image/jpeg", "upsert": "true"}
            )
            pub_url = client.storage.from_(bucket).get_public_url(fname)
            client.table("project_images").upsert({
                "project_id": project_id,
                "storage_path": pub_url,
                "kind": "interior",
                "sort_order": page_num,
            }).execute()
            print(f"  ↑ p{page_num:03d}: {pub_url}")

        print(f"  ✓ Upload concluído para projeto '{slug}'")

    except Exception as e:
        print(f"  ✗ Erro no upload: {e}")


def main():
    parser = argparse.ArgumentParser(description="Miolo PDF → páginas com sombra de lombada")
    parser.add_argument("pdf", help="Caminho do PDF de miolo")
    parser.add_argument("--pages", required=True,
                        help='Páginas a exportar: "1-15" ou "1-15,20-21,68-69"')
    parser.add_argument("--slug",   help="Slug do projeto (padrão: nome do arquivo)")
    parser.add_argument("--dpi",    type=int, default=300, help="DPI de renderização (padrão: 300)")
    parser.add_argument("--upload", action="store_true", help="Sobe ao Supabase após gerar")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"Arquivo não encontrado: {pdf_path}")
        sys.exit(1)

    from process_pdf import extract_title_slug
    slug = args.slug or extract_title_slug(pdf_path.stem)
    pages = parse_pages(args.pages)

    print(f"\n{'='*50}")
    print(f"PDF:   {pdf_path.name}")
    print(f"Slug:  {slug}")
    print(f"Págs:  {args.pages}  →  {len(pages)} páginas")
    print(f"{'='*50}\n")

    outputs = process_miolo(str(pdf_path), pages, slug, dpi=args.dpi)

    if args.upload:
        print("\nSubindo ao Supabase…")
        upload_pages(slug, outputs)
    else:
        print("Upload pulado. Use --upload para enviar ao Supabase.")

    print(f"\n✓ Concluído: {slug}")


if __name__ == "__main__":
    main()

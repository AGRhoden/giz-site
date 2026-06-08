"""
process_pdf.py — Gera 3 assets a partir de um PDF de gráfica e opcionalmente sobe ao Supabase.

Uso:
  python3 process_pdf.py <arquivo.pdf> [--upload] [--slug "nome-do-projeto"]
  python3 process_pdf.py <arquivo.pdf> --preview   # só mostra detecção, não salva nada

Saída (local, em output/):
  <slug>_01.jpg    1200x1600  frente
  <slug>_02.jpg    1200x1600  verso+lombada
  <slug>_thumb.jpg  400x600   thumbnail
"""

import sys
import os
import json
import argparse
from pathlib import Path
from PIL import Image
from pdf2image import convert_from_path

SCRIPT_DIR = Path(__file__).parent
CONFIG_PATH = SCRIPT_DIR / "config.json"
OUTPUT_DIR  = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

LARGE_SIZE = (1200, 1600)
THUMB_SIZE = (400, 600)


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)


def save_config(cfg):
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def extract_title_slug(pdf_stem):
    """
    Extrai slug do título a partir do nome do arquivo.
    capa_Labirinto_PT-BR_FINAL  →  labirinto
    capa_Sao Vicente_16x23_FINAL → sao-vicente
    """
    import re
    name = pdf_stem.lower()
    # Remove prefixos comuns
    name = re.sub(r'^(capa|miolo|cover|book)[_\s-]+', '', name)
    # Remove sufixos comuns
    name = re.sub(r'[_\s-]+(final|v\d+|pt[-_]?br|en|es|rgb|cmyk|\d+x\d+)([_\s-]|$).*', '', name)
    # Normaliza separadores
    name = re.sub(r'[\s_]+', '-', name)
    name = re.sub(r'-+', '-', name).strip('-')
    return name


def fit_into(img, target_w, target_h, bg=(255, 255, 255)):
    """Contain: escala para caber, preenche sobra com branco. Para imagens grandes."""
    img_w, img_h = img.size
    scale = min(target_w / img_w, target_h / img_h)
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), bg)
    canvas.paste(resized, ((target_w - new_w) // 2, (target_h - new_h) // 2))
    return canvas


def crop_to_fill(img, target_w, target_h):
    """Cover: escala para preencher tudo e corta o excesso pelo centro. Para thumbs."""
    img_w, img_h = img.size
    scale = max(target_w / img_w, target_h / img_h)
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    x = (new_w - target_w) // 2
    y = (new_h - target_h) // 2
    return resized.crop((x, y, x + target_w, y + target_h))


def save_jpeg(img, path, max_kb, quality_start=88):
    """Salva JPEG tentando ficar abaixo de max_kb sem perder qualidade visual."""
    import io
    q = quality_start
    while q >= 60:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=q, optimize=True, progressive=True)
        size_kb = buf.tell() / 1024
        if size_kb <= max_kb:
            with open(path, "wb") as f:
                f.write(buf.getvalue())
            return size_kb, q
        q -= 3
    # Último recurso: salva com q=60
    img.save(path, format="JPEG", quality=60, optimize=True, progressive=True)
    return path.stat().st_size / 1024, 60


def zones_to_high_dpi(zones_low, low_dpi, high_dpi, low_img_size, high_img_size):
    """Converte coordenadas de zona do DPI de detecção para o DPI de saída."""
    scale_x = high_img_size[0] / low_img_size[0]
    scale_y = high_img_size[1] / low_img_size[1]
    result = {}
    for key, box in zones_low.items():
        l, t, r, b = box
        result[key] = (int(l * scale_x), int(t * scale_y), int(r * scale_x), int(b * scale_y))
    return result


def render_pdf_gs(pdf_path, dpi):
    """
    Renderiza PDF com Ghostscript usando perfis ICC para conversão CMYK→sRGB correta.

    Perfil CMYK de entrada : Ipsis_ISO_Coated_v4.icc  (gráfica brasileira, padrão GIZ)
    Perfil RGB de saída    : sRGB Color Space Profile.icm  (Adobe sRGB)

    Retorna imagem PIL.
    """
    import subprocess, tempfile, os
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name

    CMYK_PROFILE = "/Library/ColorSync/Profiles/Ipsis_ISO_Coated_v4.icc"
    SRGB_PROFILE = "/Library/Application Support/Adobe/Color/Profiles/Recommended/sRGB Color Space Profile.icm"

    try:
        cmd = [
            "gs",
            "-dBATCH", "-dNOPAUSE", "-dSAFER", "-dQUIET",
            "-sDEVICE=png16m",
            "-sColorConversionStrategy=UseDeviceIndependentColor",
            f"-sDefaultCMYKProfile={CMYK_PROFILE}",
            f"-sOutputICCProfile={SRGB_PROFILE}",
            f"-r{dpi}",
            f"-sOutputFile={tmp_path}",
            "-dFirstPage=1", "-dLastPage=1",
            pdf_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        img = Image.open(tmp_path).copy()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return img


def generate_assets(pdf_path, slug, detect_result, high_dpi=300, preview=False):
    """Renderiza em alta resolução com gestão de cor e gera os 3 arquivos."""

    print(f"  → Renderizando em {high_dpi}dpi (Ghostscript, sRGB)…")
    img_hi = render_pdf_gs(pdf_path, high_dpi)
    hi_w, hi_h = img_hi.size
    print(f"  → Imagem: {hi_w}x{hi_h}px  modo: {img_hi.mode}")

    low_size = detect_result["img_size"]
    zonas_low = detect_result["zonas"]
    zonas_hi  = zones_to_high_dpi(zonas_low, detect_result["dpi_detect"], high_dpi, low_size, (hi_w, hi_h))

    if preview:
        # Mostra os crops numa janela, sem salvar nada
        import tkinter as tk
        from PIL import ImageTk
        crops = {}
        for zone_key, label in [("frente", "Frente"), ("verso_lombada", "Verso+Lombada")]:
            crop = img_hi.crop(zonas_hi[zone_key])
            crop.thumbnail((700, 900), Image.LANCZOS)
            crops[label] = crop
        frente_crop = img_hi.crop(zonas_hi["frente"])
        frente_crop.thumbnail((700, 900), Image.LANCZOS)
        thumb_preview = frente_crop.copy()
        thumb_preview.thumbnail((300, 400), Image.LANCZOS)
        crops["Thumb"] = thumb_preview

        root = tk.Tk()
        root.title(f"Preview — {slug}")
        root.configure(bg="#222")
        row = tk.Frame(root, bg="#222")
        row.pack(padx=10, pady=10)
        for label, img in crops.items():
            col = tk.Frame(row, bg="#222")
            col.pack(side="left", padx=8)
            tk.Label(col, text=label, bg="#222", fg="white",
                     font=("Helvetica", 11, "bold")).pack()
            tk_img = ImageTk.PhotoImage(img)
            lbl = tk.Label(col, image=tk_img, bg="#222")
            lbl.image = tk_img
            lbl.pack()
        tk.Label(root, text="Feche esta janela para continuar.",
                 bg="#222", fg="#888", font=("Helvetica", 10)).pack(pady=(0,8))
        root.mainloop()
        return {}

    outputs = {}
    for zone_key, num in [("frente", "01"), ("verso_lombada", "02")]:
        crop = img_hi.crop(zonas_hi[zone_key])
        final = fit_into(crop, *LARGE_SIZE)
        out_path = OUTPUT_DIR / f"{slug}_{num}.jpg"
        kb, q = save_jpeg(final, out_path, max_kb=900, quality_start=88)
        outputs[zone_key] = str(out_path)
        label = "frente" if num == "01" else "verso+lombada"
        print(f"  → {label}: {out_path.name}  {kb:.0f}KB  (q={q})")

    frente_crop = img_hi.crop(zonas_hi["frente"])
    thumb = crop_to_fill(frente_crop, *THUMB_SIZE)
    thumb_path = OUTPUT_DIR / f"{slug}_thumb.jpg"
    kb, q = save_jpeg(thumb, thumb_path, max_kb=300, quality_start=90)
    outputs["thumb"] = str(thumb_path)
    print(f"  → thumb:  {thumb_path.name}  {kb:.0f}KB  (q={q})")

    return outputs


def upload_to_supabase(slug, outputs, title=None):
    """Sobe os 3 arquivos ao Supabase Storage e cria rascunho de projeto."""
    try:
        # Carrega credenciais do backend.config.js (parse simples)
        config_js = SCRIPT_DIR.parent.parent / "backend.config.js"
        url_line = key_line = None
        with open(config_js) as f:
            for line in f:
                if "supabaseUrl" in line or "SUPABASE_URL" in line:
                    url_line = line
                if "supabaseKey" in line or "SUPABASE_KEY" in line or "anonKey" in line:
                    key_line = line

        if not url_line or not key_line:
            print("  ✗ Credenciais Supabase não encontradas em backend.config.js")
            return False

        import re
        supabase_url = re.search(r'["\']([^"\']+supabase[^"\']+)["\']', url_line).group(1)
        supabase_key = re.search(r'["\']([a-zA-Z0-9._-]{30,})["\']', key_line).group(1)

        from supabase import create_client
        client = create_client(supabase_url, supabase_key)

        uploaded = {}
        bucket = "project-images"

        for asset_type, local_path in outputs.items():
            file_name = f"{slug}/{Path(local_path).name}"
            with open(local_path, "rb") as f:
                data = f.read()
            res = client.storage.from_(bucket).upload(file_name, data, {"content-type": "image/jpeg", "upsert": "true"})
            pub_url = client.storage.from_(bucket).get_public_url(file_name)
            uploaded[asset_type] = pub_url
            print(f"  ↑ {asset_type}: {pub_url}")

        # Cria rascunho na tabela projects
        project_res = client.table("projects").upsert({
            "slug": slug,
            "title": title or slug.replace("-", " ").title(),
            "status": "draft",
        }, on_conflict="slug").execute()

        if project_res.data:
            project_id = project_res.data[0]["id"]
            # Insere as 3 imagens na tabela project_images
            images = [
                {"project_id": project_id, "storage_path": uploaded["frente"],        "kind": "cover_front", "sort_order": 1},
                {"project_id": project_id, "storage_path": uploaded["verso_lombada"], "kind": "cover_back",  "sort_order": 2},
                {"project_id": project_id, "storage_path": uploaded["thumb"],         "kind": "thumb",       "sort_order": 0},
            ]
            client.table("project_images").upsert(images).execute()
            print(f"  ✓ Projeto '{slug}' (id: {project_id}) salvo como draft com 3 imagens.")
        print(f"  ✓ Projeto '{slug}' salvo como rascunho no Supabase.")
        return True

    except Exception as e:
        print(f"  ✗ Erro no upload: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="PDF de gráfica → assets do site GIZ")
    parser.add_argument("pdf", help="Caminho do PDF")
    parser.add_argument("--slug", help="Slug do projeto (padrão: nome do arquivo)")
    parser.add_argument("--title", help="Título do projeto para o Supabase")
    parser.add_argument("--upload", action="store_true", help="Sobe ao Supabase após gerar")
    parser.add_argument("--preview", action="store_true", help="Só mostra detecção, não gera finais")
    parser.add_argument("--dpi", type=int, default=300, help="DPI de saída (padrão: 300)")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"Arquivo não encontrado: {pdf_path}")
        sys.exit(1)

    slug = args.slug or extract_title_slug(pdf_path.stem)
    print(f"\n{'='*50}")
    print(f"PDF:  {pdf_path.name}")
    print(f"Slug: {slug}  (use --slug para sobrescrever)")
    print(f"{'='*50}")

    cfg = load_config()

    # Tenta encontrar config salvo para este formato pelo tamanho do MediaBox
    from detect_marks import get_pdf_boxes, calculate_zones
    import pypdf as _pypdf
    config_format = None
    try:
        reader = _pypdf.PdfReader(str(pdf_path))
        page = reader.pages[0]
        mb = page.mediabox
        w_mm = round((float(mb.upper_right[0]) - float(mb.lower_left[0])) * 25.4 / 72)
        h_mm = round((float(mb.upper_right[1]) - float(mb.lower_left[1])) * 25.4 / 72)
        fmt_key = f"{w_mm}x{h_mm}_calibrado"
        config_format = cfg.get("known_formats", {}).get(fmt_key)
        if config_format:
            print(f"  ✓ Formato salvo encontrado: {fmt_key}")
        else:
            print(f"  → Formato {w_mm}x{h_mm}mm não calibrado ainda")
    except Exception as e:
        print(f"  → Não foi possível ler dimensões: {e}")

    # Extrai largura de página do nome do arquivo (ex: "14x21" → 140mm, "16x23" → 160mm)
    import re as _re
    page_mm = None
    _fmt_match = _re.search(r'(\d+)x(\d+)', pdf_path.stem, _re.IGNORECASE)
    if _fmt_match:
        pw = int(_fmt_match.group(1))
        # Valores ≤ 30 são interpretados como cm (14 → 140mm); maiores já são mm
        page_mm = pw * 10 if pw <= 30 else pw
        print(f"  → Largura de página extraída do nome: {page_mm}mm")

    print("\n[1/3] Detectando marcas e zonas…")
    detect = calculate_zones(str(pdf_path), dpi=150, config_format=config_format, page_mm=page_mm)

    if "error" in detect:
        print(f"  ✗ {detect['error']}")
        print("  → Execute: python3 calibrate.py <arquivo.pdf>")
        sys.exit(1)

    if detect.get("zonas") is None:
        print(f"  ✗ {detect.get('warning', 'Zonas não detectadas.')}")
        print("  → Execute: python3 calibrate.py <arquivo.pdf>")
        sys.exit(1)

    source = detect.get("source", "auto")
    print(f"  ✓ Zonas detectadas (fonte: {source})")
    for k, v in detect["zonas"].items():
        print(f"     {k}: {v}")

    print(f"\n[2/3] Gerando assets ({args.dpi}dpi)…")
    outputs = generate_assets(str(pdf_path), slug, detect, high_dpi=args.dpi, preview=args.preview)

    if args.preview:
        print("\n✓ Preview gerado. Verifique os arquivos em output/ e ajuste se necessário.")
        print("  → Para calibrar: python3 calibrate.py <arquivo.pdf>")
        sys.exit(0)

    if args.upload:
        print("\n[3/3] Subindo ao Supabase…")
        upload_to_supabase(slug, outputs, title=args.title)
    else:
        print("\n[3/3] Upload pulado. Adicione --upload para enviar ao Supabase.")

    print(f"\n✓ Concluído: {slug}")


if __name__ == "__main__":
    main()

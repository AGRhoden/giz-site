"""
Detecta marcas de corte e dobra em PDF de gráfica (InDesign print-ready).
Estratégia:
  1. Lê TrimBox/BleedBox do PDF (InDesign exporta isso por padrão).
  2. Se TrimBox ausente, renderiza em baixo DPI e usa detecção de linhas finas.
  3. Retorna zonas em pixels para a resolução desejada.
"""

import pypdf
from pdf2image import convert_from_path
from PIL import Image
import math


def mm_to_pt(mm):
    return mm * 72 / 25.4


def pt_to_px(pt, dpi):
    return pt * dpi / 72


def get_pdf_boxes(pdf_path):
    """Lê MediaBox, TrimBox e BleedBox do PDF."""
    reader = pypdf.PdfReader(pdf_path)
    page = reader.pages[0]

    def box_to_mm(box):
        if box is None:
            return None
        return {
            "x0": float(box.lower_left[0]) * 25.4 / 72,
            "y0": float(box.lower_left[1]) * 25.4 / 72,
            "x1": float(box.upper_right[0]) * 25.4 / 72,
            "y1": float(box.upper_right[1]) * 25.4 / 72,
            "w":  (float(box.upper_right[0]) - float(box.lower_left[0])) * 25.4 / 72,
            "h":  (float(box.upper_right[1]) - float(box.lower_left[1])) * 25.4 / 72,
        }

    media = box_to_mm(page.mediabox)
    trim  = box_to_mm(page.trimbox)  if hasattr(page, "trimbox")  else None
    bleed = box_to_mm(page.bleedbox) if hasattr(page, "bleedbox") else None

    return media, trim, bleed


def zones_from_boxes(media_mm, trim_mm, bleed_mm, img_w, img_h, config_format):
    """
    Calcula zonas de corte (frente e verso_lombada) em pixels
    a partir dos boxes do PDF e das dimensões da imagem renderizada.

    Retorna dict: {"frente": (left, top, right, bottom), "verso_lombada": ...}
    """

    if trim_mm is None:
        return None  # fallback para detecção visual

    # escala: quantos pixels por mm
    px_per_mm_x = img_w / media_mm["w"]
    px_per_mm_y = img_h / media_mm["h"]

    # coordenadas do TrimBox em pixels (origin PDF = bottom-left; imagem = top-left)
    trim_left   = (trim_mm["x0"] - media_mm["x0"]) * px_per_mm_x
    trim_right  = (trim_mm["x1"] - media_mm["x0"]) * px_per_mm_x
    trim_top    = (media_mm["y1"] - trim_mm["y1"]) * px_per_mm_y
    trim_bottom = (media_mm["y1"] - trim_mm["y0"]) * px_per_mm_y

    trim_px = {
        "left":   int(trim_left),
        "top":    int(trim_top),
        "right":  int(trim_right),
        "bottom": int(trim_bottom),
    }

    # A largura do trim contém: orelha + verso + lombada + frente + orelha (se houver)
    # As dobras (lombada/orelha) não estão no TrimBox — precisamos das medidas do config
    # ou de detecção. Se config_format tiver zonas salvas, usa direto.
    return trim_px


def detect_fold_lines(img, trim_px, dpi, sensitivity=0.85):
    """
    Detecta marcas de dobra na faixa BRANCA de margem acima/abaixo do TrimBox.

    Estratégia:
    - Varre colunas em CADA strip (topo e base) separadamente.
    - Marca válida = coluna com pixel escuro em linhas brancas de AMBOS os strips.
    - A intersecção elimina ruído de texto (só no topo) e ruído de arte (só na base).
    """
    import numpy as np

    img_w, img_h = img.size
    l, t, r, b = trim_px["left"], trim_px["top"], trim_px["right"], trim_px["bottom"]
    width = r - l

    strip_top  = img.crop((l, 0,      r, t - 2)) if t > 4      else None
    strip_bot  = img.crop((l, b + 2,  r, img_h)) if b < img_h - 4 else None

    def col_hits(strip):
        """Conjunto de colunas com >=1 pixel escuro em alguma linha branca."""
        if strip is None:
            return None
        arr = np.array(strip.convert("L"))
        row_means = arr.mean(axis=1)
        white_rows = np.where(row_means > 220)[0]
        if len(white_rows) == 0:
            return set()
        arr_white = arr[white_rows, :]
        col_dark = (arr_white < 80).sum(axis=0)
        return set(np.where(col_dark >= 1)[0])

    hits_top = col_hits(strip_top)
    hits_bot = col_hits(strip_bot)

    if hits_top is None and hits_bot is None:
        return []

    if hits_top is None:
        combined = hits_bot
    elif hits_bot is None:
        combined = hits_top
    else:
        # Intersecção com tolerância de ±2px: coluna 'c' do topo vale se algum
        # coluna a até 2px de distância existir no strip de baixo.
        tol = 2
        combined = set()
        for c in hits_top:
            for dc in range(-tol, tol + 1):
                if (c + dc) in hits_bot:
                    combined.add(c)
                    break

    if not combined:
        return []

    # Exclui os primeiros e últimos ~50mm — marcas de corte das bordas do trim.
    # Dobras (orelha, lombada) ficam pelo menos 50mm dentro das bordas.
    edge_px = max(3, int(50 / 25.4 * dpi))
    combined = {c for c in combined if c > edge_px and c < (width - edge_px)}

    if not combined:
        return []

    # Agrupa colunas adjacentes e calcula o centro de cada grupo (= posição da marca).
    sorted_cols = sorted(combined)
    gap_px = max(4, int(3 / 25.4 * dpi))  # colunas a <=3mm são a mesma marca
    groups = []
    g = [sorted_cols[0]]
    for c in sorted_cols[1:]:
        if c - g[-1] <= gap_px:
            g.append(c)
        else:
            groups.append(g)
            g = [c]
    groups.append(g)

    fold_xs = [l + (g[0] + g[-1]) // 2 for g in groups]

    # Sanidade: dobras reais são no máximo 6 (2 orelhas × 2 lados + lombada × 2).
    if len(fold_xs) > 6:
        return []

    return fold_xs


def calculate_zones(pdf_path, dpi=150, config_format=None, page_mm=None):
    """
    Entrada: caminho do PDF e DPI para renderização de detecção.
    Saída: dict com zonas em pixels para renderização em DPI alto.

    config_format: dict de um formato salvo (pode ter zonas pré-calibradas).
    """
    media_mm, trim_mm, bleed_mm = get_pdf_boxes(pdf_path)

    import subprocess, tempfile, os as _os
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as _tmp:
        _tmp_path = _tmp.name
    try:
        _CMYK = "/Library/ColorSync/Profiles/Ipsis_ISO_Coated_v4.icc"
        _SRGB = "/Library/Application Support/Adobe/Color/Profiles/Recommended/sRGB Color Space Profile.icm"
        subprocess.run([
            "gs", "-dBATCH", "-dNOPAUSE", "-dSAFER", "-dQUIET",
            "-sDEVICE=png16m",
            "-sColorConversionStrategy=UseDeviceIndependentColor",
            f"-sDefaultCMYKProfile={_CMYK}",
            f"-sOutputICCProfile={_SRGB}",
            f"-r{dpi}", f"-sOutputFile={_tmp_path}",
            "-dFirstPage=1", "-dLastPage=1", pdf_path,
        ], check=True, capture_output=True)
        from PIL import Image as _Image
        img = _Image.open(_tmp_path).copy()
    finally:
        if _os.path.exists(_tmp_path):
            _os.unlink(_tmp_path)
    img_w, img_h = img.size

    # Se o config tem zonas salvas (calibradas), converte para pixel neste DPI
    if config_format and config_format.get("zonas", {}).get("frente"):
        import json as _json
        from pathlib import Path as _Path
        cfg_root = _json.load(open(_Path(__file__).parent / "config.json"))
        inset = int(cfg_root.get("fold_inset_px", 0))

        saved = config_format["zonas"]
        ff = saved["frente"]
        vf = saved["verso_lombada"]

        # Y (topo e base): usa TrimBox se disponível — evita incluir marcas de corte
        # X (dobras): usa calibração manual
        trim_px = zones_from_boxes(media_mm, trim_mm, bleed_mm, img_w, img_h, None)
        if trim_px:
            top    = trim_px["top"]
            bottom = trim_px["bottom"]
        else:
            top    = int(ff[1] * img_h)
            bottom = int(ff[3] * img_h)

        frente = (int(ff[0] * img_w) + inset, top, int(ff[2] * img_w),     bottom)
        verso  = (int(vf[0] * img_w),         top, int(vf[2] * img_w) - inset, bottom)

        return {
            "zonas": {"frente": frente, "verso_lombada": verso},
            "source": "config",
            "dpi_detect": dpi,
            "img_size": (img_w, img_h),
        }

    trim_px = zones_from_boxes(media_mm, trim_mm, bleed_mm, img_w, img_h, config_format)

    if trim_px is None:
        return {
            "error": "TrimBox não encontrado no PDF e nenhum config salvo. Use calibrate.py.",
            "img_size": (img_w, img_h),
        }

    fold_xs = detect_fold_lines(img, trim_px, dpi)

    result = {
        "trim_px": trim_px,
        "fold_xs": fold_xs,
        "source": "auto",
        "dpi_detect": dpi,
        "img_size": (img_w, img_h),
        "media_mm": media_mm,
        "trim_mm": trim_mm,
    }

    def identify_spine(xs):
        """
        Dado uma lista de 2–4 dobras, identifica o par de lombada (gap menor)
        e as dobras de orelha (externas, se houver).

        Retorna (spine_left, spine_right, orelha_esq_or_None, orelha_dir_or_None)
        """
        if len(xs) == 2:
            return xs[0], xs[1], None, None
        if len(xs) == 3:
            # O par mais próximo é a lombada
            gaps = [(xs[i+1] - xs[i], i) for i in range(len(xs)-1)]
            _, best = min(gaps)
            sl, sr = xs[best], xs[best+1]
            outer = [x for x in xs if x != sl and x != sr]
            if outer[0] < sl:
                return sl, sr, outer[0], None
            else:
                return sl, sr, None, outer[0]
        if len(xs) == 4:
            # Par central = lombada; externos = orelhas
            return xs[1], xs[2], xs[0], xs[3]
        return None, None, None, None

    page_px = int(round(page_mm / 25.4 * dpi)) if page_mm else None

    if len(fold_xs) >= 2:
        spine_left, spine_right, orelha_esq, orelha_dir = identify_spine(fold_xs)

        # Borda esquerda do verso: orelha_esq (exclui a orelha) ou page_mm ou trim_left
        if orelha_esq is not None:
            verso_left = orelha_esq
        elif page_px:
            verso_left = spine_left - page_px
        else:
            result["zonas"] = None
            result["warning"] = (
                "Marcas de lombada detectadas mas orelha esquerda não encontrada; "
                "largura de página desconhecida. Use calibrate.py ou nomeie o arquivo "
                "com o formato (ex: '14x21')."
            )
            return result

        # Borda direita da frente: orelha_dir (exclui a orelha) ou page_mm ou trim_right
        if orelha_dir is not None:
            frente_right = orelha_dir
        elif page_px:
            frente_right = spine_right + page_px
        else:
            result["zonas"] = None
            result["warning"] = (
                "Marcas de lombada detectadas mas orelha direita não encontrada; "
                "largura de página desconhecida. Use calibrate.py ou nomeie o arquivo "
                "com o formato (ex: '14x21')."
            )
            return result

        result["zonas"] = {
            "frente":        (spine_right, trim_px["top"], frente_right, trim_px["bottom"]),
            "verso_lombada": (verso_left,  trim_px["top"], spine_right,  trim_px["bottom"]),
        }

    elif len(fold_xs) == 1:
        spine_right = fold_xs[0]
        if page_px:
            result["zonas"] = {
                "frente":        (spine_right,           trim_px["top"], spine_right + page_px, trim_px["bottom"]),
                "verso_lombada": (spine_right - page_px, trim_px["top"], spine_right,           trim_px["bottom"]),
            }
        else:
            result["zonas"] = None
            result["warning"] = (
                "Apenas uma marca detectada; largura de página desconhecida. "
                "Use calibrate.py para salvar este formato."
            )
    else:
        result["zonas"] = None
        result["warning"] = "Nenhuma dobra detectada automaticamente. Use calibrate.py."

    return result

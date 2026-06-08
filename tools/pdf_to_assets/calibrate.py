"""
calibrate.py — Calibração visual com guias de TrimBox e marcas de corte.

Mostra o PDF renderizado com:
  - Retângulo vermelho tracejado = TrimBox (área de corte real, sem sangria)
  - Linhas azuis = dobras detectadas automaticamente
  - Você clica nos 4 cantos das 2 zonas (frente e verso+lombada)
  - Snap automático às linhas guia detectadas
"""

import sys
import json
import tkinter as tk
from tkinter import messagebox
from pathlib import Path
from PIL import Image, ImageTk, ImageDraw
from pdf2image import convert_from_path
import pypdf

SCRIPT_DIR  = Path(__file__).parent
CONFIG_PATH = SCRIPT_DIR / "config.json"
DISPLAY_MAX_W = 1300
DISPLAY_MAX_H = 860

ROXO    = "#610e7f"
VERMELHO = "#e53935"
AZUL    = "#1565c0"
VERDE   = "#2e7d32"
SNAP_PX = 12  # pixels de tolerância para snap


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)

def save_config(cfg):
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def get_trim_rect(pdf_path, img_w, img_h):
    """Retorna TrimBox em pixels de display, se disponível."""
    try:
        reader = pypdf.PdfReader(str(pdf_path))
        page = reader.pages[0]
        mb = page.mediabox
        tb = page.trimbox if hasattr(page, "trimbox") else None
        if tb is None:
            return None, None, None

        media_w_pt = float(mb.upper_right[0]) - float(mb.lower_left[0])
        media_h_pt = float(mb.upper_right[1]) - float(mb.lower_left[1])

        trim_x0 = float(tb.lower_left[0])  - float(mb.lower_left[0])
        trim_y0 = float(mb.upper_right[1]) - float(tb.upper_right[1])  # flip Y
        trim_x1 = float(tb.upper_right[0]) - float(mb.lower_left[0])
        trim_y1 = float(mb.upper_right[1]) - float(tb.lower_left[1])

        sx = img_w / media_w_pt
        sy = img_h / media_h_pt

        trim_px = (int(trim_x0*sx), int(trim_y0*sy), int(trim_x1*sx), int(trim_y1*sy))

        # Dimensões em mm para chave de config
        w_mm = round(media_w_pt * 25.4 / 72)
        h_mm = round(media_h_pt * 25.4 / 72)
        fmt_key = f"{w_mm}x{h_mm}_calibrado"

        return trim_px, fmt_key, (w_mm, h_mm)
    except Exception as e:
        print(f"  TrimBox não lido: {e}")
        return None, None, None


def detect_fold_lines_simple(img_pil, trim_px):
    """
    Detecta marcas de dobra na faixa BRANCA de margem acima/abaixo do TrimBox.
    Usa intersecção do strip superior e inferior: marca válida aparece em AMBOS,
    eliminando ruído de texto (só no topo) e ruído de arte/sangria (só na base).
    """
    import numpy as np
    l, t, r, b = trim_px
    img_w, img_h = img_pil.size
    width = r - l

    strip_top = img_pil.crop((l, 0,     r, t - 2)) if t > 4          else None
    strip_bot = img_pil.crop((l, b + 2, r, img_h)) if b < img_h - 4  else None

    def col_hits(strip):
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
        tol = 2
        combined = set()
        for c in hits_top:
            for dc in range(-tol, tol + 1):
                if (c + dc) in hits_bot:
                    combined.add(c)
                    break

    if not combined:
        return []

    # Exclui marcas de corte (~50mm das bordas) — dobras ficam bem dentro
    dpi_est = img_w / (trim_px[2] - trim_px[0]) * 150  # estimativa
    edge_px = max(3, int(50 / 25.4 * 150))
    combined = {c for c in combined if c > edge_px and c < (width - edge_px)}

    if not combined:
        return []

    # Agrupa adjacentes e calcula centro de cada grupo
    sorted_cols = sorted(combined)
    gap_px = max(4, int(3 / 25.4 * 150))
    groups = []
    g = [sorted_cols[0]]
    for c in sorted_cols[1:]:
        if c - g[-1] <= gap_px:
            g.append(c)
        else:
            groups.append(g)
            g = [c]
    groups.append(g)

    folds = [l + (g[0] + g[-1]) // 2 for g in groups]

    if len(folds) > 6:
        return []

    return folds


class Calibrator:
    STEPS = [
        ("frente",        "canto SUPERIOR-ESQUERDO da FRENTE (direita do spread)"),
        ("frente",        "canto INFERIOR-DIREITO da FRENTE"),
        ("verso_lombada", "canto SUPERIOR-ESQUERDO do VERSO+LOMBADA (esquerda)"),
        ("verso_lombada", "canto INFERIOR-DIREITO do VERSO+LOMBADA"),
    ]

    def __init__(self, root, img_pil, pdf_path):
        self.root = root
        self.original = img_pil
        self.pdf_path = Path(pdf_path)
        self.step = 0
        self.clicks = {}
        self.snap_guides = []  # linhas verticais para snap (x em display)
        self.trim_rect = None  # (l,t,r,b) em display

        # Escala para display
        scale_w = DISPLAY_MAX_W / img_pil.width
        scale_h = DISPLAY_MAX_H / img_pil.height
        self.scale = min(scale_w, scale_h, 1.0)
        dw = int(img_pil.width  * self.scale)
        dh = int(img_pil.height * self.scale)
        self.disp_img = img_pil.resize((dw, dh), Image.LANCZOS)

        root.title(f"Calibração — {self.pdf_path.name}")
        root.configure(bg="#f0f0f0")

        # --- Instrução ---
        self.lbl = tk.Label(root, text="", font=("Helvetica", 13),
                             fg=ROXO, bg="#f0f0f0", pady=8, padx=10, anchor="w")
        self.lbl.pack(fill="x")

        # --- Legenda ---
        leg = tk.Frame(root, bg="#f0f0f0")
        leg.pack(fill="x", padx=10)
        tk.Label(leg, text="━━  TrimBox (corte real)",
                 fg=VERMELHO, bg="#f0f0f0", font=("Helvetica", 10)).pack(side="left", padx=8)
        tk.Label(leg, text="│  Dobra detectada (snap)",
                 fg=AZUL, bg="#f0f0f0", font=("Helvetica", 10)).pack(side="left", padx=8)
        tk.Label(leg, text="■  Frente",
                 fg=ROXO, bg="#f0f0f0", font=("Helvetica", 10)).pack(side="left", padx=8)
        tk.Label(leg, text="■  Verso+Lombada",
                 fg="#e07b00", bg="#f0f0f0", font=("Helvetica", 10)).pack(side="left", padx=8)

        # --- Canvas ---
        self.canvas = tk.Canvas(root, width=dw, height=dh, cursor="crosshair", bg="white")
        self.canvas.pack(padx=10, pady=(4, 0))
        self.tk_img = ImageTk.PhotoImage(self.disp_img)
        self.canvas.create_image(0, 0, anchor="nw", image=self.tk_img)
        self.canvas.bind("<Button-1>", self.on_click)
        self.canvas.bind("<Motion>", self.on_move)

        # Cursor cruzado manual
        self.cursor_h = self.canvas.create_line(0, 0, 0, 0, fill="#aaa", width=1, dash=(4,4))
        self.cursor_v = self.canvas.create_line(0, 0, 0, 0, fill="#aaa", width=1, dash=(4,4))

        # --- Botões ---
        btn_row = tk.Frame(root, bg="#f0f0f0")
        btn_row.pack(fill="x", padx=10, pady=8)
        self.btn_undo = tk.Button(btn_row, text="↩ Desfazer último ponto",
                                   command=self.undo, font=("Helvetica", 11),
                                   bg="#f0f0f0", relief="flat", fg="#555")
        self.btn_undo.pack(side="left")
        self.btn_save = tk.Button(btn_row, text="✓  Salvar e fechar",
                                   command=self.save_and_quit, state="disabled",
                                   font=("Helvetica", 11, "bold"),
                                   bg=ROXO, fg="white", relief="flat", padx=16, pady=6)
        self.btn_save.pack(side="right")

        # Detecta guias e desenha
        self._detect_and_draw_guides()
        self.prompt()

    def _detect_and_draw_guides(self):
        dw, dh = self.disp_img.size

        # TrimBox
        trim_px_orig, self.fmt_key, self.media_mm = get_trim_rect(
            self.pdf_path, self.original.width, self.original.height)

        if trim_px_orig:
            l, t, r, b = trim_px_orig
            # Escala para display
            self.trim_rect = (
                int(l * self.scale), int(t * self.scale),
                int(r * self.scale), int(b * self.scale)
            )
            lt, tt, rt, bt = self.trim_rect
            # Desenha borda tracejada vermelha
            self.canvas.create_rectangle(lt, tt, rt, bt,
                                          outline=VERMELHO, width=2, dash=(8, 4),
                                          tags="guides")
            # Adiciona bordas horizontais como guias de snap
            self.snap_guides.append(("h", tt))
            self.snap_guides.append(("h", bt))

            # Detecta dobras dentro do trim
            try:
                folds = detect_fold_lines_simple(self.original, trim_px_orig)
                for fx in folds:
                    fx_disp = int(fx * self.scale)
                    self.canvas.create_line(fx_disp, 0, fx_disp, dh,
                                             fill=AZUL, width=1, dash=(6, 3), tags="guides")
                    self.snap_guides.append(("v", fx_disp))
            except Exception as e:
                print(f"  Detecção de dobras: {e}")

            # Bordas verticais do trim
            self.snap_guides.append(("v", lt))
            self.snap_guides.append(("v", rt))
        else:
            self.fmt_key = None
            self.media_mm = None

    def snap(self, x, y):
        """Aplica snap se perto de uma guia."""
        sx, sy = x, y
        for kind, pos in self.snap_guides:
            if kind == "v" and abs(x - pos) <= SNAP_PX:
                sx = pos
            if kind == "h" and abs(y - pos) <= SNAP_PX:
                sy = pos
        return sx, sy

    def on_move(self, event):
        dw, dh = self.disp_img.size
        sx, sy = self.snap(event.x, event.y)
        self.canvas.coords(self.cursor_h, 0, sy, dw, sy)
        self.canvas.coords(self.cursor_v, sx, 0, sx, dh)

    def on_click(self, event):
        if self.step >= len(self.STEPS):
            return
        zone, desc = self.STEPS[self.step]
        sx, sy = self.snap(event.x, event.y)

        if zone not in self.clicks:
            self.clicks[zone] = []
        self.clicks[zone].append((sx, sy))

        # Marca ponto
        r = 6
        color = ROXO if zone == "frente" else "#e07b00"
        tag = f"pt_{zone}_{len(self.clicks[zone])}"
        self.canvas.create_oval(sx-r, sy-r, sx+r, sy+r,
                                 fill=color, outline="white", width=2, tags=tag)
        self.canvas.create_text(sx+10, sy-10, text=f"{self.step+1}",
                                 fill=color, font=("Helvetica", 9, "bold"), tags=tag)

        # Quando 2 pontos → desenha retângulo
        if len(self.clicks[zone]) == 2:
            x0, y0 = self.clicks[zone][0]
            x1, y1 = self.clicks[zone][1]
            label = "FRENTE" if zone == "frente" else "VERSO+LOMBADA"
            rtag = f"rect_{zone}"
            self.canvas.delete(rtag)
            self.canvas.create_rectangle(
                min(x0,x1), min(y0,y1), max(x0,x1), max(y0,y1),
                outline=color, width=2, fill=color+"22", tags=rtag
            )
            self.canvas.create_text(
                (x0+x1)//2, (y0+y1)//2, text=label,
                fill=color, font=("Helvetica", 11, "bold"), tags=rtag
            )

        self.step += 1
        self.prompt()

    def undo(self):
        if self.step == 0:
            return
        self.step -= 1
        zone, _ = self.STEPS[self.step]
        if self.clicks.get(zone):
            self.clicks[zone].pop()
        # Remove marca visual
        self.canvas.delete(f"pt_{zone}_{len(self.clicks.get(zone, []))+1}")
        self.canvas.delete(f"rect_{zone}")
        self.prompt()

    def prompt(self):
        if self.step < len(self.STEPS):
            _, desc = self.STEPS[self.step]
            self.lbl.config(text=f"Passo {self.step+1}/4 → Clique no {desc}")
            self.btn_save.config(state="disabled")
        else:
            self.lbl.config(text="✓ Zonas definidas. Verifique os retângulos e salve.")
            self.btn_save.config(state="normal")

    def save_and_quit(self):
        dw, dh = self.disp_img.size
        ow, oh = self.original.size

        def to_frac(zone):
            pts = self.clicks[zone]
            x0 = min(pts[0][0], pts[1][0]) / dw
            y0 = min(pts[0][1], pts[1][1]) / dh
            x1 = max(pts[0][0], pts[1][0]) / dw
            y1 = max(pts[0][1], pts[1][1]) / dh
            return [round(x0,4), round(y0,4), round(x1,4), round(y1,4)]

        fmt_key = self.fmt_key or (self.pdf_path.stem.replace(" ","_") + "_calibrado")

        cfg = load_config()
        cfg.setdefault("known_formats", {})[fmt_key] = {
            "label": fmt_key,
            "source": "calibrate.py",
            "pdf_name_ref": self.pdf_path.name,
            "zonas": {
                "frente":        to_frac("frente"),
                "verso_lombada": to_frac("verso_lombada"),
            }
        }
        save_config(cfg)
        messagebox.showinfo(
            "Salvo!",
            f"Formato '{fmt_key}' salvo.\n\nAgora selecione o PDF na janela principal e rode o Preview."
        )
        self.root.destroy()


def main():
    if len(sys.argv) < 2:
        print("Uso: python3.13 calibrate.py <arquivo.pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    import subprocess, tempfile, os as _os
    print(f"Renderizando {Path(pdf_path).name} em 120dpi (Ghostscript)…")
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as _tmp:
        _tmp_path = _tmp.name
    try:
        subprocess.run([
            "gs", "-dBATCH", "-dNOPAUSE", "-dSAFER", "-dQUIET",
            "-sDEVICE=png16m", "-sColorConversionStrategy=sRGB", "-dUseCIEColor=true",
            "-r120", f"-sOutputFile={_tmp_path}",
            "-dFirstPage=1", "-dLastPage=1", pdf_path,
        ], check=True, capture_output=True)
        img = Image.open(_tmp_path).copy()
    finally:
        if _os.path.exists(_tmp_path):
            _os.unlink(_tmp_path)
    print(f"Imagem: {img.size[0]}x{img.size[1]}px")

    root = tk.Tk()
    app = Calibrator(root, img, pdf_path)
    root.mainloop()


if __name__ == "__main__":
    main()

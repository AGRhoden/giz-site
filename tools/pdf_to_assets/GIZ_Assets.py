"""
GIZ Assets — Interface principal
Abre com duplo-clique ou: python3 GIZ_Assets.py
"""

import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from pathlib import Path
import threading
import sys
import json
import subprocess

SCRIPT_DIR = Path(__file__).parent
CONFIG_PATH = SCRIPT_DIR / "config.json"
OUTPUT_DIR  = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

ROXO   = "#610e7f"
BRANCO = "#ffffff"
CINZA  = "#f4f4f4"
TEXTO  = "#222222"


def load_config():
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return json.load(f)
    return {"known_formats": {}}


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("GIZ — Gerador de Assets")
        self.configure(bg=BRANCO)
        self.resizable(False, False)

        self.pdf_paths = []
        self.upload_var = tk.BooleanVar(value=False)
        self.slug_var   = tk.StringVar()

        self._build_ui()
        self.center()

    def center(self):
        self.update_idletasks()
        w = max(self.winfo_reqwidth(), 660)
        h = max(self.winfo_reqheight(), 600)
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        self.geometry(f"{w}x{h}+{(sw-w)//2}+{(sh-h)//2}")

    def _build_ui(self):
        # Cabeçalho
        header = tk.Frame(self, bg=ROXO)
        header.pack(fill="x")
        tk.Label(header, text="GIZ  ·  Assets", bg=ROXO, fg=BRANCO,
                 font=("Helvetica", 15, "bold"), pady=12).pack()

        # Abas
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=0, pady=0)

        tab_capa  = tk.Frame(self.notebook, bg=BRANCO)
        tab_miolo = tk.Frame(self.notebook, bg=BRANCO)
        self.notebook.add(tab_capa,  text="  Capa  ")
        self.notebook.add(tab_miolo, text="  Miolo  ")

        self._build_capa_tab(tab_capa)
        self._build_miolo_tab(tab_miolo)

        # Rodapé global
        footer = tk.Frame(self, bg=CINZA)
        footer.pack(fill="x", side="bottom")
        tk.Button(footer, text="Calibrar novo formato…", command=self.calibrate,
                  bg=CINZA, fg=ROXO, font=("Helvetica", 10), relief="flat",
                  cursor="hand2", pady=6, bd=0).pack(side="left", padx=12)
        tk.Label(footer, text="Saída: tools/pdf_to_assets/output/",
                 bg=CINZA, fg="#888", font=("Helvetica", 10)).pack(side="right", padx=12, pady=6)

    def _build_capa_tab(self, parent):

        # Área principal
        body = tk.Frame(self, bg=BRANCO, padx=30, pady=20)
        body.pack(fill="both", expand=True)

        # --- Passo 1: Selecionar PDFs ---
        self._step_label(body, "1", "Selecionar PDFs")

        self.file_frame = tk.Frame(body, bg=CINZA, bd=1, relief="flat")
        self.file_frame.pack(fill="x", pady=(4, 12))

        self.file_label = tk.Label(self.file_frame, text="Nenhum arquivo selecionado",
                                   bg=CINZA, fg="#888", font=("Helvetica", 11),
                                   anchor="w", padx=10, pady=10)
        self.file_label.pack(fill="x")

        btn_row = tk.Frame(body, bg=BRANCO)
        btn_row.pack(fill="x", pady=(0, 16))
        self._btn(btn_row, "Escolher PDF(s)…", self.choose_files).pack(side="left")
        self._btn(btn_row, "Escolher pasta…",  self.choose_folder, secondary=True).pack(side="left", padx=(8,0))

        # --- Passo 2: Slug (nome do arquivo) ---
        self._step_label(body, "2", "Nome do arquivo (slug)")

        slug_frame = tk.Frame(body, bg=BRANCO)
        slug_frame.pack(fill="x", pady=(4, 4))

        tk.Label(slug_frame, text="Slug:", bg=BRANCO, fg=TEXTO,
                 font=("Helvetica", 11)).pack(side="left")
        self.slug_entry = tk.Entry(slug_frame, textvariable=self.slug_var,
                                   font=("Helvetica", 11), relief="flat",
                                   bg=CINZA, fg=TEXTO, insertbackground=ROXO,
                                   width=30)
        self.slug_entry.pack(side="left", padx=(8,0), ipady=4)
        tk.Label(slug_frame, text="  → sao-vicente_01.jpg, _02.jpg, _thumb.jpg",
                 bg=BRANCO, fg="#888", font=("Helvetica", 10)).pack(side="left")

        tk.Label(body, text="Editável apenas para 1 PDF. Em lote, usa o nome detectado de cada arquivo.",
                 bg=BRANCO, fg="#aaa", font=("Helvetica", 9)).pack(anchor="w", pady=(0,12))

        # --- Passo 3: Opções ---
        self._step_label(body, "3", "Opções")

        opt_frame = tk.Frame(body, bg=BRANCO)
        opt_frame.pack(fill="x", pady=(4, 16))

        tk.Checkbutton(opt_frame, text="Subir ao site após gerar  (requer backend.config.js)",
                       variable=self.upload_var, bg=BRANCO, fg=TEXTO,
                       font=("Helvetica", 11), activebackground=BRANCO,
                       selectcolor=BRANCO).pack(anchor="w")

        # --- Passo 4: Gerar ---
        self._step_label(body, "4", "Gerar")

        action_row = tk.Frame(body, bg=BRANCO)
        action_row.pack(fill="x", pady=(4, 0))

        self._btn(action_row, "▶  Preview (verificar corte)",
                  lambda: self.run(preview=True), secondary=True).pack(side="left")
        self._btn(action_row, "✓  Gerar assets finais",
                  lambda: self.run(preview=False)).pack(side="left", padx=(8,0))

        # Log da aba capa
        self.log = tk.Text(body, height=6, bg=CINZA, fg=TEXTO, font=("Courier", 10),
                           relief="flat", state="disabled", wrap="word")
        self.log.pack(fill="x", pady=(16, 0))

    def _build_miolo_tab(self, parent):
        self.miolo_pdf = None
        self.miolo_slug_var  = tk.StringVar()
        self.miolo_pages_var = tk.StringVar(value="1-15")
        self.miolo_upload_var = tk.BooleanVar(value=False)

        body = tk.Frame(parent, bg=BRANCO, padx=30, pady=20)
        body.pack(fill="both", expand=True)

        self._step_label(body, "1", "Selecionar PDF de miolo")
        self.miolo_file_label = tk.Label(body, text="Nenhum arquivo selecionado",
                                          bg=CINZA, fg="#888", font=("Helvetica", 11),
                                          anchor="w", padx=10, pady=8)
        self.miolo_file_label.pack(fill="x", pady=(4,8))
        self._btn(body, "Escolher PDF…", self.choose_miolo).pack(anchor="w")

        self._step_label(body, "2", "Páginas a exportar")
        pages_frame = tk.Frame(body, bg=BRANCO)
        pages_frame.pack(fill="x", pady=(6, 2))
        tk.Label(pages_frame, text="Páginas:", bg=BRANCO, fg=TEXTO,
                 font=("Helvetica", 11)).pack(side="left")
        tk.Entry(pages_frame, textvariable=self.miolo_pages_var,
                 font=("Helvetica", 11), relief="flat", bg=CINZA,
                 fg=TEXTO, width=30).pack(side="left", padx=(8,0), ipady=4)
        tk.Label(body, text='Ex: "1-15"  ou  "1-15, 20-21, 68-69"',
                 bg=BRANCO, fg="#aaa", font=("Helvetica", 9)).pack(anchor="w", pady=(2,8))

        self._step_label(body, "3", "Slug")
        slug_frame = tk.Frame(body, bg=BRANCO)
        slug_frame.pack(fill="x", pady=(4,12))
        tk.Label(slug_frame, text="Slug:", bg=BRANCO, fg=TEXTO,
                 font=("Helvetica", 11)).pack(side="left")
        tk.Entry(slug_frame, textvariable=self.miolo_slug_var,
                 font=("Helvetica", 11), relief="flat", bg=CINZA,
                 fg=TEXTO, width=30).pack(side="left", padx=(8,0), ipady=4)

        self._step_label(body, "4", "Opções")
        tk.Checkbutton(body, text="Subir ao site após gerar",
                       variable=self.miolo_upload_var, bg=BRANCO, fg=TEXTO,
                       font=("Helvetica", 11), activebackground=BRANCO,
                       selectcolor=BRANCO).pack(anchor="w", pady=(4,12))

        self._step_label(body, "5", "Gerar")
        self._btn(body, "✓  Gerar páginas de miolo",
                  self.run_miolo).pack(anchor="w", pady=(6,0))

        self.miolo_log = tk.Text(body, height=6, bg=CINZA, fg=TEXTO, font=("Courier", 10),
                                  relief="flat", state="disabled", wrap="word")
        self.miolo_log.pack(fill="x", pady=(16, 0))

    def choose_miolo(self):
        path = filedialog.askopenfilename(
            title="Selecionar PDF de miolo",
            filetypes=[("PDF", "*.pdf")],
            initialdir=Path.home() / "Desktop"
        )
        if path:
            self.miolo_pdf = Path(path)
            self.miolo_file_label.config(text=f"  {self.miolo_pdf.name}", fg=TEXTO)
            slug = self._detect_slug(self.miolo_pdf)
            self.miolo_slug_var.set(slug)

    def miolo_log_write(self, msg):
        self.miolo_log.config(state="normal")
        self.miolo_log.insert("end", msg + "\n")
        self.miolo_log.see("end")
        self.miolo_log.config(state="disabled")
        self.update()

    def run_miolo(self):
        if not self.miolo_pdf:
            messagebox.showwarning("Atenção", "Selecione um PDF de miolo primeiro.")
            return
        pages = self.miolo_pages_var.get().strip()
        if not pages:
            messagebox.showwarning("Atenção", "Informe as páginas a exportar.")
            return
        slug = self.miolo_slug_var.get().strip() or self._detect_slug(self.miolo_pdf)

        self.miolo_log.config(state="normal")
        self.miolo_log.delete("1.0", "end")
        self.miolo_log.config(state="disabled")
        self.miolo_log_write(f"Gerando miolo: {self.miolo_pdf.name}\nPáginas: {pages}\n")

        def worker():
            cmd = [
                sys.executable, str(SCRIPT_DIR / "process_miolo.py"),
                str(self.miolo_pdf),
                "--pages", pages,
                "--slug",  slug,
            ]
            if self.miolo_upload_var.get():
                cmd.append("--upload")

            result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(SCRIPT_DIR))
            for line in (result.stdout + result.stderr).splitlines():
                if line.strip():
                    self.miolo_log_write("  " + line)
            if result.returncode == 0:
                self.miolo_log_write(f"\n✓ Páginas em output/{slug}/")
            else:
                self.miolo_log_write("\n✗ Falha — verifique o log acima.")

        threading.Thread(target=worker, daemon=True).start()

    def _step_label(self, parent, num, text):
        row = tk.Frame(parent, bg=BRANCO)
        row.pack(fill="x", pady=(0, 2))
        tk.Label(row, text=num, bg=ROXO, fg=BRANCO, font=("Helvetica", 10, "bold"),
                 width=2, padx=4, pady=1).pack(side="left")
        tk.Label(row, text=f"  {text}", bg=BRANCO, fg=TEXTO,
                 font=("Helvetica", 12, "bold")).pack(side="left")

    def _btn(self, parent, text, cmd, secondary=False):
        bg = CINZA if secondary else ROXO
        fg = ROXO  if secondary else BRANCO
        return tk.Button(parent, text=text, command=cmd, bg=bg, fg=fg,
                         font=("Helvetica", 11), relief="flat", cursor="hand2",
                         padx=14, pady=7, activebackground=bg)

    def choose_files(self):
        paths = filedialog.askopenfilenames(
            title="Selecionar PDFs",
            filetypes=[("PDF", "*.pdf")],
            initialdir=Path.home() / "Desktop"
        )
        if paths:
            self.pdf_paths = [Path(p) for p in paths]
            self._update_file_label()

    def choose_folder(self):
        folder = filedialog.askdirectory(title="Selecionar pasta com PDFs")
        if folder:
            self.pdf_paths = list(Path(folder).glob("*.pdf"))
            self._update_file_label()

    def _update_file_label(self):
        n = len(self.pdf_paths)
        if n == 0:
            self.file_label.config(text="Nenhum arquivo selecionado", fg="#888")
            self.slug_var.set("")
            self.slug_entry.config(state="normal")
        elif n == 1:
            self.file_label.config(text=f"  {self.pdf_paths[0].name}", fg=TEXTO)
            detected = self._detect_slug(self.pdf_paths[0])
            self.slug_var.set(detected)
            self.slug_entry.config(state="normal")
        else:
            self.file_label.config(text=f"  {n} arquivos selecionados", fg=TEXTO)
            self.slug_var.set("")
            self.slug_entry.config(state="disabled")

    def _detect_slug(self, pdf_path):
        import re
        name = pdf_path.stem.lower()
        name = re.sub(r'^(capa|miolo|cover|book)[_\s-]+', '', name)
        name = re.sub(r'[_\s-]+(final|v\d+|pt[-_]?br|en|es|rgb|cmyk|\d+x\d+)([_\s-]|$).*', '', name)
        name = re.sub(r'[\s_]+', '-', name)
        name = re.sub(r'-+', '-', name).strip('-')
        return name

    def log_write(self, msg):
        self.log.config(state="normal")
        self.log.insert("end", msg + "\n")
        self.log.see("end")
        self.log.config(state="disabled")
        self.update()

    def log_clear(self):
        self.log.config(state="normal")
        self.log.delete("1.0", "end")
        self.log.config(state="disabled")

    def run(self, preview=False):
        if not self.pdf_paths:
            messagebox.showwarning("Atenção", "Selecione ao menos um PDF primeiro.")
            return

        self.log_clear()
        mode = "Preview" if preview else "Geração final"
        self.log_write(f"Iniciando {mode} de {len(self.pdf_paths)} arquivo(s)…\n")

        def worker():
            ok = failed = 0
            failed_pdfs = []
            for pdf in self.pdf_paths:
                self.log_write(f"─── {pdf.name}")
                cmd = [sys.executable, str(SCRIPT_DIR / "process_pdf.py"), str(pdf)]
                # Slug manual só quando há 1 PDF e campo preenchido
                manual_slug = self.slug_var.get().strip()
                if len(self.pdf_paths) == 1 and manual_slug:
                    cmd += ["--slug", manual_slug]
                if preview:
                    cmd.append("--preview")
                if self.upload_var.get() and not preview:
                    cmd.append("--upload")

                try:
                    result = subprocess.run(cmd, capture_output=True, text=True,
                                            cwd=str(SCRIPT_DIR))
                    output = result.stdout + result.stderr
                    needs_calibration = "calibrate" in output.lower() or "dobra" in output.lower()
                    for line in output.splitlines():
                        if line.strip() and "python3" not in line and "Execute" not in line:
                            self.log_write("  " + line)
                    if result.returncode == 0:
                        ok += 1
                    else:
                        failed += 1
                        failed_pdfs.append(pdf)
                        if needs_calibration:
                            self.log_write(f"  → Zonas não detectadas: precisa calibrar uma vez")
                        else:
                            self.log_write(f"  → Verifique se é um PDF de capa (com lombada)")
                except Exception as e:
                    self.log_write(f"  ✗ Erro: {e}")
                    failed += 1
                    failed_pdfs.append(pdf)

            self.log_write(f"\n{'─'*40}")
            self.log_write(f"✓ {ok} OK   ✗ {failed} falha(s)")
            if ok > 0 and not preview:
                self.log_write(f"Arquivos em: output/")

            # Oferece calibração automática se houve falhas
            if failed_pdfs:
                self.after(0, lambda: self._offer_calibration(failed_pdfs))

        threading.Thread(target=worker, daemon=True).start()

    def _offer_calibration(self, failed_pdfs):
        """Após falha, pergunta se quer calibrar e abre direto com o PDF."""
        nomes = "\n".join(f"  • {p.name}" for p in failed_pdfs[:5])
        if len(failed_pdfs) > 5:
            nomes += f"\n  … e mais {len(failed_pdfs)-5}"
        resposta = messagebox.askyesno(
            "Calibrar zonas?",
            f"{'Este arquivo precisa' if len(failed_pdfs)==1 else 'Estes arquivos precisam'} "
            f"ser calibrado(s) antes de processar:\n\n{nomes}\n\n"
            f"Nota: use PDFs de CAPA (frente + verso + lombada).\n"
            f"Miolos e páginas internas não têm marcas de dobra.\n\n"
            f"Abrir calibração agora?"
        )
        if resposta:
            # Calibra o primeiro da lista
            subprocess.Popen([sys.executable, str(SCRIPT_DIR / "calibrate.py"),
                              str(failed_pdfs[0])])
            self.log_write(f"\nCalibração aberta para: {failed_pdfs[0].name}")
            self.log_write("Depois de salvar, rode o Preview novamente.")

    def calibrate(self):
        """Calibração manual — usa o PDF já selecionado se houver apenas um."""
        if len(self.pdf_paths) == 1:
            path = str(self.pdf_paths[0])
        else:
            path = filedialog.askopenfilename(
                title="Selecionar PDF de CAPA para calibrar",
                filetypes=[("PDF", "*.pdf")]
            )
        if path:
            subprocess.Popen([sys.executable, str(SCRIPT_DIR / "calibrate.py"), path])
            self.log_write(f"\nAbrindo calibração…")


if __name__ == "__main__":
    app = App()
    app.mainloop()

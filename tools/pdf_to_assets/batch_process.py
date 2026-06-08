"""
batch_process.py — Processa todos os PDFs em tools/pdf_to_assets/input/

Uso:
  python3 batch_process.py [--upload] [--preview] [--watch]

  --upload   Sobe ao Supabase após gerar
  --preview  Só gera previews (sem resize final), útil para verificar cortes
  --watch    Fica rodando e processa novos PDFs conforme chegam na pasta input/
"""

import sys
import time
import argparse
import subprocess
from pathlib import Path

SCRIPT_DIR  = Path(__file__).parent
INPUT_DIR   = SCRIPT_DIR / "input"
DONE_DIR    = SCRIPT_DIR / "input" / "_done"
FAILED_DIR  = SCRIPT_DIR / "input" / "_failed"

INPUT_DIR.mkdir(exist_ok=True)
DONE_DIR.mkdir(exist_ok=True)
FAILED_DIR.mkdir(exist_ok=True)


def process_file(pdf_path, upload=False, preview=False):
    cmd = [sys.executable, str(SCRIPT_DIR / "process_pdf.py"), str(pdf_path)]
    if upload:
        cmd.append("--upload")
    if preview:
        cmd.append("--preview")

    print(f"\n{'─'*50}")
    print(f"Processando: {pdf_path.name}")
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode == 0


def run_batch(upload, preview):
    pdfs = sorted(INPUT_DIR.glob("*.pdf"))
    if not pdfs:
        print("Nenhum PDF em input/")
        return

    ok = failed = 0
    for pdf in pdfs:
        success = process_file(pdf, upload=upload, preview=preview)
        if success:
            pdf.rename(DONE_DIR / pdf.name)
            ok += 1
        else:
            pdf.rename(FAILED_DIR / pdf.name)
            failed += 1
            print(f"  ✗ Falhou — movido para input/_failed/")

    print(f"\n{'='*50}")
    print(f"Lote concluído: {ok} OK, {failed} falhas")
    if failed:
        print(f"  Verifique input/_failed/ e use calibrate.py para formatos desconhecidos.")


def watch_loop(upload, preview, interval=5):
    print(f"Monitorando input/ a cada {interval}s… (Ctrl+C para parar)")
    seen = set()
    while True:
        pdfs = set(INPUT_DIR.glob("*.pdf"))
        new_pdfs = pdfs - seen
        for pdf in sorted(new_pdfs):
            time.sleep(1)  # espera arquivo terminar de copiar
            success = process_file(pdf, upload=upload, preview=preview)
            dest = DONE_DIR if success else FAILED_DIR
            pdf.rename(dest / pdf.name)
        seen = pdfs - new_pdfs
        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Lote: PDFs em input/ → assets do site GIZ")
    parser.add_argument("--upload",  action="store_true")
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--watch",   action="store_true", help="Modo monitor contínuo")
    args = parser.parse_args()

    if args.watch:
        watch_loop(args.upload, args.preview)
    else:
        run_batch(args.upload, args.preview)


if __name__ == "__main__":
    main()

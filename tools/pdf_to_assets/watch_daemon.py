"""
watch_daemon.py — Monitora input/ e processa PDFs automaticamente.

Inicia no login via LaunchAgent. Não requer interface gráfica.
Envia notificação macOS ao concluir ou ao falhar.

Uso manual:
  python3.13 watch_daemon.py [--interval 5] [--upload]
"""

import sys
import time
import json
import logging
import argparse
import subprocess
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
INPUT_DIR  = SCRIPT_DIR / "input"
DONE_DIR   = SCRIPT_DIR / "input" / "_done"
FAILED_DIR = SCRIPT_DIR / "input" / "_failed"
LOG_FILE   = SCRIPT_DIR / "daemon.log"

for d in (INPUT_DIR, DONE_DIR, FAILED_DIR):
    d.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger("giz-daemon")


def notify(title, message, sound=True):
    """Notificação nativa do macOS via osascript."""
    sound_line = 'sound name "Glass"' if sound else ""
    script = f'display notification "{message}" with title "{title}" {sound_line}'
    try:
        subprocess.run(["osascript", "-e", script], timeout=5, capture_output=True)
    except Exception:
        pass


def process_pdf(pdf_path: Path, upload: bool) -> bool:
    """Chama process_pdf.py e retorna True se bem-sucedido."""
    cmd = [sys.executable, str(SCRIPT_DIR / "process_pdf.py"), str(pdf_path)]
    if upload:
        cmd.append("--upload")

    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(SCRIPT_DIR))
    output = result.stdout + result.stderr

    # Log compacto
    for line in output.splitlines():
        line = line.strip()
        if line and not line.startswith("="):
            log.info("  " + line)

    return result.returncode == 0


def watch_loop(interval: int, upload: bool):
    log.info(f"GIZ Assets Daemon iniciado — monitorando {INPUT_DIR}")
    log.info(f"Upload automático: {'sim' if upload else 'não'}")
    notify("GIZ Assets", "Daemon iniciado — monitorando pasta input/", sound=False)

    seen = set()

    while True:
        try:
            current = {p for p in INPUT_DIR.glob("*.pdf")}
            new_pdfs = sorted(current - seen)

            for pdf in new_pdfs:
                # Aguarda 2s para garantir que o arquivo terminou de copiar
                time.sleep(2)
                if not pdf.exists():
                    continue

                log.info(f"Novo PDF detectado: {pdf.name}")
                notify("GIZ Assets", f"Processando: {pdf.name}", sound=False)

                try:
                    success = process_pdf(pdf, upload=upload)
                except Exception as e:
                    log.error(f"Exceção ao processar {pdf.name}: {e}")
                    success = False

                if success:
                    dest = DONE_DIR / pdf.name
                    pdf.rename(dest)
                    log.info(f"✓ {pdf.name} → _done/")
                    notify("GIZ Assets ✓", f"{pdf.stem}: assets gerados", sound=True)
                else:
                    dest = FAILED_DIR / pdf.name
                    pdf.rename(dest)
                    log.warning(f"✗ {pdf.name} → _failed/ (abra GIZ Assets para calibrar)")
                    notify(
                        "GIZ Assets — Atenção",
                        f"{pdf.stem}: não processado. Abra GIZ Assets para calibrar.",
                        sound=True
                    )

            seen = current - set(new_pdfs)  # remove os que já processamos
            seen |= {DONE_DIR / p.name for p in new_pdfs}  # não reprocessa

        except Exception as e:
            log.error(f"Erro no loop principal: {e}")

        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--interval", type=int, default=5,
                        help="Segundos entre verificações (padrão: 5)")
    parser.add_argument("--upload", action="store_true",
                        help="Sobe ao Supabase automaticamente após gerar")
    args = parser.parse_args()
    watch_loop(args.interval, args.upload)


if __name__ == "__main__":
    main()

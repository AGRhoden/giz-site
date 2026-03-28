#!/bin/zsh

echo "Watcher ativo — monitorando projetos e planilha"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR" || exit 1

ultimo=""

while true; do
  atual=$(
    {
      find assets/projetos -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0 2>/dev/null
      [[ -f projetos_metadata.xlsx ]] && printf '%s\0' "projetos_metadata.xlsx"
    } \
    | sort -z \
    | xargs -0 stat -f "%N %m" 2>/dev/null \
    | shasum
  )

  if [[ "$atual" != "$ultimo" ]]; then
    echo "Alteração detectada -> regenerando JSON"
    python3 tools/gerar_projetos_json.py
    ultimo="$atual"
  fi

  sleep 2
done

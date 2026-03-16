#!/bin/zsh

echo "Watcher ativo — monitorando projetos e planilha"

cd "$(dirname "$0")" || exit 1

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
    python3 gerar_projetos_json.py
    ultimo="$atual"
  fi

  sleep 2
done
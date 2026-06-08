#!/bin/bash
# Instala o GIZ Assets Daemon para iniciar automaticamente no login.
# Uso: bash install_daemon.sh

PLIST_SRC="/Users/arte_antonio/Documents/giz-site/tools/pdf_to_assets/com.giz.assets.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.giz.assets.plist"

echo "Instalando GIZ Assets Daemon..."

# Remove versão anterior se existir
if launchctl list | grep -q "com.giz.assets"; then
    launchctl unload "$PLIST_DEST" 2>/dev/null
fi

cp "$PLIST_SRC" "$PLIST_DEST"
launchctl load "$PLIST_DEST"

if launchctl list | grep -q "com.giz.assets"; then
    echo "✓ Daemon instalado e rodando."
    echo "  PDFs colocados em input/ serão processados automaticamente."
    echo ""
    echo "  Para parar:      launchctl unload ~/Library/LaunchAgents/com.giz.assets.plist"
    echo "  Para reiniciar:  launchctl load   ~/Library/LaunchAgents/com.giz.assets.plist"
    echo "  Log em:          tools/pdf_to_assets/daemon.log"
else
    echo "✗ Falha ao instalar. Verifique o log."
fi

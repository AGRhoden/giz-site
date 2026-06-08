# PDF → Assets GIZ

Gera frente, verso+lombada e thumb a partir de PDFs de gráfica.

## Instalação (uma vez)

```bash
brew install poppler
pip3 install pdf2image pillow pypdf supabase
```

## Fluxo básico

### 1. Primeiro PDF de um formato novo → calibrar
```bash
cd tools/pdf_to_assets
python3 calibrate.py input/meu-livro.pdf
```
Clique nos 4 cantos das duas zonas. Salva automaticamente em `config.json`.

### 2. Gerar preview (verificar corte antes de finalizar)
```bash
python3 process_pdf.py input/meu-livro.pdf --preview
```

### 3. Gerar assets finais + upload Supabase
```bash
python3 process_pdf.py input/meu-livro.pdf --upload --title "Título do Livro"
```

### 4. Lote completo
```bash
# Coloque os PDFs em input/  e rode:
python3 batch_process.py --upload

# Ou modo monitor (processa conforme chegam):
python3 batch_process.py --upload --watch
```

## Estrutura das pastas

```
tools/pdf_to_assets/
  input/           ← coloque os PDFs aqui
  input/_done/     ← PDFs processados com sucesso
  input/_failed/   ← PDFs que falharam (use calibrate.py)
  output/          ← imagens geradas
  config.json      ← formatos calibrados
  calibrate.py     ← calibração visual (Tkinter)
  detect_marks.py  ← detecção automática de marcas
  process_pdf.py   ← processa 1 PDF → 3 assets
  batch_process.py ← processa pasta inteira
```

## Tamanhos de saída

| Asset           | Tamanho     | Arquivo                    |
|-----------------|-------------|----------------------------|
| Frente          | 1200×1600px | `<slug>_frente.jpg`        |
| Verso+Lombada   | 1200×1600px | `<slug>_verso_lombada.jpg` |
| Thumb           | 400×600px   | `<slug>_thumb.jpg`         |

Bordas brancas são adicionadas para preservar proporção original.

## Detecção automática vs calibração

- PDFs InDesign com TrimBox exportado → detecção automática de dobras
- Formatos desconhecidos ou sem TrimBox → `calibrate.py` uma vez, depois automático

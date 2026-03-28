# Versionamento

Este script passa a usar versionamento semântico:

- `1.0.0`: primeira versão funcional
- `1.0.1`: correções sem mudar fluxo
- `1.1.0`: melhorias de interface ou comportamento sem quebrar compatibilidade
- `2.0.0`: mudança grande de fluxo ou compatibilidade

## Regra prática

- bugfix: sobe o terceiro número
- melhoria compatível: sobe o segundo número e zera o terceiro
- quebra importante de fluxo ou compatibilidade: sobe o primeiro número e zera os demais

## Convenção deste projeto

- arquivo ativo: `acrobat_comment_importer.jsx`
- histórico congelado: `versions/acrobat_comment_importer_vX.Y.Z.jsx`
- registro resumido: `versions/CHANGELOG.md`

## Estado atual

- versão ativa: `1.1.1`

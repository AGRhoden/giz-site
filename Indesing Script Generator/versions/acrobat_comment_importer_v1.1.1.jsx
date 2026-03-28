#target "InDesign"
#targetengine "acrobat_comment_importer_ui"

(function () {
  var SCRIPT_VERSION = "1.1.1";
  var existing = $.global.__acrobatCommentImporterPalette;
  if (existing && existing instanceof Window) {
    try {
      existing.show();
      existing.active = true;
    } catch (e) {
      // ignore
    }
    return;
  }

  var state = {
    xfdfFile: null,
    comments: [],
    index: -1,
    doc: null,
    isApplying: false
  };

  var w = new Window("palette", "Importar comentários do Acrobat v" + SCRIPT_VERSION, undefined, { resizeable: true });
  w.orientation = "column";
  w.alignChildren = "fill";
  w.spacing = 8;
  w.margins = 10;
  w.preferredSize = [620, 500];
  w.minimumSize = [520, 380];

  var pnlImport = w.add("panel", undefined, "Importação");
  pnlImport.orientation = "column";
  pnlImport.alignChildren = "fill";
  pnlImport.margins = 12;

  var importRow = pnlImport.add("group");
  importRow.alignment = "fill";
  importRow.add("statictext", undefined, "Arquivo XFDF:");
  var etFile = importRow.add("edittext", undefined, "");
  etFile.characters = 38;
  etFile.enabled = false;
  etFile.alignment = ["fill", "center"];
  var btnImport = importRow.add("button", undefined, "Importar");

  var mapRow = pnlImport.add("group");
  mapRow.orientation = "row";
  mapRow.alignChildren = "center";
  mapRow.add("statictext", undefined, "Offset de páginas do PDF:");
  var etPageOffset = mapRow.add("edittext", undefined, "0");
  etPageOffset.characters = 5;
  mapRow.add("statictext", undefined, "Use 0 para a mesma numeração.");

  var txtImportHelp = pnlImport.add("statictext", undefined,
    "Fluxo recomendado: Acrobat > Exportar comentários > XFDF. O script usa página, comentário e texto marcado quando disponível.",
    { multiline: true }
  );
  txtImportHelp.alignment = ["fill", "top"];
  txtImportHelp.minimumSize.height = 32;

  var pnlCurrent = w.add("panel", undefined, "Comentário atual");
  pnlCurrent.orientation = "column";
  pnlCurrent.alignChildren = "fill";
  pnlCurrent.margins = 12;

  var txtCounter = pnlCurrent.add("statictext", undefined, "Nenhum comentário carregado.");
  txtCounter.characters = 70;
  txtCounter.alignment = ["fill", "top"];

  var txtMeta = pnlCurrent.add("statictext", undefined, "Página: - | Tipo: - | Estado: -");
  txtMeta.characters = 70;
  txtMeta.alignment = ["fill", "top"];

  var gComment = pnlCurrent.add("group");
  gComment.orientation = "column";
  gComment.alignChildren = "fill";
  gComment.add("statictext", undefined, "Comentário:");
  var etComment = gComment.add("edittext", undefined, "", { multiline: true, scrolling: true, readonly: true });
  etComment.preferredSize = [580, 70];
  etComment.minimumSize = [420, 56];
  etComment.alignment = ["fill", "fill"];

  var gMarked = pnlCurrent.add("group");
  gMarked.orientation = "column";
  gMarked.alignChildren = "fill";
  gMarked.add("statictext", undefined, "Trecho marcado / alvo detectado:");
  var etMarked = gMarked.add("edittext", undefined, "", { multiline: true, scrolling: true, readonly: true });
  etMarked.preferredSize = [580, 56];
  etMarked.minimumSize = [420, 42];
  etMarked.alignment = ["fill", "fill"];

  var gContext = pnlCurrent.add("group");
  gContext.orientation = "column";
  gContext.alignChildren = "fill";
  gContext.add("statictext", undefined, "Contexto encontrado na página:");
  var etContext = gContext.add("edittext", undefined, "", { multiline: true, scrolling: true, readonly: true });
  etContext.preferredSize = [580, 70];
  etContext.minimumSize = [420, 56];
  etContext.alignment = ["fill", "fill"];

  var pnlSuggestion = w.add("panel", undefined, "Sugestão de emenda");
  pnlSuggestion.orientation = "column";
  pnlSuggestion.alignChildren = "fill";
  pnlSuggestion.margins = 12;

  var suggestionRow = pnlSuggestion.add("group");
  suggestionRow.alignment = "fill";
  suggestionRow.add("statictext", undefined, "Substituição sugerida:");
  var etReplacement = suggestionRow.add("edittext", undefined, "");
  etReplacement.characters = 36;
  etReplacement.alignment = ["fill", "center"];

  var cbSafeReflow = pnlSuggestion.add("checkbox", undefined, "Reverter se a composição mudar (linhas / estouro / largura do trecho)");
  cbSafeReflow.value = true;

  var txtSuggestion = pnlSuggestion.add("statictext", undefined,
    "Se houver padrão claro no comentário, o script preenche a substituição automaticamente. Caso contrário, você pode editar manualmente.",
    { multiline: true }
  );
  txtSuggestion.alignment = ["fill", "top"];
  txtSuggestion.minimumSize.height = 30;

  var actionPanel = w.add("panel", undefined, "Ações");
  actionPanel.orientation = "column";
  actionPanel.alignChildren = "fill";
  actionPanel.margins = 10;

  var navRowTop = actionPanel.add("group");
  navRowTop.alignment = "fill";
  var btnPrev = navRowTop.add("button", undefined, "Anterior");
  var btnNext = navRowTop.add("button", undefined, "Próximo");
  var btnLocate = navRowTop.add("button", undefined, "Localizar");
  var btnRefresh = navRowTop.add("button", undefined, "Atualizar");

  var navRowBottom = actionPanel.add("group");
  navRowBottom.alignment = "fill";
  var btnApplyDialog = navRowBottom.add("button", undefined, "Alterar no script");
  var btnApplyPage = navRowBottom.add("button", undefined, "Alterar na página");
  var btnIgnore = navRowBottom.add("button", undefined, "Ignorar");

  btnPrev.minimumSize.width = 90;
  btnNext.minimumSize.width = 90;
  btnLocate.minimumSize.width = 90;
  btnRefresh.minimumSize.width = 90;
  btnApplyDialog.minimumSize.width = 150;
  btnApplyPage.minimumSize.width = 150;
  btnIgnore.minimumSize.width = 90;

  var footer = w.add("group");
  footer.alignment = "fill";
  var footerSpacer = footer.add("statictext", undefined, "");
  footerSpacer.alignment = ["fill", "center"];
  var btnClose = footer.add("button", undefined, "Fechar");

  btnImport.onClick = function () {
    importComments();
  };

  btnPrev.onClick = function () {
    if (!state.comments.length) return;
    selectComment((state.index - 1 + state.comments.length) % state.comments.length, true);
  };

  btnNext.onClick = function () {
    if (!state.comments.length) return;
    selectComment((state.index + 1) % state.comments.length, true);
  };

  btnLocate.onClick = function () {
    locateCurrentComment(true);
  };

  btnRefresh.onClick = function () {
    refreshCurrentCommentMatch(true);
  };

  btnApplyDialog.onClick = function () {
    applyCurrentCommentInScript();
  };

  btnApplyPage.onClick = function () {
    sendCurrentCommentToPage();
  };

  btnIgnore.onClick = function () {
    ignoreCurrentComment();
  };

  btnClose.onClick = function () {
    w.close();
  };

  w.onClose = function () {
    $.global.__acrobatCommentImporterPalette = null;
    return true;
  };

  w.onResizing = w.onResize = function () {
    syncResponsiveHeights();
    this.layout.resize();
  };

  $.global.__acrobatCommentImporterPalette = w;
  syncResponsiveHeights();
  w.show();

  function syncResponsiveHeights() {
    var width = w.size ? w.size.width : w.preferredSize.width;
    var compact = width < 580;
    etComment.minimumSize.height = compact ? 48 : 56;
    etMarked.minimumSize.height = compact ? 34 : 42;
    etContext.minimumSize.height = compact ? 48 : 56;
    txtImportHelp.minimumSize.height = compact ? 44 : 32;
    txtSuggestion.minimumSize.height = compact ? 42 : 30;
  }

  function importComments() {
    if (app.documents.length === 0) {
      alert("Abra um documento do InDesign antes de importar comentários.");
      return;
    }

    var file = File.openDialog("Selecione o XFDF exportado pelo Acrobat", "*.xfdf");
    if (!file) return;

    var xmlText = readTextFile(file);
    if (!xmlText) {
      alert("Não foi possível ler o arquivo selecionado.");
      return;
    }

    var parsedComments;
    try {
      parsedComments = parseXfdfComments(xmlText);
    } catch (e) {
      alert("Falha ao interpretar o XFDF.\n\n" + e);
      return;
    }

    if (!parsedComments.length) {
      alert("Nenhum comentário compatível foi encontrado no XFDF.");
      return;
    }

    state.doc = app.activeDocument;
    state.xfdfFile = file;
    state.comments = enrichComments(state.doc, parsedComments, parseInteger(etPageOffset.text, 0));
    state.index = -1;
    etFile.text = decodeURI(file.fsName);

    selectComment(0, false);
    alert("Comentários importados: " + state.comments.length + "\n\nRevise cada item com os botões da paleta.");
  }

  function readTextFile(file) {
    try {
      file.encoding = "UTF-8";
      file.open("r");
      var text = file.read();
      file.close();
      return text;
    } catch (e) {
      try {
        file.close();
      } catch (ignore) {
        // ignore
      }
      return "";
    }
  }

  function parseXfdfComments(xmlText) {
    var xml = new XML(xmlText);
    var annots = collectAnnotNodes(xml);
    var comments = [];
    var i;

    for (i = 0; i < annots.length(); i++) {
      var annot = annots[i];
      var typeName = xmlLocalName(annot);
      if (!typeName) continue;

      var pageIndex = getXmlAttrNumber(annot, "page", -1);
      var commentBody = cleanText(getXmlNodeText(annot, "contents"));
      var richTextBody = cleanText(stripXmlTags(getXmlNodeText(annot, "contents-richtext")));
      var markedText = cleanText(getXmlNodeText(annot, "text"));
      var subject = cleanText(getXmlAttrString(annot, "subject", ""));
      var author = cleanText(getXmlAttrString(annot, "title", ""));

      var finalBody = commentBody || richTextBody || subject;
      if (!finalBody && !markedText) continue;

      comments.push({
        type: typeName,
        pageIndex: pageIndex,
        pageNumber: pageIndex >= 0 ? pageIndex + 1 : 0,
        comment: finalBody,
        markedText: markedText,
        subject: subject,
        author: author,
        rawReplacement: "",
        replacement: "",
        status: "pendente",
        match: null,
        note: ""
      });
    }

    return comments;
  }

  function enrichComments(doc, comments, pageOffset) {
    var enriched = [];
    for (var i = 0; i < comments.length; i++) {
      var entry = comments[i];
      entry.pageNumber = Math.max(1, entry.pageNumber + pageOffset);
      entry.targetText = deriveTargetText(entry);
      entry.rawReplacement = deriveReplacement(entry);
      entry.replacement = entry.rawReplacement;
      entry.match = findCommentMatch(doc, entry);
      entry.note = buildNote(entry);
      enriched.push(entry);
    }
    return enriched;
  }

  function deriveTargetText(entry) {
    var target = cleanText(entry.markedText);
    if (target) return target;

    var comment = entry.comment || "";
    var patterns = [
      /(?:trocar|substituir)\s+["“”']?([^"“”'\n]+?)["“”']?\s+(?:por|para)\s+["“”']?([^"“”'\n]+?)["“”']?/i,
      /(?:onde\s+se\s+le|onde\s+l[êe]-?se)\s+["“”']?([^"“”'\n]+?)["“”']?\s*,?\s*(?:leia-se|ler)\s+["“”']?([^"“”'\n]+?)["“”']?/i
    ];

    for (var i = 0; i < patterns.length; i++) {
      var m = comment.match(patterns[i]);
      if (m && m[1]) return cleanText(m[1]);
    }

    return "";
  }

  function deriveReplacement(entry) {
    var comment = entry.comment || "";
    var patterns = [
      /(?:trocar|substituir)\s+["“”']?([^"“”'\n]+?)["“”']?\s+(?:por|para)\s+["“”']?([^"“”'\n]+?)["“”']?/i,
      /(?:onde\s+se\s+le|onde\s+l[êe]-?se)\s+["“”']?([^"“”'\n]+?)["“”']?\s*,?\s*(?:leia-se|ler)\s+["“”']?([^"“”'\n]+?)["“”']?/i,
      /(?:corrigir\s+para|ajustar\s+para)\s+["“”']?([^"“”'\n]+?)["“”']?/i
    ];

    for (var i = 0; i < patterns.length; i++) {
      var m = comment.match(patterns[i]);
      if (!m) continue;
      if (m[2]) return cleanText(m[2]);
      if (m[1]) return cleanText(m[1]);
    }

    return "";
  }

  function buildNote(entry) {
    if (entry.match && entry.match.found) {
      if (entry.match.ambiguous) return "Mais de uma ocorrência encontrada na página. Revise antes de aplicar.";
      if (entry.match.fromMarkedText) return "Trecho localizado pelo texto marcado no Acrobat.";
      if (entry.match.fromCommentHeuristic) return "Trecho localizado por heurística do comentário.";
      return "Trecho localizado na página.";
    }

    if (!entry.targetText) return "Comentário sem trecho marcado. A ação manual na página é a opção mais segura.";
    return "Trecho não localizado automaticamente. Revise a página manualmente.";
  }

  function selectComment(index, focusAfterSelect) {
    if (!state.comments.length || index < 0 || index >= state.comments.length) {
      clearUi();
      return;
    }

    state.index = index;
    updateUiFromCurrent();

    if (focusAfterSelect) {
      locateCurrentComment(false);
    }
  }

  function refreshCurrentCommentMatch(showAlerts) {
    var entry = getCurrentComment();
    if (!entry) return;

    entry.replacement = etReplacement.text;
    entry.match = findCommentMatch(state.doc || app.activeDocument, entry);
    entry.note = buildNote(entry);
    updateUiFromCurrent();

    if (showAlerts) {
      alert(entry.note);
    }
  }

  function locateCurrentComment(showAlerts) {
    var entry = getCurrentComment();
    if (!entry) {
      if (showAlerts) alert("Nenhum comentário selecionado.");
      return;
    }

    if (!entry.match || !entry.match.found) {
      if (showAlerts) alert(entry.note || "Trecho não localizado.");
      jumpToPage(entry.pageNumber);
      return;
    }

    try {
      app.select(entry.match.text);
      app.activeWindow.activePage = entry.match.page;
      if (showAlerts) {
        if (entry.match.ambiguous) {
          alert("Trecho localizado, mas há mais de uma ocorrência na página.\nRevise antes de aplicar.");
        }
      }
    } catch (e) {
      if (showAlerts) alert("O trecho foi encontrado, mas não foi possível selecionar automaticamente.\n" + e);
    }
  }

  function applyCurrentCommentInScript() {
    var entry = getCurrentComment();
    if (!entry) {
      alert("Nenhum comentário selecionado.");
      return;
    }

    var doc = state.doc || app.activeDocument;
    if (!doc) {
      alert("Nenhum documento ativo.");
      return;
    }

    if (!entry.match || !entry.match.found) {
      alert("Não há trecho localizado para alteração automática.\nUse 'Alterar na página' para resolver manualmente.");
      return;
    }

    if (entry.match.ambiguous) {
      var proceed = confirm("Foram encontradas múltiplas ocorrências na página.\nDeseja aplicar mesmo assim no primeiro trecho localizado?");
      if (!proceed) return;
    }

    var replacement = etReplacement.text;
    if (!replacement) {
      replacement = prompt("Informe o texto final para substituir o trecho selecionado:", entry.replacement || "");
      if (replacement === null) return;
      etReplacement.text = replacement;
    }

    entry.replacement = replacement;

    state.isApplying = true;
    try {
      app.doScript(function () {
        applyReplacement(doc, entry, cbSafeReflow.value);
      }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Aplicar comentário do Acrobat");
      entry.status = "aplicado";
      entry.note = "Alteração aplicada pelo script.";
      entry.match = null;
      updateUiFromCurrent();
      selectNextPending();
    } catch (e) {
      alert("Falha ao aplicar a alteração.\n\n" + e);
    } finally {
      state.isApplying = false;
    }
  }

  function sendCurrentCommentToPage() {
    var entry = getCurrentComment();
    if (!entry) {
      alert("Nenhum comentário selecionado.");
      return;
    }

    locateCurrentComment(false);
    jumpToPage(entry.pageNumber);

    var msg = "Página aberta para edição manual.\n\n";
    msg += "Comentário: " + (entry.comment || "-") + "\n\n";
    if (entry.match && entry.match.context) {
      msg += "Contexto do trecho:\n" + entry.match.context + "\n\n";
    }
    if (entry.targetText) {
      msg += "Trecho alvo: " + entry.targetText + "\n";
      msg += "Caracteres no alvo: " + entry.targetText.length + "\n";
    }
    if (entry.replacement) {
      msg += "Sugestão: " + entry.replacement + "\n";
      msg += "Caracteres na sugestao: " + entry.replacement.length + "\n";
    }
    msg += "\nDica: compare a extensão do original com a emenda para evitar refluência de linha.";

    entry.status = "manual";
    entry.note = "Encaminhado para edição manual na página.";
    updateUiFromCurrent();
    alert(msg);
  }

  function ignoreCurrentComment() {
    var entry = getCurrentComment();
    if (!entry) {
      alert("Nenhum comentário selecionado.");
      return;
    }

    entry.status = "ignorado";
    entry.note = "Ignorado para tratamento manual posterior.";
    updateUiFromCurrent();
    selectNextPending();
  }

  function selectNextPending() {
    if (!state.comments.length) return;

    for (var i = 1; i <= state.comments.length; i++) {
      var idx = (state.index + i) % state.comments.length;
      if (state.comments[idx].status === "pendente") {
        selectComment(idx, false);
        return;
      }
    }

    updateUiFromCurrent();
    alert("Todos os comentários foram marcados como aplicados, manuais ou ignorados.");
  }

  function applyReplacement(doc, entry, protectComposition) {
    var match = entry.match;
    if (!match || !match.found || !match.text || !match.text.isValid) {
      throw new Error("O trecho localizado não está mais válido. Atualize a busca antes de aplicar.");
    }

    var target = match.text;
    var story = target.parentStory;
    if (!story || !story.isValid) {
      throw new Error("Story invalida para edicao.");
    }

    var before = snapshotComposition(target);
    var original = target.contents;
    target.contents = entry.replacement;

    if (protectComposition) {
      var after = snapshotComposition(target);
      if (!isCompositionCompatible(before, after)) {
        target.contents = original;
        throw new Error("A composição mudou. A alteração foi revertida para evitar refluência.");
      }
    }

    entry.match = findCommentMatch(doc, entry);
  }

  function snapshotComposition(textObj) {
    var result = {
      lineCount: 0,
      frameId: "",
      baselineFirst: "",
      baselineLast: "",
      horizontalOffsetFirst: "",
      horizontalOffsetLast: "",
      width: ""
    };

    try {
      var lines = textObj.lines;
      result.lineCount = lines.length;
      if (lines.length > 0) {
        result.baselineFirst = safeNumber(lines[0].baseline);
        result.baselineLast = safeNumber(lines[lines.length - 1].baseline);
        result.horizontalOffsetFirst = safeNumber(lines[0].horizontalOffset);
        result.horizontalOffsetLast = safeNumber(lines[lines.length - 1].horizontalOffset);
      }
    } catch (e) {
      // ignore
    }

    try {
      var frame = textObj.parentTextFrames[0];
      if (frame && frame.isValid) {
        result.frameId = frame.id;
      }
    } catch (ignore) {
      // ignore
    }

    try {
      var chars = textObj.characters;
      if (chars.length > 0) {
        var firstChar = chars[0];
        var lastChar = chars[chars.length - 1];
        result.width = safeNumber(lastChar.endHorizontalOffset - firstChar.horizontalOffset);
      }
    } catch (ignore2) {
      // ignore
    }

    return result;
  }

  function isCompositionCompatible(before, after) {
    if (before.frameId !== after.frameId) return false;
    if (before.lineCount !== after.lineCount) return false;
    if (before.baselineFirst !== after.baselineFirst) return false;
    if (before.baselineLast !== after.baselineLast) return false;

    if (before.width !== "" && after.width !== "") {
      if (Math.abs(Number(before.width) - Number(after.width)) > 0.5) return false;
    }

    return true;
  }

  function findCommentMatch(doc, entry) {
    var result = {
      found: false,
      ambiguous: false,
      page: null,
      text: null,
      context: "",
      fromMarkedText: false,
      fromCommentHeuristic: false
    };

    if (!doc || !doc.isValid) return result;

    var page = getPageByNumber(doc, entry.pageNumber);
    if (!page) return result;

    result.page = page;

    var pageTexts = collectPageTexts(page);
    if (!pageTexts.length) return result;

    var target = entry.targetText || "";
    var candidates = [];

    if (target) {
      candidates = findTargetInPageTexts(pageTexts, target);
      if (candidates.length) {
        result.found = true;
        result.text = candidates[0].text;
        result.context = candidates[0].context;
        result.ambiguous = candidates.length > 1;
        result.fromMarkedText = !!entry.markedText;
        result.fromCommentHeuristic = !entry.markedText;
        return result;
      }
    }

    var fallback = deriveFallbackNeedle(entry.comment || "");
    if (fallback) {
      candidates = findTargetInPageTexts(pageTexts, fallback);
      if (candidates.length) {
        result.found = true;
        result.text = candidates[0].text;
        result.context = candidates[0].context;
        result.ambiguous = candidates.length > 1;
        result.fromCommentHeuristic = true;
      }
    }

    return result;
  }

  function collectPageTexts(page) {
    var texts = [];
    var frames = page.textFrames;

    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      if (!frame.isValid) continue;

      try {
        var story = frame.parentStory;
        if (!story || !story.isValid || !story.contents) continue;
        texts.push({
          frame: frame,
          story: story
        });
      } catch (e) {
        // ignore
      }
    }

    return texts;
  }

  function findTargetInPageTexts(pageTexts, needle) {
    var normalizedNeedle = normalizeForSearch(needle);
    var matches = [];

    if (!normalizedNeedle) return matches;

    for (var i = 0; i < pageTexts.length; i++) {
      var story = pageTexts[i].story;
      var storyContents = "";

      try {
        storyContents = story.contents;
      } catch (e) {
        continue;
      }

      if (!storyContents) continue;

      var mapping = buildNormalizedMapping(storyContents);
      var pos = mapping.normalized.indexOf(normalizedNeedle);
      while (pos >= 0) {
        var start = mapping.map[pos];
        var endMapIndex = pos + normalizedNeedle.length - 1;
        var end = mapping.map[endMapIndex] + 1;

        try {
          var textRef = story.texts.itemByRange(start, end - 1);
          if (textRef && textRef.isValid && isTextOnPage(textRef, pageTexts[i].frame.parentPage)) {
            matches.push({
              text: textRef,
              context: extractContext(storyContents, start, end)
            });
          }
        } catch (ignore) {
          // ignore
        }

        pos = mapping.normalized.indexOf(normalizedNeedle, pos + normalizedNeedle.length);
      }
    }

    return matches;
  }

  function isTextOnPage(textRef, page) {
    try {
      var frames = textRef.parentTextFrames;
      if (!frames || !frames.length) return false;
      return frames[0].parentPage === page;
    } catch (e) {
      return false;
    }
  }

  function buildNormalizedMapping(source) {
    var normalized = "";
    var map = [];
    var lastWasSpace = false;

    for (var i = 0; i < source.length; i++) {
      var ch = source.charAt(i);
      var normalizedChar = normalizeChar(ch);
      if (!normalizedChar) continue;

      if (normalizedChar === " ") {
        if (lastWasSpace || !normalized.length) continue;
        lastWasSpace = true;
      } else {
        lastWasSpace = false;
      }

      normalized += normalizedChar;
      map.push(i);
    }

    if (normalized.charAt(normalized.length - 1) === " ") {
      normalized = normalized.substring(0, normalized.length - 1);
      map.pop();
    }

    return {
      normalized: normalized,
      map: map
    };
  }

  function normalizeForSearch(source) {
    var mapping = buildNormalizedMapping(source || "");
    return mapping.normalized;
  }

  function normalizeChar(ch) {
    var lower = String(ch).toLowerCase();
    var accents = {
      "a": /[aàáâãäå]/,
      "c": /[cç]/,
      "e": /[eèéêë]/,
      "i": /[iìíîï]/,
      "n": /[nñ]/,
      "o": /[oòóôõöø]/,
      "u": /[uùúûü]/,
      "y": /[yýÿ]/
    };

    for (var key in accents) {
      if (accents[key].test(lower)) return key;
    }

    if (/\s/.test(lower)) return " ";
    if (/[a-z0-9]/.test(lower)) return lower;
    if (".,;:!?()\"'/-".indexOf(lower) >= 0) return lower;
    return "";
  }

  function extractContext(source, start, end) {
    var beforeStart = Math.max(0, start - 60);
    var afterEnd = Math.min(source.length, end + 60);
    var before = source.substring(beforeStart, start);
    var current = source.substring(start, end);
    var after = source.substring(end, afterEnd);
    return cleanText(before + " [" + current + "] " + after);
  }

  function deriveFallbackNeedle(comment) {
    if (!comment) return "";

    var text = cleanText(comment);
    if (!text) return "";

    var stopwords = {
      "alterar": true,
      "corrigir": true,
      "ajustar": true,
      "trocar": true,
      "substituir": true,
      "pagina": true,
      "paragrafo": true,
      "linha": true,
      "favor": true,
      "por": true,
      "para": true,
      "no": true,
      "na": true,
      "o": true,
      "a": true,
      "os": true,
      "as": true,
      "um": true,
      "uma": true,
      "de": true,
      "do": true,
      "da": true,
      "e": true
    };

    var parts = text.split(/\s+/);
    var best = [];

    for (var i = 0; i < parts.length; i++) {
      var token = parts[i];
      if (token.length < 4) continue;
      if (stopwords[token.toLowerCase()]) continue;
      best.push(token);
      if (best.length >= 5) break;
    }

    return best.join(" ");
  }

  function getPageByNumber(doc, pageNumber) {
    if (!doc || !doc.isValid || !pageNumber) return null;

    for (var i = 0; i < doc.pages.length; i++) {
      var page = doc.pages[i];
      if (String(page.name) === String(pageNumber)) return page;
      if (i + 1 === pageNumber) return page;
    }

    return null;
  }

  function jumpToPage(pageNumber) {
    try {
      var doc = state.doc || app.activeDocument;
      var page = getPageByNumber(doc, pageNumber);
      if (page) {
        app.activeWindow.activePage = page;
      }
    } catch (e) {
      // ignore
    }
  }

  function updateUiFromCurrent() {
    var entry = getCurrentComment();
    if (!entry) {
      clearUi();
      return;
    }

    txtCounter.text = "Comentário " + (state.index + 1) + " de " + state.comments.length;
    txtMeta.text = "Página: " + (entry.pageNumber || "-") + " | Tipo: " + (entry.type || "-") + " | Estado: " + entry.status;
    etComment.text = entry.comment || "";
    etMarked.text = entry.targetText || entry.markedText || "";
    etContext.text = (entry.match && entry.match.context) ? entry.match.context : entry.note;
    etReplacement.text = entry.replacement || "";
  }

  function clearUi() {
    txtCounter.text = "Nenhum comentário carregado.";
    txtMeta.text = "Página: - | Tipo: - | Estado: -";
    etComment.text = "";
    etMarked.text = "";
    etContext.text = "";
    etReplacement.text = "";
  }

  function getCurrentComment() {
    if (state.index < 0 || state.index >= state.comments.length) return null;
    return state.comments[state.index];
  }

  function getXmlAttrString(node, name, fallback) {
    try {
      var attr = node.attribute(name);
      if (attr && String(attr) !== "") return String(attr);
    } catch (e) {
      // ignore
    }
    return fallback;
  }

  function getXmlAttrNumber(node, name, fallback) {
    var value = getXmlAttrString(node, name, "");
    if (value === "") return fallback;
    var n = Number(value);
    return isNaN(n) ? fallback : n;
  }

  function getXmlNodeText(node, childName) {
    try {
      var children = node.children();
      for (var i = 0; i < children.length(); i++) {
        if (xmlLocalName(children[i]) === childName) {
          return String(children[i]);
        }
      }
    } catch (ignore) {
      // ignore
    }

    return "";
  }

  function stripXmlTags(text) {
    return String(text || "").replace(/<[^>]+>/g, " ");
  }

  function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function parseInteger(value, fallback) {
    var n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
  }

  function safeNumber(value) {
    if (value === undefined || value === null || value === "") return "";
    var n = Number(value);
    if (isNaN(n)) return "";
    return n.toFixed(3);
  }

  function xmlLocalName(node) {
    try {
      if (node.localName) return String(node.localName());
    } catch (e) {
      // ignore
    }
    try {
      return String(node.name());
    } catch (ignore) {
      return "";
    }
  }

  function collectAnnotNodes(xml) {
    var result = [];

    try {
      var descendants = xml.descendants();
      for (var i = 0; i < descendants.length(); i++) {
        var node = descendants[i];
        var parent = null;
        try {
          parent = node.parent();
        } catch (ignore) {
          parent = null;
        }

        if (!parent) continue;
        if (xmlLocalName(parent) !== "annots") continue;
        result.push(node);
      }
    } catch (e) {
      // ignore
    }

    return result;
  }

})();

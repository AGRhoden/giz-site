#target "InDesign"
#targetengine "epub_premium_ui"

(function () {
  var defaults = {
    // Preflight
    autoRenameStyles: true,
    autoClearOverrides: true,
    autoApplyDefaultParagraphStyle: true,
    defaultParagraphStyleName: "texto",
    clearPreviousFlags: true,
    markAutoApplied: true,
    markOverridesCleared: false,
    flagOverrides: false,
    flagUnstyledParagraphs: true,
    flagInvalidStyleNames: true,

    // Tagging
    applyExportTagsParagraph: true,
    applyExportTagsCharacter: true,
    useGroupPrefixInClass: true,
    paragraphRules: "titulo1 => h1\n" +
      "titulo2 => h2\n" +
      "titulo3 => h3\n" +
      "titulo4 => h4\n" +
      "capitulo => h1\n" +
      "subtitulo => h2\n" +
      "texto => p\n" +
      "nota => p\n" +
      "recuo => p\n" +
      "capitular => p",
    characterRules: "italico => em\n" +
      "negrito => strong\n" +
      "bold => strong\n" +
      "italic => em",
    paragraphDefaultTag: "p",
    characterDefaultTag: "span",

    // TOC/Notas
    linkTocEntries: false,
    tocEntryStyleName: "toc",
    headingStyleFilter: "h1,h2,h3,h4,h5,h6",
    linkFootnotes: false,
    addFootnoteBacklink: false,

    // Export
    exportAfterRun: false,
    showExportDialog: true
  };

  var existing = $.global.__epubPremiumPalette;
  if (existing && existing instanceof Window) {
    try {
      existing.show();
      existing.active = true;
    } catch (e) {
      // ignore
    }
    return;
  }

  var w = new Window("palette", "EPUB Premium 2.0");
  w.alignChildren = "fill";

  var tabs = w.add("tabbedpanel");
  tabs.alignChildren = "fill";

  var tabPre = tabs.add("tab", undefined, "Preflight");
  tabPre.alignChildren = "left";
  tabPre.margins = 12;

  var cbRename = tabPre.add("checkbox", undefined, "Renomear estilos para CSS-safe");
  cbRename.value = defaults.autoRenameStyles;

  var cbClearOverrides = tabPre.add("checkbox", undefined, "Limpar overrides");
  cbClearOverrides.value = defaults.autoClearOverrides;

  var cbApplyDefault = tabPre.add("checkbox", undefined, "Aplicar estilo padrao em [Paragrafo basico]");
  cbApplyDefault.value = defaults.autoApplyDefaultParagraphStyle;

  var gDefault = tabPre.add("group");
  gDefault.add("statictext", undefined, "Nome do estilo padrao:");
  var etDefault = gDefault.add("edittext", undefined, defaults.defaultParagraphStyleName);
  etDefault.characters = 18;

  var tabTags = tabs.add("tab", undefined, "Tagging");
  tabTags.alignChildren = "left";
  tabTags.margins = 12;

  var cbTagPara = tabTags.add("checkbox", undefined, "Aplicar Export Tagging em Paragrafos");
  cbTagPara.value = defaults.applyExportTagsParagraph;

  var cbTagChar = tabTags.add("checkbox", undefined, "Aplicar Export Tagging em Caracteres");
  cbTagChar.value = defaults.applyExportTagsCharacter;

  var cbGroupPrefix = tabTags.add("checkbox", undefined, "Usar prefixo de grupo no class (CSS)");
  cbGroupPrefix.value = defaults.useGroupPrefixInClass;

  var gParaRules = tabTags.add("panel", undefined, "Regras de Paragrafo (regex => tag)");
  gParaRules.alignChildren = "fill";
  gParaRules.margins = 8;
  var etParaRules = gParaRules.add("edittext", undefined, defaults.paragraphRules, { multiline: true, scrolling: true });
  etParaRules.preferredSize = [360, 110];

  var gParaDefault = tabTags.add("group");
  gParaDefault.add("statictext", undefined, "Tag default de paragrafo:");
  var etParaDefault = gParaDefault.add("edittext", undefined, defaults.paragraphDefaultTag);
  etParaDefault.characters = 10;

  var gCharRules = tabTags.add("panel", undefined, "Regras de Caractere (regex => tag)");
  gCharRules.alignChildren = "fill";
  gCharRules.margins = 8;
  var etCharRules = gCharRules.add("edittext", undefined, defaults.characterRules, { multiline: true, scrolling: true });
  etCharRules.preferredSize = [360, 80];

  var gCharDefault = tabTags.add("group");
  gCharDefault.add("statictext", undefined, "Tag default de caractere:");
  var etCharDefault = gCharDefault.add("edittext", undefined, defaults.characterDefaultTag);
  etCharDefault.characters = 10;

  var tabLinks = tabs.add("tab", undefined, "TOC & Notas");
  tabLinks.alignChildren = "left";
  tabLinks.margins = 12;

  var cbLinkToc = tabLinks.add("checkbox", undefined, "Linkar entradas do indice (TOC) para titulos");
  cbLinkToc.value = defaults.linkTocEntries;

  var gToc = tabLinks.add("group");
  gToc.add("statictext", undefined, "Estilo das entradas do TOC:");
  var etTocStyle = gToc.add("edittext", undefined, defaults.tocEntryStyleName);
  etTocStyle.characters = 16;

  var gHeading = tabLinks.add("group");
  gHeading.add("statictext", undefined, "Usar estilos/tag de cabecalho:");
  var etHeading = gHeading.add("edittext", undefined, defaults.headingStyleFilter);
  etHeading.characters = 24;

  var cbLinkFoot = tabLinks.add("checkbox", undefined, "Linkar referencias de notas de rodape para o texto da nota");
  cbLinkFoot.value = defaults.linkFootnotes;

  var cbFootBack = tabLinks.add("checkbox", undefined, "Adicionar backlink simples na nota (texto)");
  cbFootBack.value = defaults.addFootnoteBacklink;

  var tabExport = tabs.add("tab", undefined, "Export");
  tabExport.alignChildren = "left";
  tabExport.margins = 12;

  var cbExport = tabExport.add("checkbox", undefined, "Exportar EPUB ao final");
  cbExport.value = defaults.exportAfterRun;

  var cbShowExport = tabExport.add("checkbox", undefined, "Mostrar dialogo de exportacao");
  cbShowExport.value = defaults.showExportDialog;

  var gBtns = w.add("group");
  gBtns.alignment = "right";
  var btnRun = gBtns.add("button", undefined, "Executar");
  var btnClear = gBtns.add("button", undefined, "Limpar marcas");
  var btnClose = gBtns.add("button", undefined, "Fechar");

  btnRun.onClick = function () {
    if (app.documents.length === 0) {
      alert("Abra um documento antes de rodar o script.");
      return;
    }

    var doc = app.activeDocument;
    var options = collectOptions();

    app.doScript(function () {
      runPremium(doc, options);
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "EPUB premium");
  };

  btnClear.onClick = function () {
    if (app.documents.length === 0) {
      alert("Abra um documento antes de rodar o script.");
      return;
    }

    var doc = app.activeDocument;
    app.doScript(function () {
      removeConditionIfExists(doc, "EPUB_FLAG");
      removeConditionIfExists(doc, "EPUB_AUTO");
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "EPUB limpar marcas");
  };

  btnClose.onClick = function () {
    w.close();
  };

  w.onClose = function () {
    $.global.__epubPremiumPalette = null;
    return true;
  };

  $.global.__epubPremiumPalette = w;
  w.show();

  function collectOptions() {
    return {
      autoRenameStyles: cbRename.value,
      autoClearOverrides: cbClearOverrides.value,
      autoApplyDefaultParagraphStyle: cbApplyDefault.value,
      defaultParagraphStyleName: etDefault.text || "texto",
      clearPreviousFlags: defaults.clearPreviousFlags,
      markAutoApplied: defaults.markAutoApplied,
      markOverridesCleared: defaults.markOverridesCleared,
      flagOverrides: defaults.flagOverrides,
      flagUnstyledParagraphs: defaults.flagUnstyledParagraphs,
      flagInvalidStyleNames: defaults.flagInvalidStyleNames,

      applyExportTagsParagraph: cbTagPara.value,
      applyExportTagsCharacter: cbTagChar.value,
      useGroupPrefixInClass: cbGroupPrefix.value,
      paragraphRules: etParaRules.text,
      characterRules: etCharRules.text,
      paragraphDefaultTag: etParaDefault.text || "p",
      characterDefaultTag: etCharDefault.text || "span",

      linkTocEntries: cbLinkToc.value,
      tocEntryStyleName: etTocStyle.text || "toc",
      headingStyleFilter: etHeading.text || "h1,h2,h3",
      linkFootnotes: cbLinkFoot.value,
      addFootnoteBacklink: cbFootBack.value,

      exportAfterRun: cbExport.value,
      showExportDialog: cbShowExport.value
    };
  }

  function runPremium(doc, opts) {
    var storyCount = doc.stories.length;
    var textFrameCount = doc.textFrames.length;

    if (storyCount === 0) {
      alert("Nenhuma story encontrada. O documento parece estar sem texto.\n" +
        "Text frames: " + textFrameCount + "\n\n" +
        "Abra um documento com texto e rode novamente.");
      return;
    }

    var STYLE_PARA = (typeof StyleType !== "undefined" && StyleType.PARAGRAPH_STYLE_TYPE)
      ? StyleType.PARAGRAPH_STYLE_TYPE
      : null;
    var STYLE_CHAR = (typeof StyleType !== "undefined" && StyleType.CHARACTER_STYLE_TYPE)
      ? StyleType.CHARACTER_STYLE_TYPE
      : null;

    var OVERRIDE_ALL = (typeof OverrideType !== "undefined" && OverrideType.ALL)
      ? OverrideType.ALL
      : null;

    function isBracketStyle(name) {
      return /^\[.*\]$/.test(name);
    }

    function stripAccents(s) {
      var map = {
        "a": /[\u00C0-\u00C5\u00E0-\u00E5]/g,
        "c": /[\u00C7\u00E7]/g,
        "e": /[\u00C8-\u00CB\u00E8-\u00EB]/g,
        "i": /[\u00CC-\u00CF\u00EC-\u00EF]/g,
        "n": /[\u00D1\u00F1]/g,
        "o": /[\u00D2-\u00D6\u00D8\u00F2-\u00F6\u00F8]/g,
        "u": /[\u00D9-\u00DC\u00F9-\u00FC]/g,
        "y": /[\u00DD\u00FD\u00FF]/g
      };
      for (var k in map) {
        s = s.replace(map[k], k);
      }
      return s;
    }

    function normalizeStyleName(name) {
      var s = name.toLowerCase();
      s = stripAccents(s);
      s = s.replace(/[^a-z0-9]+/g, "");
      s = s.replace(/^[0-9]+/, "");
      if (!s) s = "style";
      if (!/^[a-z]/.test(s)) s = "s" + s;
      return s;
    }

    function cssSafeClass(name) {
      var s = name.toLowerCase();
      s = stripAccents(s);
      s = s.replace(/[^a-z0-9-]+/g, "-");
      s = s.replace(/-+/g, "-");
      s = s.replace(/^[-0-9]+/, "");
      if (!s) s = "style";
      if (!/^[a-z]/.test(s)) s = "s" + s;
      return s;
    }

    function isCssSafe(name) {
      return /^[a-z][a-z0-9]*$/.test(name);
    }

    function buildUsedSetFromSafeStyles(collection) {
      var used = {};
      for (var i = 0; i < collection.length; i++) {
        var name = collection[i].name;
        if (isBracketStyle(name)) continue;
        if (isCssSafe(name)) used[name] = true;
      }
      return used;
    }

    function makeUniqueName(base, used, collection) {
      var name = base;
      var n = 2;
      while (used[name]) {
        name = base + n;
        n++;
      }
      if (collection) {
        try {
          while (collection.itemByName(name).isValid) {
            name = base + n;
            n++;
          }
        } catch (e) {
          // ignore
        }
      }
      return name;
    }

    function tryRenameStyle(styleObj, targetName, collection) {
      if (styleObj.name === targetName) return true;
      try {
        if (collection.itemByName(targetName).isValid) return false;
      } catch (e) {
        // ignore
      }
      try {
        styleObj.name = targetName;
        return true;
      } catch (e2) {
        return false;
      }
    }

    function renameStyles(collection, stats) {
      var used = buildUsedSetFromSafeStyles(collection);
      for (var i = 0; i < collection.length; i++) {
        var style = collection[i];
        var name = style.name;
        if (isBracketStyle(name)) continue;
        if (isCssSafe(name)) {
          used[name] = true;
          continue;
        }

        var base = normalizeStyleName(name);
        var unique = makeUniqueName(base, used, collection);

        if (tryRenameStyle(style, unique, collection)) {
          stats.renamed++;
          used[unique] = true;
        } else {
          stats.renameFailed++;
        }
      }
    }

    function getOrCreateConditionWith(name, color, method, visible) {
      var cond;
      try {
        cond = doc.conditions.itemByName(name);
        if (!cond.isValid) cond = null;
      } catch (e) {
        cond = null;
      }

      if (!cond) {
        cond = doc.conditions.add({
          name: name,
          indicatorColor: color,
          indicatorMethod: method,
          visible: visible
        });
      } else {
        cond.indicatorColor = color;
        cond.indicatorMethod = method;
        cond.visible = visible;
      }

      return cond;
    }

    function applyFlag(textObj, cond) {
      try {
        textObj.applyConditions([cond], false);
        return true;
      } catch (e) {
        return false;
      }
    }

    function textHasOverridesSafe(textObj, styleType) {
      try {
        if (styleType !== null) return textObj.textHasOverrides(styleType, false);
        return textObj.textHasOverrides();
      } catch (e1) {
        try {
          return textObj.textHasOverrides();
        } catch (e2) {
          try {
            return !!textObj.styleOverridden;
          } catch (e3) {
            return false;
          }
        }
      }
    }

    function clearOverridesSafe(textObj) {
      try {
        if (OVERRIDE_ALL !== null) {
          textObj.clearOverrides(OVERRIDE_ALL);
          return true;
        }
      } catch (e1) {
        // ignore
      }
      try {
        textObj.clearOverrides();
        return true;
      } catch (e2) {
        return false;
      }
    }

    function getOrCreateParagraphStyle(name) {
      var ps;
      try {
        ps = doc.paragraphStyles.itemByName(name);
        if (!ps.isValid) ps = null;
      } catch (e) {
        ps = null;
      }
      if (!ps) {
        try {
          ps = doc.paragraphStyles.add({ name: name });
        } catch (e2) {
          ps = null;
        }
      }
      return ps;
    }

    function parseRules(text) {
      var rules = [];
      var lines = text.split(/\r?\n/);
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s+|\s+$/g, "");
        if (!line || line.indexOf("#") === 0) continue;
        var parts = line.split(/=>|=/);
        if (parts.length < 2) continue;
        var pattern = parts[0].replace(/^\s+|\s+$/g, "");
        var tag = parts[1].replace(/^\s+|\s+$/g, "");
        if (!pattern || !tag) continue;
        try {
          rules.push({ re: new RegExp(pattern, "i"), tag: tag });
        } catch (e) {
          // ignore invalid regex
        }
      }
      return rules;
    }

    function getTagForStyle(name, rules, fallbackTag) {
      for (var i = 0; i < rules.length; i++) {
        if (rules[i].re.test(name)) return rules[i].tag;
      }
      return fallbackTag;
    }

    function getStyleGroupPath(style) {
      var names = [];
      try {
        var p = style.parent;
        while (p && p !== doc) {
          if (p.name && /StyleGroup/.test(p.constructor.name)) {
            names.unshift(p.name);
          }
          p = p.parent;
        }
      } catch (e) {
        // ignore
      }
      return names;
    }

    function buildExportClassName(style, useGroupPrefix) {
      var parts = [];
      if (useGroupPrefix) {
        var groups = getStyleGroupPath(style);
        for (var i = 0; i < groups.length; i++) {
          parts.push(cssSafeClass(groups[i]));
        }
      }
      parts.push(cssSafeClass(style.name));
      return parts.join("-");
    }

    function removeConditionIfExists(doc, name) {
      try {
        var c = doc.conditions.itemByName(name);
        if (c.isValid) c.remove();
      } catch (e) {
        // ignore
      }
    }

    function clearExistingExportMaps(style, exportType) {
      try {
        var maps = style.styleExportTagMaps;
        for (var i = maps.length - 1; i >= 0; i--) {
          if (maps[i].exportType === exportType) maps[i].remove();
        }
      } catch (e) {
        // ignore
      }
    }

    function setExportTag(style, exportType, tag, cls) {
      clearExistingExportMaps(style, exportType);
      var attrs = "";
      try {
        style.styleExportTagMaps.add({
          exportType: exportType,
          exportTag: tag || "",
          exportClass: cls || "",
          exportAttributes: attrs
        });
        return true;
      } catch (e1) {
        try {
          style.styleExportTagMaps.add({
            exportType: exportType,
            exportTag: tag || "",
            exportClass: "",
            exportAttributes: attrs
          });
          return true;
        } catch (e2) {
          try {
            style.styleExportTagMaps.add({
              exportType: exportType,
              exportTag: "",
              exportClass: cls || "",
              exportAttributes: attrs
            });
            return true;
          } catch (e3) {
            return false;
          }
        }
      }
    }

    function normalizeKey(text) {
      var s = text.replace(/\s+/g, " ");
      s = s.replace(/\.\.+/g, " ");
      s = s.replace(/\s+\d+\s*$/, "");
      s = s.replace(/[^\w\s]/g, "");
      s = s.replace(/\s+/g, " ").toLowerCase();
      return s;
    }

    function createHeadingDestinations(doc, headingStyles) {
      var dests = {};
      var stories = doc.stories;
      var count = 0;

      for (var s = 0; s < stories.length; s++) {
        var paras = stories[s].paragraphs;
        for (var p = 0; p < paras.length; p++) {
          var para = paras[p];
          var name = para.appliedParagraphStyle.name;
          if (!headingStyles[name]) continue;

          var key = normalizeKey(para.contents);
          if (!key) continue;

          try {
            var destName = "hd_" + key + "_" + count;
            var dest = doc.hyperlinkTextDestinations.add(para.insertionPoints[0], { name: destName });
            if (!dests[key]) dests[key] = [];
            dests[key].push(dest);
            count++;
          } catch (e) {
            // ignore
          }
        }
      }

      return { map: dests, count: count };
    }

    function linkToc(doc, tocStyleName, destsByKey) {
      var linked = 0;
      var stories = doc.stories;

      for (var s = 0; s < stories.length; s++) {
        var paras = stories[s].paragraphs;
        for (var p = 0; p < paras.length; p++) {
          var para = paras[p];
          if (para.appliedParagraphStyle.name !== tocStyleName) continue;

          var key = normalizeKey(para.contents);
          if (!destsByKey[key] || destsByKey[key].length === 0) continue;

          var dest = destsByKey[key].shift();
          try {
            var src = doc.hyperlinkTextSources.add(para.texts[0]);
            doc.hyperlinks.add(src, dest);
            linked++;
          } catch (e) {
            // ignore
          }
        }
      }

      return linked;
    }

    function linkFootnotes(doc, addBacklink) {
      var linked = 0;
      var footnotes = doc.footnotes;

      for (var i = 0; i < footnotes.length; i++) {
        var fn = footnotes[i];
        var ref = null;
        var fnText = null;

        try { ref = fn.storyOffset; } catch (e1) { ref = null; }
        try { fnText = fn.texts[0]; } catch (e2) { fnText = null; }

        if (!ref || !fnText) continue;

        try {
          var dest = doc.hyperlinkTextDestinations.add(fnText.insertionPoints[0], { name: "fn_" + i });
          var src = doc.hyperlinkTextSources.add(ref);
          doc.hyperlinks.add(src, dest);
          linked++;

          if (addBacklink) {
            try {
              fnText.insertionPoints[-1].contents = " [voltar]";
              var backDest = doc.hyperlinkTextDestinations.add(ref, { name: "fn_back_" + i });
              var backSrc = doc.hyperlinkTextSources.add(fnText.words[-1]);
              doc.hyperlinks.add(backSrc, backDest);
            } catch (e3) {
              // ignore
            }
          }
        } catch (e) {
          // ignore
        }
      }

      return linked;
    }

    function exportEpub(doc, showDialog) {
      var fmt = null;
      try { fmt = ExportFormat.EPUB_REFLOWABLE; } catch (e1) { fmt = null; }
      if (!fmt) {
        try { fmt = ExportFormat.EPUB; } catch (e2) { fmt = null; }
      }
      if (!fmt) {
        alert("Nao foi possivel localizar o formato EPUB no InDesign.");
        return false;
      }

      var file = File.saveDialog("Salvar EPUB", "*.epub");
      if (!file) return false;

      try {
        doc.exportFile(fmt, file, showDialog);
        return true;
      } catch (e) {
        alert("Falha ao exportar EPUB: " + e);
        return false;
      }
    }

    // ===== Execucao =====

    if (opts.clearPreviousFlags) {
      removeConditionIfExists(doc, "EPUB_FLAG");
      removeConditionIfExists(doc, "EPUB_AUTO");
    }

    var condFlag = getOrCreateConditionWith("EPUB_FLAG", UIColors.RED, ConditionIndicatorMethod.USE_HIGHLIGHT, true);
    var condAuto = getOrCreateConditionWith("EPUB_AUTO", UIColors.BLUE, ConditionIndicatorMethod.USE_HIGHLIGHT, true);

    var counts = {
      paraTotal: 0,
      paraFlagged: 0,
      paraStyleIssues: 0,
      paraOverrideIssues: 0,
      paraOverridesCleared: 0,
      paraDefaultApplied: 0,
      paraAutoMarked: 0,
      charRangeTotal: 0,
      charRangeFlagged: 0,
      charStyleIssues: 0,
      charOverrideIssues: 0,
      charOverridesCleared: 0,
      charAutoMarked: 0,
      paraRenamed: 0,
      charRenamed: 0,
      paraExportTagged: 0,
      charExportTagged: 0,
      tocLinks: 0,
      footnoteLinks: 0
    };

    // Preflight: rename styles
    if (opts.autoRenameStyles) {
      var statsPara = { renamed: 0, renameFailed: 0 };
      var statsChar = { renamed: 0, renameFailed: 0 };
      renameStyles(doc.paragraphStyles, statsPara);
      renameStyles(doc.characterStyles, statsChar);
      counts.paraRenamed = statsPara.renamed;
      counts.charRenamed = statsChar.renamed;
    }

    // Tagging rules
    var paraRules = parseRules(opts.paragraphRules);
    var charRules = parseRules(opts.characterRules);

    // Apply export tagging
    if (opts.applyExportTagsParagraph) {
      for (var ps = 0; ps < doc.paragraphStyles.length; ps++) {
        var pStyle = doc.paragraphStyles[ps];
        if (isBracketStyle(pStyle.name)) continue;
        var tag = getTagForStyle(pStyle.name, paraRules, opts.paragraphDefaultTag);
        var cls = buildExportClassName(pStyle, opts.useGroupPrefixInClass);
        if (setExportTag(pStyle, "EPUB", tag, cls)) counts.paraExportTagged++;
      }
    }

    if (opts.applyExportTagsCharacter) {
      for (var cs = 0; cs < doc.characterStyles.length; cs++) {
        var cStyle = doc.characterStyles[cs];
        if (isBracketStyle(cStyle.name)) continue;
        var ctag = getTagForStyle(cStyle.name, charRules, opts.characterDefaultTag);
        var ccls = buildExportClassName(cStyle, opts.useGroupPrefixInClass);
        if (setExportTag(cStyle, "EPUB", ctag, ccls)) counts.charExportTagged++;
      }
    }

    // Preflight: scan text
    var stories = doc.stories;
    for (var s = 0; s < stories.length; s++) {
      var story = stories[s];

      // Paragrafos
      var paras = story.paragraphs;
      for (var p = 0; p < paras.length; p++) {
        var para = paras[p];
        counts.paraTotal++;

        var pStyle = para.appliedParagraphStyle;
        var pName = pStyle.name;
        var pIsBracket = isBracketStyle(pName);
        var pIsCssSafe = isCssSafe(pName);

        var needFlag = false;
        if (pIsBracket) {
          if (opts.autoApplyDefaultParagraphStyle) {
            var defaultName = isCssSafe(opts.defaultParagraphStyleName)
              ? opts.defaultParagraphStyleName
              : normalizeStyleName(opts.defaultParagraphStyleName);
            var defaultStyle = getOrCreateParagraphStyle(defaultName);
            if (defaultStyle) {
              try {
                para.appliedParagraphStyle = defaultStyle;
                counts.paraDefaultApplied++;
                pName = defaultStyle.name;
                pIsCssSafe = isCssSafe(pName);
                if (opts.markAutoApplied) {
                  if (applyFlag(para, condAuto)) counts.paraAutoMarked++;
                }
              } catch (e) {
                counts.paraStyleIssues++;
                if (opts.flagUnstyledParagraphs) needFlag = true;
              }
            } else {
              counts.paraStyleIssues++;
              if (opts.flagUnstyledParagraphs) needFlag = true;
            }
          } else {
            counts.paraStyleIssues++;
            if (opts.flagUnstyledParagraphs) needFlag = true;
          }
        } else if (!pIsCssSafe) {
          counts.paraStyleIssues++;
          if (opts.flagInvalidStyleNames) needFlag = true;
        }

        var hasParaOverride = textHasOverridesSafe(para, STYLE_PARA);
        if (hasParaOverride) {
          counts.paraOverrideIssues++;
          if (opts.autoClearOverrides) {
            if (clearOverridesSafe(para)) counts.paraOverridesCleared++;
          }
          if (opts.markOverridesCleared) {
            if (applyFlag(para, condAuto)) counts.paraAutoMarked++;
          }
          if (opts.flagOverrides) needFlag = true;
        }

        if (needFlag) {
          if (applyFlag(para, condFlag)) counts.paraFlagged++;
        }
      }

      // TextStyleRanges (caracteres)
      var ranges = story.textStyleRanges;
      for (var r = 0; r < ranges.length; r++) {
        var range = ranges[r];
        if (range.length === 0) continue;
        counts.charRangeTotal++;

        var cStyle = range.appliedCharacterStyle;
        var cName = cStyle.name;
        var cIsBracket = isBracketStyle(cName);
        var cIsCssSafe = isCssSafe(cName);

        var needFlagRange = false;
        if (!cIsBracket && !cIsCssSafe) {
          counts.charStyleIssues++;
          if (opts.flagInvalidStyleNames) needFlagRange = true;
        }

        var hasCharOverride = textHasOverridesSafe(range, STYLE_CHAR);
        if (hasCharOverride) {
          counts.charOverrideIssues++;
          if (opts.autoClearOverrides) {
            if (clearOverridesSafe(range)) counts.charOverridesCleared++;
          }
          if (opts.markOverridesCleared) {
            if (applyFlag(range, condAuto)) counts.charAutoMarked++;
          }
          if (opts.flagOverrides) needFlagRange = true;
        }

        if (needFlagRange) {
          if (applyFlag(range, condFlag)) counts.charRangeFlagged++;
        }
      }
    }

    // TOC linking
    if (opts.linkTocEntries) {
      var headingStyles = {};
      var hs = opts.headingStyleFilter.split(/\s*,\s*/);
      for (var hi = 0; hi < hs.length; hi++) {
        var hname = hs[hi];
        if (hname) headingStyles[hname] = true;
      }

      var destInfo = createHeadingDestinations(doc, headingStyles);
      counts.tocLinks = linkToc(doc, opts.tocEntryStyleName, destInfo.map);
    }

    // Footnotes linking
    if (opts.linkFootnotes) {
      counts.footnoteLinks = linkFootnotes(doc, opts.addFootnoteBacklink);
    }

    // Export
    var exported = false;
    if (opts.exportAfterRun) {
      exported = exportEpub(doc, opts.showExportDialog);
    }

    var msg = [];
    msg.push("EPUB Premium 2.0 - concluido.");
    msg.push("Stories: " + storyCount + " | Text frames: " + textFrameCount);
    msg.push("");
    msg.push("Preflight:");
    msg.push("  Paragrafos total: " + counts.paraTotal);
    msg.push("  Estilos renomeados (P/C): " + counts.paraRenamed + " / " + counts.charRenamed);
    msg.push("  Overrides limpos (P/C): " + counts.paraOverridesCleared + " / " + counts.charOverridesCleared);
    msg.push("  Default aplicado: " + counts.paraDefaultApplied);
    msg.push("  Marcados (P/C): " + counts.paraFlagged + " / " + counts.charRangeFlagged);
    msg.push("");
    msg.push("Tagging:");
    msg.push("  Export tags aplicadas (P/C): " + counts.paraExportTagged + " / " + counts.charExportTagged);
    msg.push("");
    msg.push("Links:");
    msg.push("  TOC links criados: " + counts.tocLinks);
    msg.push("  Footnotes links criados: " + counts.footnoteLinks);
    msg.push("");
    if (exported) msg.push("Export: EPUB gerado com sucesso.");

    var blockingIssues = counts.paraStyleIssues + counts.charStyleIssues;
    if (!opts.autoClearOverrides) {
      blockingIssues += counts.paraOverrideIssues + counts.charOverrideIssues;
    }

    if (blockingIssues === 0) {
      msg.push("OK: documento apto para ePub (sem divergencias).");
    } else {
      msg.push("Atencao: divergencias encontradas. Verifique as marcacoes.");
    }

    alert(msg.join("\n"));
  }

  function removeConditionIfExists(doc, name) {
    try {
      var c = doc.conditions.itemByName(name);
      if (c.isValid) c.remove();
    } catch (e) {
      // ignore
    }
  }
})();

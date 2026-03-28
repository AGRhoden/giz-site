#target "InDesign"
#targetengine "epub_audit_ui"

(function () {
  var defaults = {
    autoRenameStyles: true,
    autoClearOverrides: true,
    autoApplyDefaultParagraphStyle: true,
    defaultParagraphStyleName: "texto",
    clearPreviousFlags: true,
    markAutoApplied: true,
    markOverridesCleared: false,
    flagOverrides: false,
    flagUnstyledParagraphs: true,
    flagInvalidStyleNames: true
  };

  var existing = $.global.__epubAuditPalette;
  if (existing && existing instanceof Window) {
    try {
      existing.show();
      existing.active = true;
    } catch (e) {
      // ignore
    }
    return;
  }

  var w = new Window("palette", "EPUB Auditoria");
  w.alignChildren = "fill";

  var gMain = w.add("panel", undefined, "Acoes");
  gMain.alignChildren = "left";
  gMain.margins = 12;

  var cbRename = gMain.add("checkbox", undefined, "Renomear estilos para CSS-safe");
  cbRename.value = defaults.autoRenameStyles;

  var cbClearOverrides = gMain.add("checkbox", undefined, "Limpar overrides");
  cbClearOverrides.value = defaults.autoClearOverrides;

  var cbApplyDefault = gMain.add("checkbox", undefined, "Aplicar estilo padrao em [Paragrafo basico]");
  cbApplyDefault.value = defaults.autoApplyDefaultParagraphStyle;

  var gDefault = gMain.add("group");
  gDefault.add("statictext", undefined, "Nome do estilo padrao:");
  var etDefault = gDefault.add("edittext", undefined, defaults.defaultParagraphStyleName);
  etDefault.characters = 18;

  var gMarks = w.add("panel", undefined, "Marcacoes");
  gMarks.alignChildren = "left";
  gMarks.margins = 12;

  var cbClearPrev = gMarks.add("checkbox", undefined, "Limpar marcacoes anteriores");
  cbClearPrev.value = defaults.clearPreviousFlags;

  var cbMarkAuto = gMarks.add("checkbox", undefined, "Marcar alteracoes automaticas (EPUB_AUTO)");
  cbMarkAuto.value = defaults.markAutoApplied;

  var cbMarkOverrideCleared = gMarks.add("checkbox", undefined, "Marcar overrides limpos (EPUB_AUTO)");
  cbMarkOverrideCleared.value = defaults.markOverridesCleared;

  var cbFlagOverrides = gMarks.add("checkbox", undefined, "Marcar overrides como problema (EPUB_FLAG)");
  cbFlagOverrides.value = defaults.flagOverrides;

  var cbFlagUnstyled = gMarks.add("checkbox", undefined, "Marcar [Paragrafo basico]");
  cbFlagUnstyled.value = defaults.flagUnstyledParagraphs;

  var cbFlagInvalid = gMarks.add("checkbox", undefined, "Marcar estilos com nome invalido");
  cbFlagInvalid.value = defaults.flagInvalidStyleNames;

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
      runAudit(doc, options);
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "EPUB audit");
  };

  btnClear.onClick = function () {
    if (app.documents.length === 0) {
      alert("Abra um documento antes de rodar o script.");
      return;
    }

    var doc = app.activeDocument;
    app.doScript(function () {
      clearAllMarks(doc);
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "EPUB limpar marcas");
  };

  btnClose.onClick = function () {
    w.close();
  };

  w.onClose = function () {
    $.global.__epubAuditPalette = null;
    return true;
  };

  $.global.__epubAuditPalette = w;
  w.show();

  function collectOptions() {
    return {
      autoRenameStyles: cbRename.value,
      autoClearOverrides: cbClearOverrides.value,
      autoApplyDefaultParagraphStyle: cbApplyDefault.value,
      defaultParagraphStyleName: etDefault.text || "texto",
      clearPreviousFlags: cbClearPrev.value,
      markAutoApplied: cbMarkAuto.value,
      markOverridesCleared: cbMarkOverrideCleared.value,
      flagOverrides: cbFlagOverrides.value,
      flagUnstyledParagraphs: cbFlagUnstyled.value,
      flagInvalidStyleNames: cbFlagInvalid.value
    };
  }

  function clearAllMarks(doc) {
    removeConditionIfExists(doc, "EPUB_FLAG");
    removeConditionIfExists(doc, "EPUB_AUTO");
  }

  function removeConditionIfExists(doc, name) {
    try {
      var c = doc.conditions.itemByName(name);
      if (c.isValid) c.remove();
    } catch (e) {
      // ignore
    }
  }

  function runAudit(doc, opts) {
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

    function normalizeCssSafeBase(name) {
      var s = name.toLowerCase();
      s = stripAccents(s);
      s = s.replace(/[^a-z0-9]+/g, "");
      s = s.replace(/^[0-9]+/, "");
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

        var base = normalizeCssSafeBase(name);
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

    var FLAG_CONDITION_NAME = "EPUB_FLAG";
    var FLAG_COLOR = UIColors.RED;
    var FLAG_METHOD = ConditionIndicatorMethod.USE_HIGHLIGHT;
    var FLAG_VISIBLE = true;

    var AUTO_CONDITION_NAME = "EPUB_AUTO";
    var AUTO_COLOR = UIColors.BLUE;
    var AUTO_METHOD = ConditionIndicatorMethod.USE_HIGHLIGHT;
    var AUTO_VISIBLE = true;

    var renameStatsPara = { renamed: 0, renameFailed: 0 };
    var renameStatsChar = { renamed: 0, renameFailed: 0 };

    if (opts.autoRenameStyles) {
      renameStyles(doc.paragraphStyles, renameStatsPara);
      renameStyles(doc.characterStyles, renameStatsChar);
    }

    if (opts.clearPreviousFlags) {
      removeConditionIfExists(doc, FLAG_CONDITION_NAME);
      removeConditionIfExists(doc, AUTO_CONDITION_NAME);
    }

    var condFlag = getOrCreateConditionWith(FLAG_CONDITION_NAME, FLAG_COLOR, FLAG_METHOD, FLAG_VISIBLE);
    var condAuto = null;
    if (opts.markAutoApplied || opts.markOverridesCleared) {
      condAuto = getOrCreateConditionWith(AUTO_CONDITION_NAME, AUTO_COLOR, AUTO_METHOD, AUTO_VISIBLE);
    }

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
      charAutoMarked: 0
    };

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
              : normalizeCssSafeBase(opts.defaultParagraphStyleName);
            var defaultStyle = getOrCreateParagraphStyle(defaultName);
            if (defaultStyle) {
              try {
                para.appliedParagraphStyle = defaultStyle;
                counts.paraDefaultApplied++;
                pName = defaultStyle.name;
                pIsCssSafe = isCssSafe(pName);
                if (opts.markAutoApplied && condAuto) {
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
          if (opts.markOverridesCleared && condAuto) {
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
          if (opts.markOverridesCleared && condAuto) {
            if (applyFlag(range, condAuto)) counts.charAutoMarked++;
          }
          if (opts.flagOverrides) needFlagRange = true;
        }

        if (needFlagRange) {
          if (applyFlag(range, condFlag)) counts.charRangeFlagged++;
        }
      }
    }

    var blockingIssues = counts.paraStyleIssues + counts.charStyleIssues;
    if (!opts.autoClearOverrides) {
      blockingIssues += counts.paraOverrideIssues + counts.charOverrideIssues;
    }

    var msg = [];
    msg.push("Varredura concluida.");
    msg.push("Stories: " + storyCount + " | Text frames: " + textFrameCount);
    msg.push("");
    msg.push("Paragrafos:");
    msg.push("  Total: " + counts.paraTotal);
    msg.push("  Marcados: " + counts.paraFlagged);
    msg.push("  Estilo fora do padrao: " + counts.paraStyleIssues);
    msg.push("  Overrides: " + counts.paraOverrideIssues);
    msg.push("  Overrides limpos: " + counts.paraOverridesCleared);
    msg.push("  Default aplicado: " + counts.paraDefaultApplied);
    msg.push("  Auto marcados: " + counts.paraAutoMarked);
    msg.push("  Estilos renomeados: " + renameStatsPara.renamed);
    if (renameStatsPara.renameFailed > 0) msg.push("  Falhas ao renomear: " + renameStatsPara.renameFailed);
    msg.push("");
    msg.push("Caracteres (text style ranges):");
    msg.push("  Total: " + counts.charRangeTotal);
    msg.push("  Marcados: " + counts.charRangeFlagged);
    msg.push("  Estilo fora do padrao: " + counts.charStyleIssues);
    msg.push("  Overrides: " + counts.charOverrideIssues);
    msg.push("  Overrides limpos: " + counts.charOverridesCleared);
    msg.push("  Auto marcados: " + counts.charAutoMarked);
    msg.push("  Estilos renomeados: " + renameStatsChar.renamed);
    if (renameStatsChar.renameFailed > 0) msg.push("  Falhas ao renomear: " + renameStatsChar.renameFailed);
    msg.push("");

    if (counts.paraTotal === 0 && counts.charRangeTotal === 0) {
      msg.push("AVISO: nenhum paragrafo ou trecho de caractere encontrado.");
      msg.push("Verifique se o documento realmente contem texto editavel.");
    } else if (blockingIssues === 0) {
      msg.push("OK: documento apto para ePub (nenhuma divergencia encontrada).");
    } else {
      msg.push("Encontradas divergencias. Verifique as marcacoes com a Condition: " + FLAG_CONDITION_NAME + ".");
    }

    if (opts.flagOverrides || opts.markAutoApplied || opts.markOverridesCleared || opts.flagUnstyledParagraphs || opts.flagInvalidStyleNames) {
      msg.push("");
      msg.push("Obs.: marcacoes podem permanecer porque as opcoes de marcar foram ativadas.");
      msg.push("Para remover: clique em \"Limpar marcas\" na paleta.");
    }

    alert(msg.join("\n"));
  }
})();

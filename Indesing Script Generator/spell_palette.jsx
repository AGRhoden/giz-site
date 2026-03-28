#target "InDesign"
#targetengine "spell_palette_ui"

(function () {
  var IGNORE_CONDITION_NAME = "SPELL_IGNORE_NAME";
  var DEFAULT_LANGUAGE_HINT = "portugu";

  var existing = $.global.__spellPaletteWindow;
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
    mode: "",
    stopRequested: false,
    targetLanguageName: "",
    suspectEntries: [],
    suspectIndex: -1,
    languageEntries: [],
    languageIndex: -1,
    scanSession: null,
    idleTask: null
  };

  var w = new Window("palette", "Ortografia e Dicionarios");
  w.alignChildren = "fill";
  w.orientation = "column";
  w.preferredSize = [700, 560];

  var tabs = w.add("tabbedpanel");
  tabs.alignChildren = "fill";
  tabs.preferredSize = [680, 500];

  var tabSuspects = tabs.add("tab", undefined, "Suspeitas");
  tabSuspects.alignChildren = "fill";
  tabSuspects.margins = 12;

  var pnlSuspectOptions = tabSuspects.add("panel", undefined, "Filtros");
  pnlSuspectOptions.alignChildren = "left";
  pnlSuspectOptions.margins = 12;

  var suspectLangRow = pnlSuspectOptions.add("group");
  suspectLangRow.add("statictext", undefined, "Idioma alvo:");
  var ddSuspectLanguage = suspectLangRow.add("dropdownlist", undefined, []);
  ddSuspectLanguage.minimumSize.width = 280;

  var cbIgnoreMarked = pnlSuspectOptions.add("checkbox", undefined, "Ignorar textos marcados como nome proprio");
  cbIgnoreMarked.value = true;

  var cbIgnoreCapitalized = pnlSuspectOptions.add("checkbox", undefined, "Ignorar palavras com inicial maiuscula");
  cbIgnoreCapitalized.value = true;

  var cbIgnoreAllCaps = pnlSuspectOptions.add("checkbox", undefined, "Ignorar palavras em CAIXA ALTA");
  cbIgnoreAllCaps.value = true;

  var cbFlagNonLatin = pnlSuspectOptions.add("checkbox", undefined, "Listar palavras em alfabetos nao latinos");
  cbFlagNonLatin.value = true;

  var cbOnlyNonTarget = pnlSuspectOptions.add("checkbox", undefined, "Listar apenas palavras fora do idioma alvo");
  cbOnlyNonTarget.value = false;

  var gMinChars = pnlSuspectOptions.add("group");
  gMinChars.add("statictext", undefined, "Minimo de letras:");
  var etMinChars = gMinChars.add("edittext", undefined, "3");
  etMinChars.characters = 4;

  var suspectPageRow = pnlSuspectOptions.add("group");
  suspectPageRow.add("statictext", undefined, "Paginas:");
  var etSuspectPageFrom = suspectPageRow.add("edittext", undefined, "");
  etSuspectPageFrom.characters = 6;
  suspectPageRow.add("statictext", undefined, "ate");
  var etSuspectPageTo = suspectPageRow.add("edittext", undefined, "");
  etSuspectPageTo.characters = 6;

  var txtSuspectStatus = tabSuspects.add("statictext", undefined, "Escaneia por suspeitas sem usar o Verificar ortografia nativo.");
  txtSuspectStatus.characters = 90;

  var listSuspects = tabSuspects.add("listbox", undefined, [], { multiselect: false });
  listSuspects.preferredSize = [650, 220];

  var txtSuspectMeta = tabSuspects.add("statictext", undefined, "Pagina: - | Idioma: - | Motivo: -");
  txtSuspectMeta.characters = 90;

  var txtSuspectPreview = tabSuspects.add("statictext", undefined, "Contexto: -", { multiline: true });
  txtSuspectPreview.minimumSize.height = 42;

  var suspectActionRow = tabSuspects.add("group");
  suspectActionRow.alignment = "fill";
  var btnSuspectScan = suspectActionRow.add("button", undefined, "Escanear");
  var btnSuspectStop = suspectActionRow.add("button", undefined, "Stop");
  var btnSuspectPrev = suspectActionRow.add("button", undefined, "Anterior");
  var btnSuspectNext = suspectActionRow.add("button", undefined, "Proximo");
  var btnSuspectFocus = suspectActionRow.add("button", undefined, "Localizar");
  var btnMarkIgnore = suspectActionRow.add("button", undefined, "Marcar nome");

  var tabLanguages = tabs.add("tab", undefined, "Idiomas");
  tabLanguages.alignChildren = "fill";
  tabLanguages.margins = 12;

  var pnlLangOptions = tabLanguages.add("panel", undefined, "Auditoria");
  pnlLangOptions.alignChildren = "left";
  pnlLangOptions.margins = 12;

  var langRow = pnlLangOptions.add("group");
  langRow.add("statictext", undefined, "Idioma esperado:");
  var ddAuditLanguage = langRow.add("dropdownlist", undefined, []);
  ddAuditLanguage.minimumSize.width = 280;

  var cbParagraphMode = pnlLangOptions.add("checkbox", undefined, "Auditar por paragrafo (mais rapido)");
  cbParagraphMode.value = false;

  var cbShowOnlyUnexpected = pnlLangOptions.add("checkbox", undefined, "Mostrar apenas idiomas diferentes do esperado");
  cbShowOnlyUnexpected.value = true;

  var cbWordLevelMismatch = pnlLangOptions.add("checkbox", undefined, "Priorizar palavras em alfabeto latino com idioma estranho");
  cbWordLevelMismatch.value = true;

  var cbSafeApply = pnlLangOptions.add("checkbox", undefined, "Reverter se a composicao do paragrafo mudar");
  cbSafeApply.value = true;

  var langPageRow = pnlLangOptions.add("group");
  langPageRow.add("statictext", undefined, "Paginas:");
  var etLangPageFrom = langPageRow.add("edittext", undefined, "");
  etLangPageFrom.characters = 6;
  langPageRow.add("statictext", undefined, "ate");
  var etLangPageTo = langPageRow.add("edittext", undefined, "");
  etLangPageTo.characters = 6;

  var txtLangStatus = tabLanguages.add("statictext", undefined, "Lista palavras ou trechos com idioma/dicionario aplicado incompatível.");
  txtLangStatus.characters = 90;

  var listLanguages = tabLanguages.add("listbox", undefined, [], { multiselect: false });
  listLanguages.preferredSize = [650, 220];

  var txtLangMeta = tabLanguages.add("statictext", undefined, "Pagina: - | Idioma aplicado: -");
  txtLangMeta.characters = 90;

  var txtLangPreview = tabLanguages.add("statictext", undefined, "Contexto: -", { multiline: true });
  txtLangPreview.minimumSize.height = 42;

  var langActionRow = tabLanguages.add("group");
  langActionRow.alignment = "fill";
  var btnLangScan = langActionRow.add("button", undefined, "Escanear");
  var btnLangStop = langActionRow.add("button", undefined, "Stop");
  var btnLangPrev = langActionRow.add("button", undefined, "Anterior");
  var btnLangNext = langActionRow.add("button", undefined, "Proximo");
  var btnLangFocus = langActionRow.add("button", undefined, "Localizar");
  var btnApplyTarget = langActionRow.add("button", undefined, "Aplicar idioma");
  var btnApplyAll = langActionRow.add("button", undefined, "Aplicar em todos");

  var footer = w.add("group");
  footer.alignment = "right";
  var btnClearMark = footer.add("button", undefined, "Limpar marca");
  var btnClose = footer.add("button", undefined, "Fechar");

  btnSuspectScan.onClick = function () {
    scanSuspects();
  };

  btnSuspectStop.onClick = function () {
    requestStop("Parando varredura de suspeitas...");
  };

  btnSuspectPrev.onClick = function () {
    if (!state.suspectEntries.length) return;
    selectSuspect((state.suspectIndex - 1 + state.suspectEntries.length) % state.suspectEntries.length, true);
  };

  btnSuspectNext.onClick = function () {
    if (!state.suspectEntries.length) return;
    selectSuspect((state.suspectIndex + 1) % state.suspectEntries.length, true);
  };

  btnSuspectFocus.onClick = function () {
    focusEntry(getCurrentSuspect());
  };

  btnMarkIgnore.onClick = function () {
    markSelectionAsProperName();
  };

  btnLangScan.onClick = function () {
    scanLanguages();
  };

  btnLangStop.onClick = function () {
    requestStop("Parando auditoria de idiomas...");
  };

  btnLangPrev.onClick = function () {
    if (!state.languageEntries.length) return;
    selectLanguageEntry((state.languageIndex - 1 + state.languageEntries.length) % state.languageEntries.length, true);
  };

  btnLangNext.onClick = function () {
    if (!state.languageEntries.length) return;
    selectLanguageEntry((state.languageIndex + 1) % state.languageEntries.length, true);
  };

  btnLangFocus.onClick = function () {
    focusEntry(getCurrentLanguageEntry());
  };

  btnApplyTarget.onClick = function () {
    applyTargetLanguageToCurrent();
  };

  btnApplyAll.onClick = function () {
    applyTargetLanguageToAll();
  };

  btnClearMark.onClick = function () {
    clearSelectionProperNameMark();
  };

  btnClose.onClick = function () {
    w.close();
  };

  listSuspects.onChange = function () {
    if (listSuspects.selection) {
      selectSuspect(listSuspects.selection.index, true);
    }
  };

  listLanguages.onChange = function () {
    if (listLanguages.selection) {
      selectLanguageEntry(listLanguages.selection.index, true);
    }
  };

  w.onClose = function () {
    cleanupAfterScan();
    $.global.__spellPaletteWindow = null;
    return true;
  };

  $.global.__spellPaletteWindow = w;
  populateLanguageDropdowns();
  refreshUi();
  w.show();

  function scanSuspects() {
    if (app.documents.length === 0) {
      alert("Abra um documento antes de rodar o script.");
      return;
    }
    if (state.scanSession) {
      alert("Ja existe uma varredura em andamento.");
      return;
    }

    var targetName = getSelectedLanguageName(ddSuspectLanguage);
    var minChars = parseInt(etMinChars.text, 10);
    if (!minChars || minChars < 1) minChars = 3;
    var suspectPageRange = parsePageRange(etSuspectPageFrom.text, etSuspectPageTo.text);

    state.mode = "suspects";
    state.stopRequested = false;
    state.targetLanguageName = targetName;
    setButtonsForRun(true);
    txtSuspectStatus.text = "Escaneando suspeitas...";
    clearSuspectDetail();
    state.suspectEntries = [];
    rebuildSuspectList();
    state.scanSession = {
      kind: "suspects",
      doc: app.activeDocument,
      opts: {
        targetLanguageName: targetName,
        minChars: minChars,
        ignoreMarked: cbIgnoreMarked.value,
        ignoreCapitalized: cbIgnoreCapitalized.value,
        ignoreAllCaps: cbIgnoreAllCaps.value,
        flagNonLatin: cbFlagNonLatin.value,
        onlyNonTarget: cbOnlyNonTarget.value,
        pageRange: suspectPageRange
      },
      stories: app.activeDocument.stories,
      storyIndex: 0,
      itemIndex: 0,
      entries: [],
      processed: 0,
      tick: 0,
      stopped: false
    };
    startIdleScan();
  }

  function scanLanguages() {
    if (app.documents.length === 0) {
      alert("Abra um documento antes de rodar o script.");
      return;
    }
    if (state.scanSession) {
      alert("Ja existe uma varredura em andamento.");
      return;
    }

    var targetName = getSelectedLanguageName(ddAuditLanguage);
    var langPageRange = parsePageRange(etLangPageFrom.text, etLangPageTo.text);

    state.mode = "languages";
    state.stopRequested = false;
    state.targetLanguageName = targetName;
    setButtonsForRun(true);
    txtLangStatus.text = "Auditando idiomas aplicados...";
    clearLanguageDetail();
    state.languageEntries = [];
    rebuildLanguageList();
    state.scanSession = {
      kind: "languages",
      doc: app.activeDocument,
      opts: {
        targetLanguageName: targetName,
        paragraphMode: cbParagraphMode.value,
        onlyUnexpected: cbShowOnlyUnexpected.value,
        wordLevelMismatch: cbWordLevelMismatch.value,
        pageRange: langPageRange
      },
      stories: app.activeDocument.stories,
      storyIndex: 0,
      itemIndex: 0,
      entries: [],
      processed: 0,
      tick: 0,
      stopped: false
    };
    startIdleScan();
  }

  function requestStop(message) {
    if (!state.mode && !state.scanSession) return;
    state.stopRequested = true;
    if (state.mode === "suspects") {
      txtSuspectStatus.text = message;
    } else if (state.mode === "languages") {
      txtLangStatus.text = message;
    }
    pumpEvents();
  }

  function startIdleScan() {
    cleanupIdleTask();
    try {
      state.idleTask = app.idleTasks.add({ name: "spell_palette_scan", sleep: 10 });
      state.idleTask.addEventListener(getIdleEventName(), onIdleScan, false);
    } catch (e) {
      finishScanWithError("Nao foi possivel iniciar a varredura em background.", e);
    }
  }

  function onIdleScan() {
    if (!state.scanSession) {
      cleanupIdleTask();
      return;
    }

    try {
      if (state.stopRequested) {
        state.scanSession.stopped = true;
        finalizeScan();
        return;
      }

      var done = state.scanSession.kind === "suspects"
        ? processSuspectsChunk(state.scanSession, 120)
        : processLanguagesChunk(state.scanSession, 120);

      if (done) {
        finalizeScan();
      }
    } catch (e) {
      finishScanWithError("Falha durante a varredura.", e);
    }
  }

  function processSuspectsChunk(session, budget) {
    var opts = session.opts;
    var targetKey = normalizeLanguageName(opts.targetLanguageName);
    var stories = session.stories;

    while (session.storyIndex < stories.length) {
      var story = stories[session.storyIndex];
      var words = story.words;

      while (session.itemIndex < words.length) {
        if (state.stopRequested) {
          session.stopped = true;
          return true;
        }

        session.tick++;
        if ((session.tick % 10) === 0) {
          txtSuspectStatus.text = "Escaneando suspeitas... " + session.processed + " itens lidos.";
        }

        var word = words[session.itemIndex++];
        budget--;
        if (!word || !word.isValid) {
          if (budget <= 0) return false;
          continue;
        }
        if (!isWithinPageRange(word, opts.pageRange)) {
          if (budget <= 0) return false;
          continue;
        }

        session.processed++;
        var rawWord = trimWord(word.contents);
        if (!rawWord || countLetters(rawWord) < opts.minChars || hasDigit(rawWord)) {
          if (budget <= 0) return false;
          continue;
        }
        if (opts.ignoreMarked && isMarkedAsProperName(word)) {
          if (budget <= 0) return false;
          continue;
        }
        if (opts.ignoreAllCaps && isAllCaps(rawWord)) {
          if (budget <= 0) return false;
          continue;
        }
        if (opts.ignoreCapitalized && isCapitalizedWord(rawWord)) {
          if (budget <= 0) return false;
          continue;
        }

        var reasonParts = [];
        var langName = getAppliedLanguageName(word);
        var langKey = normalizeLanguageName(langName);
        var nonLatinLabel = detectNonLatinScript(rawWord);

        if (opts.flagNonLatin && nonLatinLabel) {
          reasonParts.push(nonLatinLabel);
        }

        if (langKey && targetKey && langKey !== targetKey && langKey.indexOf("no language") === -1) {
          reasonParts.push("idioma: " + langName);
        } else if (opts.onlyNonTarget) {
          if (budget <= 0) return false;
          continue;
        }

        if (reasonParts.length) {
          session.entries.push({
            ref: word.getElements()[0],
            word: rawWord,
            page: getPageName(word),
            language: langName || "-",
            reason: reasonParts.join(" | "),
            preview: getPreview(word)
          });
        }

        if (budget <= 0) return false;
      }

      session.storyIndex++;
      session.itemIndex = 0;
    }

    return true;
  }

  function processLanguagesChunk(session, budget) {
    var opts = session.opts;
    var targetKey = normalizeLanguageName(opts.targetLanguageName);
    var stories = session.stories;

    while (session.storyIndex < stories.length) {
      var story = stories[session.storyIndex];
      var collection = opts.paragraphMode
        ? story.paragraphs
        : (opts.wordLevelMismatch ? story.words : story.textStyleRanges);

      while (session.itemIndex < collection.length) {
        if (state.stopRequested) {
          session.stopped = true;
          return true;
        }

        session.tick++;
        if ((session.tick % 10) === 0) {
          txtLangStatus.text = "Auditando idiomas... " + session.processed + " itens lidos.";
        }

        var item = collection[session.itemIndex++];
        budget--;
        if (!item || !item.isValid) {
          if (budget <= 0) return false;
          continue;
        }
        if (!isWithinPageRange(item, opts.pageRange)) {
          if (budget <= 0) return false;
          continue;
        }

        session.processed++;
        var languageName = getAppliedLanguageName(item);
        if (!languageName) {
          if (budget <= 0) return false;
          continue;
        }

        var languageKey = normalizeLanguageName(languageName);
        var reason = "";

        if (opts.wordLevelMismatch && !opts.paragraphMode && looksLatinWord(item.contents) && languageLooksNonLatin(languageKey)) {
          reason = "palavra latina com idioma " + languageName;
        }
        if (opts.onlyUnexpected && targetKey && languageKey === targetKey) {
          if (budget <= 0) return false;
          continue;
        }
        if (opts.onlyUnexpected && !reason && targetKey && languageKey !== targetKey) {
          reason = "idioma: " + languageName;
        }
        if (!reason && opts.onlyUnexpected && opts.wordLevelMismatch && !opts.paragraphMode) {
          if (budget <= 0) return false;
          continue;
        }

        session.entries.push({
          ref: item.getElements()[0],
          page: getPageName(item),
          language: languageName,
          reason: reason || "idioma: " + languageName,
          preview: getPreview(item)
        });

        if (budget <= 0) return false;
      }

      session.storyIndex++;
      session.itemIndex = 0;
    }

    return true;
  }

  function finalizeScan() {
    var session = state.scanSession;
    if (!session) return;

    if (session.kind === "suspects") {
      state.suspectEntries = session.entries;
      rebuildSuspectList();
      if (state.suspectEntries.length) {
        selectSuspect(0, true);
      } else {
        txtSuspectStatus.text = session.stopped ? "Varredura interrompida sem itens." : "Nenhuma suspeita encontrada.";
      }
      if (session.stopped && state.suspectEntries.length) {
        txtSuspectStatus.text = "Varredura interrompida. " + state.suspectEntries.length + " suspeitas listadas.";
      } else if (state.suspectEntries.length) {
        txtSuspectStatus.text = state.suspectEntries.length + " suspeitas listadas.";
      }
    } else {
      state.languageEntries = session.entries;
      rebuildLanguageList();
      if (state.languageEntries.length) {
        selectLanguageEntry(0, true);
      } else {
        txtLangStatus.text = session.stopped ? "Auditoria interrompida sem itens." : "Nenhuma divergencia de idioma encontrada.";
      }
      if (session.stopped && state.languageEntries.length) {
        txtLangStatus.text = "Auditoria interrompida. " + state.languageEntries.length + " itens listados.";
      } else if (state.languageEntries.length) {
        txtLangStatus.text = state.languageEntries.length + " trechos listados.";
      }
    }

    cleanupAfterScan();
  }

  function finishScanWithError(prefix, err) {
    if (state.mode === "suspects") {
      txtSuspectStatus.text = "Falha ao escanear suspeitas.";
    } else if (state.mode === "languages") {
      txtLangStatus.text = "Falha ao auditar idiomas.";
    }
    cleanupAfterScan();
    alert(prefix + "\n\n" + err);
  }

  function cleanupAfterScan() {
    cleanupIdleTask();
    state.scanSession = null;
    state.mode = "";
    state.stopRequested = false;
    setButtonsForRun(false);
  }

  function cleanupIdleTask() {
    if (!state.idleTask) return;
    try {
      state.idleTask.removeEventListener(getIdleEventName(), onIdleScan, false);
    } catch (e) {
      // ignore
    }
    try {
      state.idleTask.sleep = 0;
    } catch (e2) {
      // ignore
    }
    try {
      if (state.idleTask.isValid) {
        state.idleTask.remove();
      }
    } catch (e3) {
      // ignore
    }
    state.idleTask = null;
  }

  function getIdleEventName() {
    try {
      if (typeof IdleEvent !== "undefined" && IdleEvent.ON_IDLE) {
        return IdleEvent.ON_IDLE;
      }
    } catch (e) {
      // ignore
    }

    try {
      if (typeof IdleTask !== "undefined" && IdleTask.ON_IDLE) {
        return IdleTask.ON_IDLE;
      }
    } catch (e2) {
      // ignore
    }

    return "onIdle";
  }

  function rebuildSuspectList() {
    listSuspects.removeAll();
    state.suspectIndex = -1;

    for (var i = 0; i < state.suspectEntries.length; i++) {
      var entry = state.suspectEntries[i];
      listSuspects.add("item", pad(i + 1) + ". " + entry.word + " [" + entry.page + "] " + entry.reason);
    }
  }

  function rebuildLanguageList() {
    listLanguages.removeAll();
    state.languageIndex = -1;

    for (var i = 0; i < state.languageEntries.length; i++) {
      var entry = state.languageEntries[i];
      listLanguages.add("item", pad(i + 1) + ". [" + entry.page + "] " + entry.language + " | " + entry.reason);
    }
  }

  function selectSuspect(index, shouldFocus) {
    if (index < 0 || index >= state.suspectEntries.length) {
      clearSuspectDetail();
      return;
    }

    state.suspectIndex = index;
    listSuspects.selection = index;

    var entry = state.suspectEntries[index];
    txtSuspectMeta.text = "Pagina: " + entry.page + " | Idioma: " + entry.language + " | Motivo: " + entry.reason;
    txtSuspectPreview.text = "Contexto: " + entry.preview;

    if (shouldFocus) {
      focusEntry(entry);
    }
  }

  function selectLanguageEntry(index, shouldFocus) {
    if (index < 0 || index >= state.languageEntries.length) {
      clearLanguageDetail();
      return;
    }

    state.languageIndex = index;
    listLanguages.selection = index;

    var entry = state.languageEntries[index];
    txtLangMeta.text = "Pagina: " + entry.page + " | Idioma aplicado: " + entry.language + " | Motivo: " + entry.reason;
    txtLangPreview.text = "Contexto: " + entry.preview;

    if (shouldFocus) {
      focusEntry(entry);
    }
  }

  function getCurrentSuspect() {
    if (state.suspectIndex < 0 || state.suspectIndex >= state.suspectEntries.length) return null;
    return state.suspectEntries[state.suspectIndex];
  }

  function getCurrentLanguageEntry() {
    if (state.languageIndex < 0 || state.languageIndex >= state.languageEntries.length) return null;
    return state.languageEntries[state.languageIndex];
  }

  function focusEntry(entry) {
    if (!entry || !entry.ref || !entry.ref.isValid) return;

    try {
      var page = getParentPage(entry.ref);
      if (page) {
        activatePage(page);
      }
      app.select(entry.ref, SelectionOptions.REPLACE_WITH);
      pumpEvents();
    } catch (e) {
      try {
        app.select(entry.ref);
      } catch (e2) {
        alert("Nao foi possivel localizar este item.");
      }
    }
  }

  function markSelectionAsProperName() {
    if (!app.selection.length) {
      alert("Selecione o nome ou trecho que deve ser ignorado.");
      return;
    }

    try {
      var doc = app.activeDocument;
      var condition = getOrCreateIgnoreCondition(doc);
      var target = app.selection[0];
      target.applyConditions([condition], false);
      alert("Marcado para ser ignorado nas suspeitas.");
    } catch (e) {
      alert("Nao foi possivel marcar a selecao.\n\n" + e);
    }
  }

  function clearSelectionProperNameMark() {
    if (!app.selection.length) {
      alert("Selecione o trecho marcado que voce quer limpar.");
      return;
    }

    try {
      var condition = app.activeDocument.conditions.itemByName(IGNORE_CONDITION_NAME);
      if (!condition.isValid) {
        alert("Nao ha marca de nome proprio criada neste documento.");
        return;
      }

      app.selection[0].removeConditions([condition]);
      alert("Marca removida da selecao.");
    } catch (e) {
      alert("Nao foi possivel limpar a marca.\n\n" + e);
    }
  }

  function applyTargetLanguageToCurrent() {
    var entry = getCurrentLanguageEntry();
    if (!entry) return;

    var language = resolveTargetLanguage(ddAuditLanguage);
    if (!language) {
      alert("Nao foi possivel localizar o idioma alvo.");
      return;
    }

    try {
      var outcome = applyLanguageSafely(entry.ref, language, cbSafeApply.value);
      if (!outcome.ok) {
        alert(outcome.message);
        return;
      }
      removeCurrentLanguageEntryFromList();
    } catch (e) {
      alert("Nao foi possivel aplicar o idioma ao item atual.\n\n" + e);
    }
  }

  function applyTargetLanguageToAll() {
    if (!state.languageEntries.length) return;

    var language = resolveTargetLanguage(ddAuditLanguage);
    if (!language) {
      alert("Nao foi possivel localizar o idioma alvo.");
      return;
    }

    try {
      var reverted = 0;
      app.doScript(function () {
        for (var i = 0; i < state.languageEntries.length; i++) {
          var entry = state.languageEntries[i];
          if (entry.ref && entry.ref.isValid) {
            var result = applyLanguageSafely(entry.ref, language, cbSafeApply.value);
            if (!result.ok) {
              reverted++;
            }
          }
        }
      }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Aplicar idioma em todos");

      scanLanguages();
      if (reverted) {
        alert(reverted + " item(ns) foram revertidos porque alteraram a composicao.");
      }
    } catch (e) {
      alert("Nao foi possivel aplicar o idioma em todos os itens.\n\n" + e);
    }
  }

  function removeCurrentLanguageEntryFromList() {
    if (state.languageIndex < 0 || state.languageIndex >= state.languageEntries.length) {
      return;
    }

    state.languageEntries.splice(state.languageIndex, 1);
    rebuildLanguageList();

    if (!state.languageEntries.length) {
      clearLanguageDetail();
      txtLangStatus.text = "Nenhuma divergencia restante na lista atual.";
      return;
    }

    var nextIndex = state.languageIndex;
    if (nextIndex >= state.languageEntries.length) {
      nextIndex = state.languageEntries.length - 1;
    }
    selectLanguageEntry(nextIndex, true);
    txtLangStatus.text = state.languageEntries.length + " trechos restantes na lista atual.";
  }

  function applyLanguageSafely(textObj, language, safeMode) {
    if (!textObj || !textObj.isValid) {
      return { ok: false, message: "A referencia do item nao esta mais valida." };
    }

    if (!safeMode) {
      textObj.appliedLanguage = language;
      return { ok: true };
    }

    var snapshot = captureCompositionSnapshot(textObj);
    textObj.appliedLanguage = language;
    var changed = compositionChanged(textObj, snapshot);

    if (changed) {
      textObj.appliedLanguage = snapshot.language;
      reapplyHyphenationState(textObj, snapshot.hyphenation);
      return { ok: false, message: "A troca de idioma alterou a composicao do paragrafo. O item foi revertido." };
    }

    return { ok: true };
  }

  function getOrCreateIgnoreCondition(doc) {
    var condition = doc.conditions.itemByName(IGNORE_CONDITION_NAME);
    if (condition.isValid) return condition;

    condition = doc.conditions.add({
      name: IGNORE_CONDITION_NAME,
      indicatorMethod: ConditionIndicatorMethod.USE_HIGHLIGHT,
      indicatorColor: UIColors.YELLOW
    });

    return condition;
  }

  function isMarkedAsProperName(textObj) {
    try {
      var conditions = textObj.appliedConditions;
      for (var i = 0; i < conditions.length; i++) {
        if (conditions[i].name === IGNORE_CONDITION_NAME) {
          return true;
        }
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  function populateLanguageDropdowns() {
    var names = getLanguageNames();
    var defaultIndex = 0;

    for (var i = 0; i < names.length; i++) {
      ddSuspectLanguage.add("item", names[i]);
      ddAuditLanguage.add("item", names[i]);

      if (normalizeLanguageName(names[i]).indexOf(DEFAULT_LANGUAGE_HINT) !== -1) {
        defaultIndex = i;
      }
    }

    ddSuspectLanguage.selection = defaultIndex;
    ddAuditLanguage.selection = defaultIndex;
  }

  function getLanguageNames() {
    var names = [];
    var seen = {};
    var collection = null;

    try {
      collection = app.languagesWithVendors;
    } catch (e) {
      collection = app.languages;
    }

    for (var i = 0; i < collection.length; i++) {
      var name = collection[i].name;
      if (!seen[name]) {
        seen[name] = true;
        names.push(name);
      }
    }

    names.sort();
    return names;
  }

  function resolveTargetLanguage(dropdown) {
    var name = getSelectedLanguageName(dropdown);
    var normalized = normalizeLanguageName(name);
    var language = findLanguageByName(safeLanguageCollection("languagesWithVendors"), name, normalized);
    if (language) return language;
    language = findLanguageByName(safeLanguageCollection("languages"), name, normalized);
    if (language) return language;
    return null;
  }

  function safeLanguageCollection(propertyName) {
    try {
      return app[propertyName];
    } catch (e) {
      return null;
    }
  }

  function findLanguageByName(collection, exactName, normalizedName) {
    if (!collection) return null;

    try {
      var direct = collection.itemByName(exactName);
      if (direct && direct.isValid) return direct;
    } catch (e) {
      // ignore
    }

    try {
      for (var i = 0; i < collection.length; i++) {
        var item = collection[i];
        if (!item || !item.isValid) continue;
        if (item.name === exactName) return item;
        if (normalizeLanguageName(item.name) === normalizedName) return item;
      }
    } catch (e2) {
      // ignore
    }

    return null;
  }

  function getSelectedLanguageName(dropdown) {
    if (!dropdown.selection) return "";
    return dropdown.selection.text;
  }

  function getAppliedLanguageName(textObj) {
    try {
      if (textObj.appliedLanguage && textObj.appliedLanguage.name) {
        return textObj.appliedLanguage.name;
      }
    } catch (e) {
      // ignore
    }
    return "";
  }

  function captureCompositionSnapshot(textObj) {
    var paragraph = getOwningParagraph(textObj);
    return {
      language: textObj.appliedLanguage,
      hyphenation: getHyphenationState(textObj),
      lineCount: getParagraphLineCount(paragraph),
      overset: getOversetState(textObj),
      baseline: getFirstBaseline(textObj),
      x: getFirstHorizontalOffset(textObj),
      lineText: getOwningLineText(textObj)
    };
  }

  function compositionChanged(textObj, snapshot) {
    if (getParagraphLineCount(getOwningParagraph(textObj)) !== snapshot.lineCount) return true;
    if (getOversetState(textObj) !== snapshot.overset) return true;
    if (Math.abs(getFirstBaseline(textObj) - snapshot.baseline) > 0.01) return true;
    if (Math.abs(getFirstHorizontalOffset(textObj) - snapshot.x) > 0.01) return true;
    if (getOwningLineText(textObj) !== snapshot.lineText) return true;
    return false;
  }

  function getOwningParagraph(textObj) {
    try {
      return textObj.paragraphs[0];
    } catch (e) {
      return null;
    }
  }

  function getParagraphLineCount(paragraph) {
    try {
      return paragraph && paragraph.lines ? paragraph.lines.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function getOversetState(textObj) {
    try {
      return textObj.parentStory && textObj.parentStory.overflows ? 1 : 0;
    } catch (e) {
      return 0;
    }
  }

  function getFirstBaseline(textObj) {
    try {
      return Number(textObj.baseline);
    } catch (e) {
      return 0;
    }
  }

  function getFirstHorizontalOffset(textObj) {
    try {
      return Number(textObj.horizontalOffset);
    } catch (e) {
      return 0;
    }
  }

  function getOwningLineText(textObj) {
    try {
      return normalizeSpaces(trimText(textObj.lines[0].contents));
    } catch (e) {
      return "";
    }
  }

  function getHyphenationState(textObj) {
    try {
      return !!textObj.hyphenation;
    } catch (e) {
      return null;
    }
  }

  function reapplyHyphenationState(textObj, value) {
    if (value === null) return;
    try {
      textObj.hyphenation = value;
    } catch (e) {
      // ignore
    }
  }

  function getPageName(textObj) {
    try {
      var page = getParentPage(textObj);
      if (page) {
        return page.name;
      }
    } catch (e) {
      // ignore
    }
    return "-";
  }

  function getPreview(textObj) {
    try {
      var snippet = textObj.paragraphs[0].contents;
      return normalizeSpaces(trimText(snippet)).substr(0, 180);
    } catch (e) {
      try {
        return normalizeSpaces(trimText(textObj.contents)).substr(0, 180);
      } catch (e2) {
        return "-";
      }
    }
  }

  function getParentPage(textObj) {
    try {
      if (textObj.parentTextFrames.length && textObj.parentTextFrames[0].parentPage) {
        return textObj.parentTextFrames[0].parentPage;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  function activatePage(page) {
    try {
      app.activeWindow.activePage = page;
    } catch (e) {
      // ignore
    }

    try {
      app.activeWindow.activeSpread = page.parent;
    } catch (e2) {
      // ignore
    }

    try {
      if (app.layoutWindows.length) {
        app.layoutWindows[0].activePage = page;
      }
    } catch (e3) {
      // ignore
    }
  }

  function detectNonLatinScript(word) {
    if (/[\u0400-\u04FF]/.test(word)) return "cirilico";
    if (/[\u0600-\u06FF]/.test(word)) return "arabe";
    if (/[\u0590-\u05FF]/.test(word)) return "hebraico";
    if (/[\u0370-\u03FF]/.test(word)) return "grego";
    return "";
  }

  function looksLatinWord(word) {
    var trimmed = trimWord(word || "");
    if (!trimmed) return false;
    return /^[A-Za-z\u00C0-\u017F\-']+$/.test(trimmed);
  }

  function languageLooksNonLatin(languageKey) {
    return /arab|hebr|rus|ukrain|greek|cyril|japan|chinese|korean|thai/.test(languageKey || "");
  }

  function countLetters(word) {
    var letters = word.match(/[A-Za-z\u00C0-\u017F\u0400-\u04FF\u0600-\u06FF\u0590-\u05FF\u0370-\u03FF]/g);
    return letters ? letters.length : 0;
  }

  function hasDigit(word) {
    return /\d/.test(word);
  }

  function isAllCaps(word) {
    return /^[A-Z\u00C0-\u00DE]+$/.test(word);
  }

  function isCapitalizedWord(word) {
    return /^[A-Z\u00C0-\u00DE][a-z\u00DF-\u00FF]/.test(word);
  }

  function trimWord(word) {
    return String(word).replace(/^[^A-Za-z\u00C0-\u017F\u0400-\u04FF\u0600-\u06FF\u0590-\u05FF\u0370-\u03FF]+/, "")
      .replace(/[^A-Za-z\u00C0-\u017F\u0400-\u04FF\u0600-\u06FF\u0590-\u05FF\u0370-\u03FF]+$/, "");
  }

  function trimText(text) {
    return String(text).replace(/^\s+|\s+$/g, "");
  }

  function normalizeSpaces(text) {
    return String(text).replace(/\s+/g, " ");
  }

  function normalizeLanguageName(name) {
    return String(name || "").toLowerCase();
  }

  function parsePageRange(fromText, toText) {
    var range = {
      from: parseRangeBound(fromText),
      to: parseRangeBound(toText)
    };

    if (range.from === null && range.to === null) return null;
    if (range.from !== null && range.to !== null && range.from > range.to) {
      var swap = range.from;
      range.from = range.to;
      range.to = swap;
    }

    return range;
  }

  function parseRangeBound(value) {
    var text = trimText(value || "");
    if (!text) return null;
    var n = parseInt(text, 10);
    if (isNaN(n) || n < 1) return null;
    return n;
  }

  function isWithinPageRange(textObj, range) {
    if (!range) return true;

    var page = getParentPage(textObj);
    if (!page) return false;

    var pageNumber = getDocumentPageNumber(page);
    if (pageNumber === null) return false;
    if (range.from !== null && pageNumber < range.from) return false;
    if (range.to !== null && pageNumber > range.to) return false;
    return true;
  }

  function getDocumentPageNumber(page) {
    try {
      return page.documentOffset + 1;
    } catch (e) {
      return null;
    }
  }

  function setButtonsForRun(isRunning) {
    btnSuspectScan.enabled = !isRunning;
    btnLangScan.enabled = !isRunning;
    btnSuspectStop.enabled = isRunning && state.mode === "suspects";
    btnLangStop.enabled = isRunning && state.mode === "languages";
    btnSuspectPrev.enabled = !isRunning;
    btnSuspectNext.enabled = !isRunning;
    btnSuspectFocus.enabled = !isRunning;
    btnMarkIgnore.enabled = !isRunning;
    btnLangPrev.enabled = !isRunning;
    btnLangNext.enabled = !isRunning;
    btnLangFocus.enabled = !isRunning;
    btnApplyTarget.enabled = !isRunning;
    btnApplyAll.enabled = !isRunning;
    btnClearMark.enabled = !isRunning;
    listSuspects.enabled = !isRunning;
    listLanguages.enabled = !isRunning;
  }

  function clearSuspectDetail() {
    state.suspectIndex = -1;
    txtSuspectMeta.text = "Pagina: - | Idioma: - | Motivo: -";
    txtSuspectPreview.text = "Contexto: -";
  }

  function clearLanguageDetail() {
    state.languageIndex = -1;
    txtLangMeta.text = "Pagina: - | Idioma aplicado: -";
    txtLangPreview.text = "Contexto: -";
  }

  function refreshUi() {
    setButtonsForRun(false);
    clearSuspectDetail();
    clearLanguageDetail();
  }

  function pumpEvents() {
    try {
      w.update();
    } catch (e) {
      // ignore
    }

    try {
      app.processEvents();
    } catch (e2) {
      // ignore
    }

    try {
      $.sleep(5);
    } catch (e3) {
      // ignore
    }
  }

  function pad(n) {
    var s = String(n);
    while (s.length < 3) s = "0" + s;
    return s;
  }
}());

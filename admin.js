(function () {
  var backend = window.GIZ_BACKEND_CONFIG || {};
  var AUTH_STORAGE_KEY = "giz_admin_access_token";

  var authScreen = document.getElementById("auth-screen");
  var adminApp = document.getElementById("admin-app");
  var authForm = document.getElementById("auth-form");
  var authFeedback = document.getElementById("auth-feedback");
  var authSubmitButton = document.getElementById("auth-submit-button");
  var authRecoveryButton = document.getElementById("auth-recovery-button");
  var authMagicLinkButton = document.getElementById("auth-magic-link-button");
  var sessionEmail = document.getElementById("session-email");
  var logoutButton = document.getElementById("logout-button");
  var workspaceTabs = Array.prototype.slice.call(document.querySelectorAll("[data-workspace-tab]"));
  var workspaceSections = Array.prototype.slice.call(document.querySelectorAll("[data-workspace-section]"));
  var projectSearch = document.getElementById("project-search");
  var statusFilter = document.getElementById("status-filter");
  var clearFiltersButton = document.getElementById("clear-filters-button");
  var projectCount = document.getElementById("project-count");
  var projectAlphaBar = document.getElementById("project-alpha-bar");
  var projectList = document.getElementById("project-list");
  var batchSelectionCount = document.getElementById("batch-selection-count");
  var batchSelectionPreview = document.getElementById("batch-selection-preview");
  var batchFeedback = document.getElementById("batch-feedback");
  var batchSelectVisibleButton = document.getElementById("batch-select-visible-button");
  var batchClearSelectionButton = document.getElementById("batch-clear-selection-button");
  var batchTagSearch = document.getElementById("batch-tag-search");
  var batchTagResults = document.getElementById("batch-tag-results");
  var batchPublisherResults = document.getElementById("batch-publisher-results");
  var batchPublisherCustom = document.getElementById("batch-publisher-custom");
  var batchApplyPublisherButton = document.getElementById("batch-apply-publisher-button");
  var batchClearPublisherButton = document.getElementById("batch-clear-publisher-button");
  var editorForm = document.getElementById("editor-form");
  var saveProjectButton = document.getElementById("save-project-button");
  var deleteProjectButton = document.getElementById("delete-project-button");
  var editorTabs = Array.prototype.slice.call(document.querySelectorAll("[data-editor-tab]"));
  var editorSections = Array.prototype.slice.call(document.querySelectorAll("[data-editor-section]"));
  var editorTitle = document.getElementById("editor-title");
  var saveState = document.getElementById("save-state");
  var fieldTitle = document.getElementById("field-title");
  var fieldSubtitle = document.getElementById("field-subtitle");
  var fieldClientSelect = document.getElementById("field-client-select");
  var fieldClientCustom = document.getElementById("field-client-custom");
  var fieldTypeSelect = document.getElementById("field-type-select");
  var fieldTypeCustom = document.getElementById("field-type-custom");
  var fieldStatus = document.getElementById("field-status");
  var fieldSortYear = document.getElementById("field-sort-year");

  var fieldFeatured = document.getElementById("field-featured");
  var servicoChips = document.getElementById("servico-chips");
  var servicoEditButton = document.getElementById("servico-edit-button");
  var servicoAddForm = document.getElementById("servico-add-form");
  var servicoNewInput = document.getElementById("servico-new-input");
  var servicoAddConfirm = document.getElementById("servico-add-confirm");
  var servicoAddCancel = document.getElementById("servico-add-cancel");
  var servicoFeedback = document.getElementById("servico-feedback");
  var fieldDossieSelect = document.getElementById("field-dossie-select");
  var servicoEditMode = false;
  var publicationPill = document.getElementById("publication-pill");
  var publicationState = document.getElementById("publication-state");
  var publicationDate = document.getElementById("publication-date");
  var checklistSummary = document.getElementById("checklist-summary");
  var checklistList = document.getElementById("checklist-list");
  var flagSummary = document.getElementById("flag-summary");
  var flagReviewText = document.getElementById("flag-review-text");
  var flagFutureFeature = document.getElementById("flag-future-feature");
  var tagSearch = document.getElementById("tag-search");
  var tagResults = document.getElementById("tag-results");
  var newTagLabel = document.getElementById("new-tag-label");
  var newTagButton = document.getElementById("new-tag-button");
  var newTagFeedback = document.getElementById("new-tag-feedback");
  var tagManager = document.getElementById("tag-manager");
  var tagManagerSelect = document.getElementById("tag-manager-select");
  var tagManagerLabel = document.getElementById("tag-manager-label");
  var tagManagerSaveButton = document.getElementById("tag-manager-save-button");
  var tagManagerDeleteButton = document.getElementById("tag-manager-delete-button");
  var tagManagerFeedback = document.getElementById("tag-manager-feedback");
  var pairSearch = document.getElementById("pair-search");
  var pairSelectionPreview = document.getElementById("pair-selection-preview");
  var pairConnectButton = document.getElementById("pair-connect-button");
  var pairResults = document.getElementById("pair-results");
  var pairList = document.getElementById("pair-list");
  var mediaUploadForm = document.getElementById("media-upload-form");
  var mediaFiles = document.getElementById("media-files");
  var mediaUploadButton = document.getElementById("media-upload-button");
  var mediaList = document.getElementById("media-list");
  var newProjectForm = document.getElementById("new-project-form");
  var intakeFiles = document.getElementById("intake-files");
  var intakeOverwrite = document.getElementById("intake-overwrite");
  var bulkImportFeedback = document.getElementById("bulk-import-feedback");
  var intakeReport = document.getElementById("intake-report");
  var siteConfigForm = document.getElementById("site-config-form");
  var siteNavigationFields = document.getElementById("site-navigation-fields");
  var sitePageTabs = document.getElementById("site-page-tabs");
  var sitePageMeta = document.getElementById("site-page-meta");
  var sitePageContent = document.getElementById("site-page-content");
  var siteFilterFields = document.getElementById("site-filter-fields");
  var siteConfigSaveButton = document.getElementById("site-config-save-button");
  var filterAddButton = document.getElementById("filter-add-button");
  var filterAddForm = document.getElementById("filter-add-form");
  var filterNewLabel = document.getElementById("filter-new-label");
  var filterAddConfirm = document.getElementById("filter-add-confirm");
  var filterAddCancel = document.getElementById("filter-add-cancel");

  var QuillFont = Quill.import("attributors/class/font");
  QuillFont.whitelist = ["laca", "laca-light", "laca-variable"];
  Quill.register(QuillFont, true);

  var QUILL_TOOLBAR = [
    [{ "font": ["laca", "laca-light", "laca-variable", false] }],
    ["bold", "italic", "underline", "strike"],
    [{ "header": [1, 2, 3, false] }],
    [{ "size": ["small", false, "large", "huge"] }],
    [{ "list": "ordered" }, { "list": "bullet" }],
    [{ "align": [] }],
    ["link", "image"],
    ["clean"]
  ];

  var quillPage = new Quill("#site-page-quill", { modules: { toolbar: QUILL_TOOLBAR }, theme: "snow" });
  var quillDesc = new Quill("#field-description-quill", { modules: { toolbar: QUILL_TOOLBAR }, theme: "snow" });
  var siteConfigFeedback = document.getElementById("site-config-feedback");
  var dossieEntryBuilder = document.getElementById("dossie-entry-builder");

  var state = {
    token: null,
    sessionEmail: "",
    projects: [],
    tags: [],
    projectTagsByProject: {},
    editorialFlagsByProject: {},
    imagesByProject: {},
    pairs: [],
    siteConfig: createDefaultSiteConfig(),
    filteredProjects: [],
    alphaFilter: "",
    selectedProjectIds: [],
    selectedProjectId: null,
    selectedTagId: null,
    pendingPairIds: [],
    workspace: "projects",
    editorSection: "details",
    activeSitePageId: "inicio"
  };

  if (!backend.url || !backend.anonKey) {
    setAuthFeedback("Backend config ausente no admin.", true);
    return;
  }

  authForm.addEventListener("submit", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    submitPasswordLogin();
  });

  authSubmitButton.addEventListener("click", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    submitPasswordLogin();
  });

  authRecoveryButton.addEventListener("click", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    submitPasswordRecovery();
  });

  authMagicLinkButton.addEventListener("click", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    submitMagicLinkRequest();
  });

  logoutButton.addEventListener("click", function () {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    state.token = null;
    state.sessionEmail = "";
    state.projects = [];
    state.editorialFlagsByProject = {};
    state.imagesByProject = {};
    state.filteredProjects = [];
    state.alphaFilter = "";
    state.selectedProjectId = null;
    state.selectedTagId = null;
    state.pendingPairIds = [];
    setAuthFeedback("Sessão encerrada.", false);
    renderAuthState();
  });

  projectSearch.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  clearFiltersButton.addEventListener("click", clearProjectFilters);
  adminApp.addEventListener("click", handleWorkspaceTabClick);
  projectAlphaBar.addEventListener("click", handleAlphaFilterClick);
  projectList.addEventListener("click", handleProjectSelection);
  projectList.addEventListener("change", handleProjectSelectionToggle);
  editorForm.addEventListener("click", handleEditorTabClick);
  editorForm.addEventListener("submit", handleProjectSave);
  saveProjectButton.addEventListener("click", handleProjectSave);
  deleteProjectButton.addEventListener("click", handleProjectDeletion);
  newProjectForm.addEventListener("submit", handleIntakeUpload);
  mediaUploadButton.addEventListener("click", handleMediaUpload);
  mediaList.addEventListener("click", handleMediaListClick);
  tagSearch.addEventListener("input", renderTagResults);
  tagResults.addEventListener("click", handleTagResultsClick);
  newTagButton.addEventListener("click", handleCreateTag);
  tagManagerSelect.addEventListener("change", handleTagManagerSelectionChange);
  tagManagerSaveButton.addEventListener("click", handleTagUpdate);
  tagManagerDeleteButton.addEventListener("click", handleTagDelete);
  newTagLabel.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    handleCreateTag(event);
  });
  batchTagSearch.addEventListener("input", renderBatchTagResults);
  batchTagResults.addEventListener("click", handleBatchTagToggle);
  batchPublisherResults.addEventListener("click", handleBatchPublisherChipClick);
  batchSelectVisibleButton.addEventListener("click", handleSelectVisibleProjects);
  batchClearSelectionButton.addEventListener("click", clearBatchSelection);
  batchApplyPublisherButton.addEventListener("click", handleBatchPublisherApply);
  batchClearPublisherButton.addEventListener("click", handleBatchPublisherClear);
  flagReviewText.addEventListener("change", handleEditorialFlagChange);
  flagFutureFeature.addEventListener("change", handleEditorialFlagChange);
  pairSearch.addEventListener("input", renderPairResults);
  pairResults.addEventListener("click", handlePairCandidateToggle);
  pairConnectButton.addEventListener("click", handleAddPairs);
  pairList.addEventListener("click", handlePairRemoval);
  fieldTitle.addEventListener("input", syncCurrentPublicationChecklist);
  fieldTypeSelect.addEventListener("change", handleProjectTypeSelectionChange);
  fieldTypeCustom.addEventListener("input", syncCurrentPublicationChecklist);
  fieldClientSelect.addEventListener("change", handlePublisherSelectionChange);
  fieldClientCustom.addEventListener("input", syncCurrentPublicationChecklist);
  fieldSortYear.addEventListener("input", handleSortYearInput);
  servicoChips.addEventListener("click", handleServicoChipClick);
  servicoAddCancel.addEventListener("click", function() {
    servicoEditMode = false;
    servicoAddForm.hidden = true;
    servicoNewInput.value = "";
    servicoEditButton.textContent = "Gerenciar lista";
    renderServicoChips();
  });
  servicoAddConfirm.addEventListener("click", handleServicoAdd);
  servicoNewInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") handleServicoAdd();
  });
  servicoEditButton.addEventListener("click", function() {
    servicoEditMode = !servicoEditMode;
    servicoAddForm.hidden = !servicoEditMode;
    servicoEditButton.textContent = servicoEditMode ? "Concluir" : "Gerenciar lista";
    if (servicoEditMode) servicoNewInput.focus();
    if (!servicoEditMode) servicoNewInput.value = "";
    renderServicoChips();
  });
  siteConfigForm.addEventListener("click", handleSiteConfigClick);
  siteConfigForm.addEventListener("input", handleSiteConfigInput);
  quillPage.on("text-change", handlePageContentInput);
  siteConfigSaveButton.addEventListener("click", handleSiteConfigSave);
  filterAddButton.addEventListener("click", function() {
    filterAddForm.hidden = false;
    filterNewLabel.focus();
  });
  filterAddCancel.addEventListener("click", function() {
    filterAddForm.hidden = true;
    filterNewLabel.value = "";
  });
  filterAddConfirm.addEventListener("click", handleFilterAdd);
  filterNewLabel.addEventListener("keydown", function(e) { if (e.key === "Enter") handleFilterAdd(); });
  siteFilterFields.addEventListener("click", handleFilterDelete);

  var dossieInsertButton = document.getElementById("dossie-insert-button");
  if (dossieInsertButton) {
    dossieInsertButton.addEventListener("click", handleDossieInsert);
  }

  var dossieTypeEl = document.getElementById("dossie-type");
  var dossieGalleryFields = document.getElementById("dossie-gallery-fields");
  var dossieMediaField = document.getElementById("dossie-media") && document.getElementById("dossie-media").closest(".admin-field");
  if (dossieTypeEl && dossieGalleryFields) {
    dossieTypeEl.addEventListener("change", function() {
      var isGallery = dossieTypeEl.value === "galeria";
      dossieGalleryFields.hidden = !isGallery;
      if (dossieMediaField) dossieMediaField.hidden = isGallery;
    });
  }

  // Dossiê workspace (aba dedicada)
  var dossieWsType = document.getElementById("dossie-type-ws");
  var dossieWsGalleryFields = document.getElementById("dossie-gallery-fields-ws");
  var dossieWsMediaField = document.getElementById("dossie-media-field-ws");
  var dossieWsInsert = document.getElementById("dossie-insert-button-ws");
  var dossieWsContent = document.getElementById("dossie-ws-content");
  var dossieWsSave = document.getElementById("dossie-ws-save-button");
  var dossieWsFeedback = document.getElementById("dossie-ws-feedback");

  if (dossieWsType && dossieWsGalleryFields) {
    dossieWsType.addEventListener("change", function() {
      var isGallery = dossieWsType.value === "galeria";
      dossieWsGalleryFields.hidden = !isGallery;
      if (dossieWsMediaField) dossieWsMediaField.hidden = isGallery;
    });
  }

  if (dossieWsInsert) {
    dossieWsInsert.addEventListener("click", function() {
      var type = dossieWsType ? String(dossieWsType.value || "nota") : "nota";
      var title = String((document.getElementById("dossie-title-ws") || {}).value || "").trim();
      var body = String((document.getElementById("dossie-body-ws") || {}).value || "").trim();
      var media = String((document.getElementById("dossie-media-ws") || {}).value || "").trim();
      var galleryRaw = String((document.getElementById("dossie-gallery-urls-ws") || {}).value || "");
      var galleryUrls = galleryRaw.split("\n").map(function(u) { return u.trim(); }).filter(Boolean);

      if (type === "galeria") {
        if (!galleryUrls.length) { alert("Adicione ao menos uma URL de imagem."); return; }
      } else if (!title && !body) {
        alert("Preencha ao menos um título ou texto."); return;
      }

      var html = buildDossieEntryHtml(type, title, body, media, galleryUrls);
      if (dossieWsContent) {
        var current = String(dossieWsContent.value || "");
        dossieWsContent.value = current + (current ? "\n\n" : "") + html;
      }
      if (document.getElementById("dossie-title-ws")) document.getElementById("dossie-title-ws").value = "";
      if (document.getElementById("dossie-body-ws")) document.getElementById("dossie-body-ws").value = "";
      if (document.getElementById("dossie-media-ws")) document.getElementById("dossie-media-ws").value = "";
      if (document.getElementById("dossie-gallery-urls-ws")) document.getElementById("dossie-gallery-urls-ws").value = "";
    });
  }

  if (dossieWsSave) {
    dossieWsSave.addEventListener("click", function() {
      if (!state.token) { if (dossieWsFeedback) dossieWsFeedback.textContent = "Não autenticado."; return; }
      var content = dossieWsContent ? String(dossieWsContent.value || "") : "";
      if (!state.siteConfig.page_content) state.siteConfig.page_content = {};
      state.siteConfig.page_content["dossie"] = content;
      if (dossieWsFeedback) dossieWsFeedback.textContent = "Salvando…";
      dossieWsSave.disabled = true;
      fetch(backend.url + "/rest/v1/site_config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
          apikey: backend.anonKey,
          Authorization: "Bearer " + state.token
        },
        body: JSON.stringify([serializeSiteConfigForSave()])
      })
        .then(function(r) {
          if (!r.ok) return r.json().then(function(p) { throw new Error(p.message || "erro"); });
          return r.json();
        })
        .then(function(items) {
          if (items && items[0]) state.siteConfig = normalizeSiteConfig(items[0]);
          if (dossieWsFeedback) dossieWsFeedback.textContent = "Dossiê salvo.";
        })
        .catch(function(err) {
          if (dossieWsFeedback) dossieWsFeedback.textContent = "Erro: " + err.message;
        })
        .finally(function() { dossieWsSave.disabled = false; });
    });
  }

  boot();

  function boot() {
    tryConsumeHash();

    state.token = sessionStorage.getItem(AUTH_STORAGE_KEY);
    renderAuthState();

    if (state.token) {
      loadProjects();
    } else {
      setAuthFeedback("Entre com um e-mail autorizado para acessar o painel.", false);
      pairSearch.disabled = true;
      state.imagesByProject = {};
      state.projectTagsByProject = {};
      state.editorialFlagsByProject = {};
      state.selectedProjectIds = [];
      setHidden(mediaUploadForm, true);
      pairResults.innerHTML = "";
      pairList.innerHTML = "";
      mediaList.innerHTML = "";
      tagResults.innerHTML = "";
      pairSelectionPreview.innerHTML = "";
      flagSummary.innerHTML = "";
      state.siteConfig = createDefaultSiteConfig();
      state.activeSitePageId = "inicio";
      renderWorkspaceTabs();
      renderTagManager();
      renderSiteConfigEditor();
      renderBatchControls();
    }
  }

  function tryConsumeHash() {
    if (!window.location.hash || window.location.hash.charAt(0) !== "#") return;

    var hash = new URLSearchParams(window.location.hash.slice(1));
    var accessToken = hash.get("access_token");
    var email = decodeURIComponent(hash.get("email") || "");
    var authError = hash.get("error_description") || hash.get("error_code");

    if (authError) {
      setAuthFeedback("Falha no link de acesso: " + decodeURIComponent(authError), true);
      clearHash();
      return;
    }

    if (!accessToken) return;

    sessionStorage.setItem(AUTH_STORAGE_KEY, accessToken);
    state.token = accessToken;
    state.sessionEmail = email || "admin autenticado";
    clearHash();
  }

  function clearHash() {
    var cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  function setHidden(node, value) {
    if (!node) return;
    node.hidden = value;
  }

  function renderAuthState() {
    var isLoggedIn = Boolean(state.token);
    setHidden(authScreen, isLoggedIn);
    setHidden(adminApp, !isLoggedIn);
    if (authScreen) authScreen.style.display = isLoggedIn ? "none" : "grid";
    if (adminApp) adminApp.style.display = isLoggedIn ? "block" : "none";
    sessionEmail.textContent = state.sessionEmail || "sessão ativa";

    if (!isLoggedIn) {
      projectCount.textContent = "0 projetos";
      projectAlphaBar.innerHTML = "";
      projectList.innerHTML = "";
      if (batchSelectionPreview) batchSelectionPreview.innerHTML = "";
      state.selectedTagId = null;
      state.pendingPairIds = [];
      state.workspace = "projects";
      setHidden(editorForm, true);
      renderWorkspaceTabs();
      renderEditorTabs();
      renderTagManager();
      renderSiteConfigEditor();
      updatePublicationPanel(null);
      setSaveState("Pronto");
    }
  }

  function handleWorkspaceTabClick(event) {
    var button = event.target.closest("[data-workspace-tab]");
    if (!button) return;

    state.workspace = button.getAttribute("data-workspace-tab") || "projects";
    renderWorkspaceTabs();
  }

  function renderWorkspaceTabs() {
    workspaceTabs.forEach(function (button) {
      var isActive = button.getAttribute("data-workspace-tab") === state.workspace;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    workspaceSections.forEach(function (section) {
      var isActive = section.getAttribute("data-workspace-section") === state.workspace;
      section.classList.toggle("is-active", isActive);
      setHidden(section, !isActive);
    });

    if (state.workspace === "dossie") {
      renderDossieWorkspace();
    }
  }

  function renderDossieWorkspace() {
    var textarea = document.getElementById("dossie-ws-content");
    if (textarea && state.siteConfig && state.siteConfig.page_content) {
      textarea.value = String(state.siteConfig.page_content["dossie"] || "");
    }
  }

  function submitPasswordLogin() {
    var email = "";
    var password = "";
    if (authForm.elements && authForm.elements.email) {
      email = String(authForm.elements.email.value || "").trim().toLowerCase();
    }
    if (authForm.elements && authForm.elements.password) {
      password = String(authForm.elements.password.value || "");
    }

    if (!email || email.indexOf("@") === -1) {
      setAuthFeedback("Digite um e-mail válido.", true);
      return;
    }

    if (!password) {
      setAuthFeedback("Digite sua senha.", true);
      return;
    }

    authSubmitButton.disabled = true;
    authRecoveryButton.disabled = true;
    authMagicLinkButton.disabled = true;
    authSubmitButton.textContent = "Entrando...";
    setAuthFeedback("Validando acesso...", false);

    fetch(backend.url + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: backend.anonKey
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
      .then(function (response) {
        return response.json().then(function (payload) {
          if (!response.ok) {
            throw new Error(payload.msg || payload.error_description || "falha no login");
          }
          return payload;
        });
      })
      .then(function (payload) {
        var accessToken = payload.access_token;
        var sessionEmailValue = payload.user && payload.user.email ? payload.user.email : email;
        sessionStorage.setItem(AUTH_STORAGE_KEY, accessToken);
        state.token = accessToken;
        state.sessionEmail = sessionEmailValue;
        setAuthFeedback("Login realizado com sucesso.", false);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authSubmitButton.textContent = "Entrar";
        renderAuthState();
        loadProjects();
      })
      .catch(function (error) {
        setAuthFeedback("Não foi possível entrar: " + error.message, true);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authSubmitButton.textContent = "Entrar";
      });
  }

  function submitMagicLinkRequest() {
    var email = "";
    if (authForm.elements && authForm.elements.email) {
      email = String(authForm.elements.email.value || "").trim().toLowerCase();
    }

    if (!email || email.indexOf("@") === -1) {
      setAuthFeedback("Digite um e-mail válido.", true);
      return;
    }

    authSubmitButton.disabled = true;
    authRecoveryButton.disabled = true;
    authMagicLinkButton.disabled = true;
    authMagicLinkButton.textContent = "Enviando...";
    setAuthFeedback("Enviando link mágico...", false);

    fetch(backend.url + "/auth/v1/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: backend.anonKey
      },
      body: JSON.stringify({
        email: email,
        create_user: false,
        email_redirect_to: window.location.origin + "/admin"
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.msg || payload.error_description || "falha no envio");
          });
        }
        state.sessionEmail = email;
        setAuthFeedback("Link enviado para " + email + ".", false);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authMagicLinkButton.textContent = "Enviar link mágico";
      })
      .catch(function (error) {
        setAuthFeedback("Não foi possível enviar o acesso: " + error.message, true);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authMagicLinkButton.textContent = "Enviar link mágico";
      });
  }

  function submitPasswordRecovery() {
    var email = "";
    if (authForm.elements && authForm.elements.email) {
      email = String(authForm.elements.email.value || "").trim().toLowerCase();
    }

    if (!email || email.indexOf("@") === -1) {
      setAuthFeedback("Digite um e-mail válido.", true);
      return;
    }

    authSubmitButton.disabled = true;
    authRecoveryButton.disabled = true;
    authMagicLinkButton.disabled = true;
    authRecoveryButton.textContent = "Enviando...";
    setAuthFeedback("Enviando link para definir ou recuperar senha...", false);

    fetch(backend.url + "/auth/v1/recover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: backend.anonKey
      },
      body: JSON.stringify({
        email: email,
        redirect_to: window.location.origin + "/auth/reset-password/"
      })
    })
      .then(function (response) {
        return response.json().then(function (payload) {
          if (!response.ok) {
            throw new Error(payload.msg || payload.error_description || "falha ao enviar recuperação");
          }
          return payload;
        });
      })
      .then(function () {
        setAuthFeedback("Email enviado para definir ou recuperar a senha.", false);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authRecoveryButton.textContent = "Definir ou recuperar senha";
      })
      .catch(function (error) {
        setAuthFeedback("Não foi possível enviar a recuperação: " + error.message, true);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authRecoveryButton.textContent = "Definir ou recuperar senha";
      });
  }

  function loadProjects() {
    fetch(backend.url + "/rest/v1/projects?select=id,slug,title,subtitle,description,client,project_type,status,published_at,sort_year,is_featured&order=title.asc", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar projetos");
          });
        }
        return response.json();
      })
      .then(function (projects) {
        state.projects = projects || [];
        state.filteredProjects = state.projects.slice();
        if (!state.selectedProjectId && state.filteredProjects.length) {
          state.selectedProjectId = state.filteredProjects[0].id;
        }
        return Promise.all([
          loadTags().catch(function () { state.tags = []; }),
          loadProjectTags().catch(function () { state.projectTagsByProject = {}; }),
          loadEditorialFlags().catch(function () { state.editorialFlagsByProject = {}; }),
          loadPairs().catch(function () {
            state.pairs = [];
          }),
          loadSiteConfig().catch(function () {
            state.siteConfig = createDefaultSiteConfig();
          }),
          loadDossies().catch(function () { state.dossies = []; })
        ]);
      })
      .then(function () {
        renderAuthState();
        renderWorkspaceTabs();
        renderSiteConfigEditor();
        applyFilters();
      })
      .catch(function (error) {
        setSaveState("Erro ao carregar projetos");
        projectList.innerHTML = '<div class="admin-card">Não foi possível carregar os projetos.</div>';
      });
  }

  function loadPairs() {
    return fetch(backend.url + "/rest/v1/project_pairs?select=id,project_id,paired_project_id,pair_type,label_override&order=created_at.asc", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar pares");
          });
        }
        return response.json();
      })
      .then(function (pairs) {
        state.pairs = pairs || [];
      });
  }

  function loadTags() {
    return fetch(backend.url + "/rest/v1/tags?select=id,slug,label,group_name,is_public&order=group_name.asc,label.asc", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar tags");
          });
        }
        return response.json();
      })
      .then(function (tags) {
        state.tags = tags || [];
      });
  }

  function loadProjectTags() {
    return fetch(backend.url + "/rest/v1/project_tags?select=project_id,tag_id", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar ligacoes de tags");
          });
        }
        return response.json();
      })
      .then(function (items) {
        state.projectTagsByProject = {};
        (items || []).forEach(function (item) {
          if (!state.projectTagsByProject[item.project_id]) {
            state.projectTagsByProject[item.project_id] = [];
          }
          state.projectTagsByProject[item.project_id].push(item.tag_id);
        });
      });
  }

  function loadEditorialFlags() {
    return fetch(backend.url + "/rest/v1/project_editorial_flags?select=id,project_id,flag_key,flag_label,is_public", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar flags editoriais");
          });
        }
        return response.json();
      })
      .then(function (items) {
        state.editorialFlagsByProject = {};
        (items || []).forEach(function (item) {
          if (!state.editorialFlagsByProject[item.project_id]) {
            state.editorialFlagsByProject[item.project_id] = [];
          }
          state.editorialFlagsByProject[item.project_id].push(item);
        });
      });
  }

  function createDefaultSiteConfig() {
    return {
      navigation: [
        { id: "inicio", label: "Início" },
        { id: "portfolio", label: "Portfólio" },
        { id: "quem", label: "Quem somos" },
        { id: "contato", label: "Contato" },
        { id: "dossie", label: "Dossiê" }
      ],
      filters: [
        {
          id: "destaques",
          label: "Destaques",
          summary: "Seleção curada",
          description: "Comece pelos projetos que sintetizam melhor a linguagem do estúdio."
        },
        {
          id: "editoras",
          label: "Editoras",
          summary: "Navegação por catálogo",
          description: "Percorra o acervo pelas casas editoriais e seus conjuntos."
        },
        {
          id: "temas",
          label: "Temas",
          summary: "Assuntos e linguagens",
          description: "Cruze temas, técnicas e atmosferas sem perder o contexto."
        },
        {
          id: "cores",
          label: "Cores",
          summary: "Percurso cromático",
          description: "Uma entrada mais lúdica e visual para descobrir relações no acervo."
        },
        {
          id: "livros",
          label: "Livros",
          summary: "Projetos editoriais",
          description: "Livros completos, encadernados e de leitura longa."
        },
        {
          id: "hqs",
          label: "HQs",
          summary: "Narrativa sequencial",
          description: "Percursos em quadrinhos, capas e universos gráficos seriados."
        },
        {
          id: "revistas",
          label: "Revistas",
          summary: "Publicações periódicas",
          description: "Edições, dossiês e desdobramentos de linguagem editorial."
        },
        {
          id: "especiais",
          label: "Projetos especiais",
          summary: "Formatos híbridos",
          description: "Peças que fogem do livro tradicional e abrem outras entradas."
        },
        {
          id: "outros",
          label: "Outros",
          summary: "Outros formatos",
          description: "Materiais que ampliam o portfólio para além das categorias centrais."
        }
      ],
      labels: {
        servico_types: ["Projeto Gráfico","Diagramação","Capa","Adaptação de capa","Tratamento de imagens","Lettering","Ilustração"]
      },
      page_content: {
        inicio: "",
        portfolio: "",
        quem: "",
        contato: ""
      }
    };
  }

  function loadSiteConfig() {
    return fetch(backend.url + "/rest/v1/site_config?select=key,navigation,filters,labels,page_content&key=eq.main&limit=1", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar conteudo do site");
          });
        }
        return response.json();
      })
      .then(function (items) {
        state.siteConfig = normalizeSiteConfig(items && items[0] ? items[0] : null);
        ensureActiveSitePage();
      });
  }

  function normalizeSiteConfig(payload) {
    var defaults = createDefaultSiteConfig();
    var navigationById = {};
    var filtersById = {};
    var normalizedPageContent = {};

    (payload && Array.isArray(payload.navigation) ? payload.navigation : []).forEach(function (item) {
      if (!item || !item.id) return;
      navigationById[item.id] = {
        id: item.id,
        label: String(item.label || "").trim() || getDefaultSiteNavigationLabel(item.id)
      };
    });

    (payload && Array.isArray(payload.filters) ? payload.filters : []).forEach(function (item) {
      if (!item || !item.id) return;
      filtersById[item.id] = {
        id: item.id,
        label: String(item.label || "").trim(),
        summary: String(item.summary || "").trim(),
        description: String(item.description || "").trim()
      };
    });

    Object.keys((payload && payload.page_content) || {}).forEach(function (pageId) {
      normalizedPageContent[pageId] = String(payload.page_content[pageId] || "");
    });

    return {
      navigation: defaults.navigation.map(function (item) {
        return navigationById[item.id] || item;
      }),
      filters: defaults.filters.map(function (item) {
        return Object.assign({}, item, filtersById[item.id] || {});
      }),
      labels: Object.assign({}, defaults.labels, payload && payload.labels && typeof payload.labels === "object" ? payload.labels : {}),
      page_content: Object.assign({}, defaults.page_content, normalizedPageContent)
    };
  }

  function getDefaultSiteNavigationLabel(pageId) {
    var defaults = createDefaultSiteConfig().navigation;
    for (var i = 0; i < defaults.length; i += 1) {
      if (defaults[i].id === pageId) return defaults[i].label;
    }
    return pageId;
  }

  function ensureActiveSitePage() {
    var availablePages = (state.siteConfig && state.siteConfig.navigation) || [];
    var hasActive = availablePages.some(function (item) {
      return item.id === state.activeSitePageId;
    });

    if (!hasActive) {
      state.activeSitePageId = availablePages.length ? availablePages[0].id : "inicio";
    }
  }

  function applyFilters() {
    var query = normalizeSearchText(projectSearch.value);
    var status = String(statusFilter.value || "");
    var alphaFilter = String(state.alphaFilter || "");

    state.filteredProjects = state.projects.filter(function (project) {
      var matchesStatus = !status || project.status === status;
      var haystack = normalizeSearchText([project.title, project.slug, project.client, project.project_type].join(" "));
      var matchesQuery = !query || haystack.indexOf(query) !== -1;
      var matchesAlpha = !alphaFilter || getProjectInitial(project) === alphaFilter;
      return matchesStatus && matchesQuery && matchesAlpha;
    });

    if (state.selectedProjectId) {
      var stillVisible = state.filteredProjects.some(function (project) {
        return project.id === state.selectedProjectId;
      });
      if (!stillVisible) {
        state.selectedProjectId = state.filteredProjects.length ? state.filteredProjects[0].id : null;
      }
    }

    syncSelectedProjectIds();
    renderAlphaBar();
    renderProjectList();
    renderBatchControls();
    renderEditor();
  }

  function clearProjectFilters() {
    projectSearch.value = "";
    statusFilter.value = "";
    state.alphaFilter = "";
    applyFilters();
  }

  function handleAlphaFilterClick(event) {
    var button = event.target.closest("[data-alpha-filter]");
    if (!button || button.disabled) return;

    var nextValue = button.getAttribute("data-alpha-filter") || "";
    state.alphaFilter = nextValue === state.alphaFilter ? "" : nextValue;
    applyFilters();
  }

  function renderAlphaBar() {
    if (!projectAlphaBar) return;

    var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "#", ""];
    var availableInitials = {};

    state.projects.forEach(function (project) {
      availableInitials[getProjectInitial(project)] = true;
    });

    if (state.alphaFilter && !availableInitials[state.alphaFilter]) {
      state.alphaFilter = "";
    }

    projectAlphaBar.innerHTML = alphabet.map(function (letter) {
      var isAll = !letter;
      var label = isAll ? "Todos" : letter;
      var isActive = isAll ? !state.alphaFilter : state.alphaFilter === letter;
      var isDisabled = !isAll && !availableInitials[letter];
      var className = "admin-alpha-button" + (isActive ? " is-active" : "") + (isAll ? " is-all" : "");

      return '' +
        '<button class="' + className + '" type="button" data-alpha-filter="' + escapeHtml(letter) + '"' + (isDisabled ? ' disabled' : '') + '>' +
          escapeHtml(label) +
        '</button>';
    }).join("");
  }

  function renderProjectList() {
    var totalProjects = state.projects.length;
    var filteredProjects = state.filteredProjects.length;
    projectCount.textContent = filteredProjects === totalProjects
      ? filteredProjects + " projetos"
      : filteredProjects + " de " + totalProjects;

    if (!state.filteredProjects.length) {
      projectList.innerHTML = '<div class="admin-card">Nenhum projeto encontrado com os filtros atuais.</div>';
      return;
    }

    projectList.innerHTML = state.filteredProjects.map(function (project) {
      var activeClass = project.id === state.selectedProjectId ? " is-active" : "";
      var selectedClass = isProjectSelected(project.id) ? " is-selected" : "";
      var metaItems = [
        formatProjectTypeLabel(project.project_type),
        project.sort_year ? String(project.sort_year) : ""
      ].filter(Boolean);
      return '' +
        '<article class="admin-project-item' + activeClass + selectedClass + '">' +
          '<div class="admin-project-item-row">' +
            '<label class="admin-project-select" aria-label="Selecionar projeto">' +
              '<input type="checkbox" data-select-project-id="' + escapeHtml(project.id) + '"' + (isProjectSelected(project.id) ? ' checked' : '') + '>' +
            '</label>' +
            '<button class="admin-project-open" type="button" data-project-id="' + escapeHtml(project.id) + '">' +
              '<div class="admin-project-item-head">' +
                '<span class="admin-project-eyebrow">' + escapeHtml(formatPublisherLabel(project.client || "Sem editora")) + '</span>' +
                '<strong class="admin-project-title">' + escapeHtml(project.title) + '</strong>' +
              '</div>' +
              '<div class="admin-project-meta">' +
                metaItems.map(function (item) {
                  return '<span>' + escapeHtml(item) + '</span>';
                }).join("") +
              '</div>' +
              '<div class="admin-project-flags">' +
                renderProjectFlagPills(project.id) +
              '</div>' +
            '</button>' +
          '</div>' +
        '</article>';
    }).join("");
  }

  function handleProjectSelection(event) {
    var button = event.target.closest("[data-project-id]");
    if (!button) return;
    state.selectedProjectId = button.getAttribute("data-project-id");
    renderProjectList();
    renderEditor();
  }

  function handleProjectSelectionToggle(event) {
    var input = event.target.closest("[data-select-project-id]");
    if (!input) return;

    toggleBatchProjectSelection(input.getAttribute("data-select-project-id"), Boolean(input.checked));
  }

  function toggleBatchProjectSelection(projectId, isSelected) {
    if (!projectId) return;

    var nextSelected = state.selectedProjectIds.filter(function (id) {
      return id !== projectId;
    });

    if (isSelected) {
      nextSelected.push(projectId);
    }

    state.selectedProjectIds = nextSelected;
    renderProjectList();
    renderBatchControls();
  }

  function isProjectSelected(projectId) {
    return state.selectedProjectIds.indexOf(projectId) !== -1;
  }

  function syncSelectedProjectIds() {
    state.selectedProjectIds = state.selectedProjectIds.filter(function (projectId) {
      return Boolean(getProjectById(projectId));
    });
  }

  function getBatchSelectedProjects() {
    return state.selectedProjectIds
      .map(function (projectId) { return getProjectById(projectId); })
      .filter(Boolean);
  }

  function renderBatchControls() {
    var selectedProjects = getBatchSelectedProjects();
    var selectionLabel = selectedProjects.length === 1 ? "1 selecionado" : selectedProjects.length + " selecionados";

    batchSelectionCount.textContent = selectionLabel;
    batchSelectVisibleButton.disabled = !state.filteredProjects.length;
    batchClearSelectionButton.disabled = !selectedProjects.length;
    batchTagSearch.disabled = !selectedProjects.length;
    batchApplyPublisherButton.disabled = !selectedProjects.length;
    batchClearPublisherButton.disabled = !selectedProjects.length;
    batchPublisherCustom.disabled = !selectedProjects.length;

    renderBatchSelectionPreview(selectedProjects);
    renderBatchTagResults();
    renderBatchPublisherResults();

    if (!selectedProjects.length) {
      setBatchFeedback("Selecione projetos no acervo para editar em lote.", false);
      return;
    }

    setBatchFeedback(selectedProjects.length === 1
      ? "Projeto pronto para receber tags ou editora."
      : "Projetos prontos para receber tags ou editora.", false);
  }

  function renderBatchSelectionPreview(selectedProjects) {
    if (!batchSelectionPreview) return;

    if (!selectedProjects.length) {
      batchSelectionPreview.innerHTML = '<span class="admin-inline-empty">Nenhum projeto selecionado.</span>';
      return;
    }

    var chips = selectedProjects.slice(0, 5).map(function (project) {
      return '<span class="admin-selection-chip">' + escapeHtml(project.title) + '</span>';
    });

    if (selectedProjects.length > 5) {
      chips.push('<span class="admin-selection-summary">+' + escapeHtml(String(selectedProjects.length - 5)) + " projetos</span>");
    }

    batchSelectionPreview.innerHTML = chips.join("");
  }

  function handleSelectVisibleProjects() {
    var merged = state.selectedProjectIds.slice();

    state.filteredProjects.forEach(function (project) {
      if (merged.indexOf(project.id) === -1) {
        merged.push(project.id);
      }
    });

    state.selectedProjectIds = merged;
    renderProjectList();
    renderBatchControls();
  }

  function clearBatchSelection() {
    state.selectedProjectIds = [];
    renderProjectList();
    renderBatchControls();
  }

  function getTagCoverageState(projectIds, tagId) {
    var taggedCount = projectIds.filter(function (projectId) {
      return (state.projectTagsByProject[projectId] || []).indexOf(tagId) !== -1;
    }).length;

    if (!taggedCount) return "none";
    if (taggedCount === projectIds.length) return "all";
    return "some";
  }

  function getPublisherCoverageState(projects, publisher) {
    var matchingCount = projects.filter(function (project) {
      return String(project.client || "").trim() === String(publisher || "").trim();
    }).length;

    if (!matchingCount) return "none";
    if (matchingCount === projects.length) return "all";
    return "some";
  }

  function handleEditorTabClick(event) {
    var button = event.target.closest("[data-editor-tab]");
    if (!button) return;
    state.editorSection = button.getAttribute("data-editor-tab") || "details";
    renderEditorTabs();
    if (state.editorSection === "tags") renderTagResults();
    if (state.editorSection === "details") renderServicoChips();
  }

  function renderEditor() {
    var project = getSelectedProject();
    if (!project) {
      state.pendingPairIds = [];
      setHidden(editorForm, true);
      renderEditorTabs();
      renderPairSelectionPreview();
      renderTagManager();
      updatePublicationPanel(null);
      return;
    }

    setHidden(editorForm, false);
    setHidden(mediaUploadForm, false);
    renderEditorTabs();
    editorTitle.textContent = project.title;
    fieldTitle.value = project.title || "";
    fieldSubtitle.value = project.subtitle || "";
    renderPublisherOptions(project.client || "");
    syncPublisherField(project.client || "");
    syncProjectTypeField(project.project_type || "");
    fieldStatus.value = project.status || "draft";
    fieldSortYear.value = formatSortYearInput(project.sort_year);
    fieldFeatured.checked = Boolean(project.is_featured);
    quillDesc.root.innerHTML = project.description || "";
    renderServicoChips();
    syncDossieSelect(project.dossie_id || "");
    state.pendingPairIds = [];
    updatePublicationPanel(project);
    syncEditorialFlagsPanel(project.id);
    renderMediaList();
    loadProjectImages(project.id);
    renderTagResults();
    renderTagManager();
    renderPairResults();
    renderPairSelectionPreview();
    renderPairList();
  }

  function getSelectedProject() {
    for (var i = 0; i < state.projects.length; i += 1) {
      if (state.projects[i].id === state.selectedProjectId) {
        return state.projects[i];
      }
    }
    return null;
  }

  function handleProjectSave(event) {
    if (event && event.preventDefault) event.preventDefault();
    persistCurrentProject();
  }

  function handlePublisherSelectionChange() {
    var isCustom = fieldClientSelect.value === "__custom__";
    setHidden(fieldClientCustom, !isCustom);

    if (!isCustom) {
      fieldClientCustom.value = "";
    }

    syncCurrentPublicationChecklist();
  }

  function renderPublisherOptions(currentValue) {
    var selectedValue = String(currentValue || "").trim();
    var publishers = getKnownPublishers();

    fieldClientSelect.innerHTML = '<option value="">Selecione</option>' +
      publishers.map(function (publisher) {
        return '<option value="' + escapeHtml(publisher) + '">' + escapeHtml(formatPublisherLabel(publisher)) + '</option>';
      }).join("") +
      '<option value="__custom__">Outra editora</option>';

    if (!selectedValue) {
      fieldClientSelect.value = "";
      fieldClientCustom.value = "";
      setHidden(fieldClientCustom, true);
      return;
    }
  }

  function syncPublisherField(value) {
    var selectedValue = String(value || "").trim();
    var hasKnownOption = Array.prototype.some.call(fieldClientSelect.options, function (option) {
      return option.value === selectedValue;
    });

    if (!selectedValue) {
      fieldClientSelect.value = "";
      fieldClientCustom.value = "";
      setHidden(fieldClientCustom, true);
      return;
    }

    if (hasKnownOption) {
      fieldClientSelect.value = selectedValue;
      fieldClientCustom.value = "";
      setHidden(fieldClientCustom, true);
      return;
    }

    fieldClientSelect.value = "__custom__";
    fieldClientCustom.value = selectedValue;
    setHidden(fieldClientCustom, false);
  }

  function getPublisherFieldValue() {
    if (fieldClientSelect.value === "__custom__") {
      return String(fieldClientCustom.value || "").trim() || null;
    }
    return String(fieldClientSelect.value || "").trim() || null;
  }

  function getKnownPublishers() {
    return state.projects
      .map(function (project) { return String(project.client || "").trim(); })
      .filter(Boolean)
      .filter(function (value, index, list) { return list.indexOf(value) === index; })
      .sort(function (left, right) {
        return formatPublisherLabel(left).localeCompare(formatPublisherLabel(right), "pt-BR");
      });
  }

  function renderBatchPublisherResults() {
    var selectedProjects = getBatchSelectedProjects();
    var publishers = getKnownPublishers();

    if (!selectedProjects.length) {
      batchPublisherResults.innerHTML = '<p class="admin-inline-empty">Selecione projetos para aplicar editora em lote.</p>';
      return;
    }

    if (!publishers.length) {
      batchPublisherResults.innerHTML = '<p class="admin-inline-empty">Nenhuma editora cadastrada ainda.</p>';
      return;
    }

    batchPublisherResults.innerHTML = publishers.map(function (publisher) {
      var coverage = getPublisherCoverageState(selectedProjects, publisher);
      var className = "admin-chip";

      if (coverage === "all") {
        className += " is-active";
      } else if (coverage === "some") {
        className += " is-mixed";
      }

      return '' +
        '<button class="' + className + '" type="button" data-batch-publisher="' + escapeHtml(publisher) + '">' +
          escapeHtml(formatPublisherLabel(publisher)) +
        '</button>';
    }).join("");
  }

  function handleBatchPublisherChipClick(event) {
    var button = event.target.closest("[data-batch-publisher]");
    if (!button) return;

    applyPublisherToSelectedProjects(button.getAttribute("data-batch-publisher"));
  }

  function handleBatchPublisherApply() {
    var publisher = String(batchPublisherCustom.value || "").trim();
    if (!publisher) {
      setBatchFeedback("Digite uma editora para aplicar em lote.", true);
      return;
    }

    applyPublisherToSelectedProjects(publisher);
  }

  function handleBatchPublisherClear() {
    applyPublisherToSelectedProjects(null);
  }

  function applyPublisherToSelectedProjects(publisher) {
    var projectIds = state.selectedProjectIds.slice();
    if (!projectIds.length) {
      setBatchFeedback("Selecione projetos para aplicar editora em lote.", true);
      return;
    }

    setSaveState("Aplicando editora em lote...");

    fetch(backend.url + "/rest/v1/projects?id=" + buildInFilter(projectIds), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        client: publisher ? String(publisher).trim() : null
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payloadResponse) {
            throw new Error(payloadResponse.message || payloadResponse.msg || "falha ao aplicar editora em lote");
          });
        }
        return response.json();
      })
      .then(function (items) {
        (items || []).forEach(replaceProject);
        batchPublisherCustom.value = "";
        renderPublisherOptions(getPublisherFieldValue() || "");
        renderBatchControls();
        renderProjectList();
        renderEditor();
        setBatchFeedback("Editora aplicada aos projetos selecionados.", false);
        setSaveState("Editora aplicada em lote");
      })
      .catch(function (error) {
        setBatchFeedback("Não foi possível aplicar a editora: " + error.message, true);
        setSaveState("Erro ao aplicar editora em lote");
      });
  }

  function handleProjectTypeSelectionChange() {
    var isCustom = fieldTypeSelect.value === "__custom__";
    setHidden(fieldTypeCustom, !isCustom);

    if (!isCustom) {
      fieldTypeCustom.value = "";
    }

    syncCurrentPublicationChecklist();
  }

  function syncProjectTypeField(value) {
    var selectedValue = normalizeProjectType(value);
    var hasKnownOption = Array.prototype.some.call(fieldTypeSelect.options, function (option) {
      return option.value === selectedValue;
    });

    if (!selectedValue) {
      fieldTypeSelect.value = "";
      fieldTypeCustom.value = "";
      setHidden(fieldTypeCustom, true);
      return;
    }

    if (hasKnownOption) {
      fieldTypeSelect.value = selectedValue;
      fieldTypeCustom.value = "";
      setHidden(fieldTypeCustom, true);
      return;
    }

    fieldTypeSelect.value = "__custom__";
    fieldTypeCustom.value = selectedValue;
    setHidden(fieldTypeCustom, false);
  }

  function getProjectTypeValue() {
    if (fieldTypeSelect.value === "__custom__") {
      return normalizeProjectType(String(fieldTypeCustom.value || "").trim()) || null;
    }
    return normalizeProjectType(String(fieldTypeSelect.value || "").trim()) || null;
  }

  function handleSortYearInput() {
    if (!fieldSortYear) return;
    fieldSortYear.value = String(fieldSortYear.value || "").replace(/\D+/g, "").slice(0, 4);
    syncCurrentPublicationChecklist();
  }

  function parseSortYearValue(rawValue) {
    var normalized = String(rawValue || "").replace(/\D+/g, "").trim();
    if (!normalized) return null;
    if (!/^\d{4}$/.test(normalized)) return undefined;
    return Number(normalized);
  }

  function getSortYearValue() {
    return parseSortYearValue(fieldSortYear && fieldSortYear.value);
  }

  function formatSortYearInput(value) {
    return value == null ? "" : String(value);
  }

  function syncCurrentPublicationChecklist() {
    var project = getSelectedProject();
    if (!project) return;
    syncPublicationChecklist(buildPublicationDraft(project));
  }

  function buildPublicationDraft(project) {
    return {
      id: project.id,
      title: String(fieldTitle.value || "").trim(),
      client: getPublisherFieldValue(),
      project_type: getProjectTypeValue(),
      sort_year: getSortYearValue()
    };
  }

  // ── Serviço executado ─────────────────────────────────────────────────────
  function getServicoTypes() {
    return (state.siteConfig && state.siteConfig.labels && state.siteConfig.labels.servico_types) || [];
  }

  function getServicoValue() {
    var active = Array.prototype.slice.call(servicoChips.querySelectorAll(".admin-chip.is-active[data-servico]"));
    return active.map(function(c) { return c.dataset.servico; }).join(",") || null;
  }

  function renderServicoChips() {
    var project = getSelectedProject();
    var ativos = project && project.servico ? project.servico.split(",").map(function(s) { return s.trim(); }) : [];
    var tipos = getServicoTypes();
    servicoChips.innerHTML = tipos.map(function(tipo) {
      var isActive = ativos.indexOf(tipo) !== -1;
      if (servicoEditMode) {
        return '<button class="admin-chip admin-chip-deletable" type="button" data-servico="' + escapeHtml(tipo) + '">' +
          escapeHtml(tipo) +
          '<span class="admin-chip-x" data-delete-servico="' + escapeHtml(tipo) + '" title="Remover da lista">×</span>' +
          '</button>';
      }
      return '<button class="admin-chip ' + (isActive ? 'is-active' : '') + '" type="button"' +
        (!project ? ' disabled' : '') + ' data-servico="' + escapeHtml(tipo) + '">' +
        escapeHtml(tipo) + '</button>';
    }).join("");
  }

  function syncServicoChips(servico) {
    var ativos = servico ? servico.split(",").map(function(s) { return s.trim(); }) : [];
    Array.prototype.forEach.call(servicoChips.querySelectorAll(".admin-chip[data-servico]"), function(chip) {
      chip.classList.toggle("is-active", ativos.indexOf(chip.dataset.servico) !== -1);
    });
  }

  function handleServicoChipClick(event) {
    // Delete chip type from global list
    var deleteBtn = event.target.closest("[data-delete-servico]");
    if (deleteBtn) {
      var tipo = deleteBtn.dataset.deleteServico;
      var tipos = getServicoTypes().filter(function(t) { return t !== tipo; });
      saveServicoTypes(tipos);
      return;
    }
    // Toggle chip for current project
    if (servicoEditMode) return;
    var chip = event.target.closest(".admin-chip[data-servico]");
    if (!chip || chip.disabled) return;
    var project = getSelectedProject();
    if (!project) return;
    var ativos = project.servico ? project.servico.split(",").map(function(s) { return s.trim(); }) : [];
    var tipo = chip.dataset.servico;
    if (ativos.indexOf(tipo) !== -1) {
      ativos = ativos.filter(function(s) { return s !== tipo; });
    } else {
      ativos.push(tipo);
    }
    var novoValor = ativos.join(",");
    patchServico(project, novoValor);
  }

  function handleServicoAdd() {
    var nome = servicoNewInput.value.trim();
    if (!nome) return;
    var tipos = getServicoTypes();
    if (tipos.indexOf(nome) !== -1) {
      servicoFeedback.textContent = "Serviço já existe.";
      return;
    }
    tipos = tipos.concat([nome]);
    saveServicoTypes(tipos, function() {
      servicoAddForm.hidden = true;
      servicoNewInput.value = "";
    });
  }

  function saveServicoTypes(tipos, callback) {
    if (!state.siteConfig.labels) state.siteConfig.labels = {};
    state.siteConfig.labels.servico_types = tipos;
    fetch(backend.url + "/rest/v1/site_config?key=eq.main", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({ labels: state.siteConfig.labels })
    })
    .then(function() {
      renderServicoChips();
      servicoFeedback.textContent = "Lista atualizada.";
      setTimeout(function() { servicoFeedback.textContent = ""; }, 2000);
      if (callback) callback();
    })
    .catch(function() { servicoFeedback.textContent = "Erro ao salvar lista."; });
  }

  function patchServico(project, novoValor) {
    fetch(backend.url + "/rest/v1/projects?id=eq." + encodeURIComponent(project.id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({ servico: novoValor || null })
    })
    .then(function(r) { return r.json(); })
    .then(function(items) {
      if (items && items.length) replaceProject(items[0]);
      syncServicoChips(novoValor);
    })
    .catch(function() { servicoFeedback.textContent = "Erro ao salvar."; });
  }

  // ── Dossiê vinculado ──────────────────────────────────────────────────────
  function loadDossies() {
    return fetch(backend.url + "/rest/v1/dossies?select=id,titulo&order=titulo.asc", {
      headers: { apikey: backend.anonKey, Authorization: "Bearer " + state.token }
    })
    .then(function(r) { return r.json(); })
    .then(function(rows) {
      state.dossies = rows || [];
      rebuildDossieSelectOptions();
    });
  }

  function rebuildDossieSelectOptions() {
    var current = fieldDossieSelect.value;
    fieldDossieSelect.innerHTML = '<option value="">Nenhum</option>';
    (state.dossies || []).forEach(function(d) {
      var opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.titulo;
      fieldDossieSelect.appendChild(opt);
    });
    fieldDossieSelect.value = current;
  }

  function syncDossieSelect(dossieId) {
    fieldDossieSelect.value = dossieId || "";
  }

  function handleProjectDeletion() {
    var project = getSelectedProject();
    if (!project) return;

    var confirmation = window.prompt('Digite "' + project.slug + '" para excluir este projeto.');
    if (confirmation === null) return;

    if (sanitizeSlug(confirmation) !== project.slug) {
      setSaveState("Exclusao cancelada");
      return;
    }

    setSaveState("Excluindo projeto...");

    loadProjectImagesSnapshot(project.id)
      .then(function (images) {
        return Promise.allSettled((images || []).map(function (image) {
          return deleteStorageObject(image.storage_path);
        }));
      })
      .then(function () {
        return fetch(backend.url + "/rest/v1/projects?id=eq." + encodeURIComponent(project.id), {
          method: "DELETE",
          headers: {
            apikey: backend.anonKey,
            Authorization: "Bearer " + state.token
          }
        });
      })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao excluir projeto");
          });
        }

        state.projects = state.projects.filter(function (item) {
          return item.id !== project.id;
        });
        delete state.imagesByProject[project.id];
        delete state.projectTagsByProject[project.id];
        delete state.editorialFlagsByProject[project.id];
        state.selectedProjectIds = state.selectedProjectIds.filter(function (id) {
          return id !== project.id;
        });
        state.pairs = state.pairs.filter(function (pair) {
          return pair.project_id !== project.id && pair.paired_project_id !== project.id;
        });
        state.selectedProjectId = null;
        applyFilters();
        renderEditor();
        window.alert("Projeto excluído.");
      })
      .catch(function () {
        setSaveState("Erro ao excluir projeto");
      });
  }

  function persistCurrentProject(forcedStatus) {
    var project = getSelectedProject();
    if (!project) return;
    var nextSlug = project.slug;
    var nextStatus = String(forcedStatus || fieldStatus.value || "draft");
    var nextSortYear = getSortYearValue();

    fieldStatus.value = nextStatus;

    if (nextSortYear === undefined) {
      setSaveState("Use um ano com quatro dígitos.");
      return;
    }

    setSaveState("Salvando...");

    fetch(backend.url + "/rest/v1/projects?id=eq." + encodeURIComponent(project.id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        slug: nextSlug,
        title: String(fieldTitle.value || "").trim(),
        subtitle: String(fieldSubtitle.value || "").trim() || null,
        client: getPublisherFieldValue(),
        project_type: getProjectTypeValue(),
        status: nextStatus,
        sort_year: nextSortYear,
        description: quillDesc.root.innerHTML || null,
        is_featured: Boolean(fieldFeatured.checked),
        servico: getServicoValue(),
        dossie_id: fieldDossieSelect.value || null,
        published_at: resolvePublishedAt(project, nextStatus)
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao salvar");
          });
        }
        return response.json();
      })
      .then(function (items) {
        if (items && items.length) {
          replaceProject(items[0]);
          renderPublisherOptions(items[0].client || "");
          syncPublisherField(items[0].client || "");
          syncProjectTypeField(items[0].project_type || "");
          editorTitle.textContent = items[0].title;
          updatePublicationPanel(items[0]);
          applyFilters();
        }
        setSaveState("Salvo");
      })
      .catch(function (error) {
        setSaveState("Erro ao salvar");
      });
  }

  function handleIntakeUpload(event) {
    if (event && event.preventDefault) event.preventDefault();

    var files = intakeFiles.files;
    var shouldOverwrite = Boolean(intakeOverwrite.checked);

    if (!files || !files.length) {
      setBulkImportFeedback("Selecione ao menos um arquivo para criar os projetos.", true);
      renderIntakeReport(null);
      return;
    }

    var grouped;
    try {
      grouped = groupIncomingFiles(files);
    } catch (error) {
      setBulkImportFeedback(error.message, true);
      renderIntakeReport(null);
      return;
    }

    if (!grouped.items.length) {
      setBulkImportFeedback("Nenhum arquivo válido foi reconhecido.", true);
      renderIntakeReport({
        invalidFiles: grouped.invalidGroups
      });
      return;
    }

    var existingSlugs = {};
    var existingTitles = {};
    var existingProjectsBySlug = {};
    for (var i = 0; i < state.projects.length; i += 1) {
      existingSlugs[state.projects[i].slug] = true;
      existingTitles[normalizeTitleKey(state.projects[i].title)] = state.projects[i].title;
      existingProjectsBySlug[state.projects[i].slug] = state.projects[i];
    }

    var createdCandidates = [];
    var overwriteCandidates = [];
    var duplicateIdentifiers = [];
    var duplicateTitles = [];
    var seenTitleKeys = {};

    grouped.items.forEach(function (item) {
      var titleKey = normalizeTitleKey(buildProvisionalTitle(item.slug));

      if (existingSlugs[item.slug]) {
        if (shouldOverwrite) {
          overwriteCandidates.push(item);
          return;
        }
        duplicateIdentifiers.push(item.slug);
        return;
      }

      if (existingTitles[titleKey] || seenTitleKeys[titleKey]) {
        duplicateTitles.push(buildProvisionalTitle(item.slug));
        return;
      }

      seenTitleKeys[titleKey] = true;
      createdCandidates.push(item);
    });

    if (!createdCandidates.length && !overwriteCandidates.length) {
      setBulkImportFeedback("Nenhum projeto novo foi criado.", true);
      renderIntakeReport({
        duplicateIdentifiers: duplicateIdentifiers,
        duplicateTitles: duplicateTitles,
        invalidFiles: grouped.invalidGroups
      });
      return;
    }

    setBulkImportFeedback("Processando arquivos...", false);
    renderIntakeReport(null);
    setSaveState("Processando upload inicial...");

    createProjectsFromGroups(createdCandidates)
      .then(function (createdProjects) {
        var uploads = [];

        createdProjects.forEach(function (project) {
          state.projects.push(project);
          state.projectTagsByProject[project.id] = [];
          state.imagesByProject[project.id] = [];
          uploads.push(upsertEditorialFlag(project.id, "review_text", "Revisar texto"));

          var group = findGroupBySlug(createdCandidates, project.slug);
          if (group) {
            group.files.forEach(function (entry) {
              uploads.push(uploadPreparedImage(project, entry.file, entry.kind, entry.sortOrder));
            });
          }
        });

        return Promise.all(uploads).then(function () {
          return createdProjects;
        });
      })
      .then(function (createdProjects) {
        var overwriteJobs = overwriteCandidates.map(function (group) {
          var project = existingProjectsBySlug[group.slug];
          if (!project) return Promise.resolve(null);
          return overwriteProjectMedia(project, group);
        });

        return Promise.all(overwriteJobs).then(function (overwrittenProjects) {
          return {
            createdProjects: createdProjects,
            overwrittenProjects: overwrittenProjects.filter(Boolean)
          };
        });
      })
      .then(function (result) {
        var createdProjects = result.createdProjects;
        var overwrittenProjects = result.overwrittenProjects;

        createdProjects.forEach(function (project) {
          if (!state.editorialFlagsByProject[project.id]) {
            state.editorialFlagsByProject[project.id] = [];
          }
          if (!hasEditorialFlag(project.id, "review_text")) {
            state.editorialFlagsByProject[project.id].push({
              project_id: project.id,
              flag_key: "review_text",
              flag_label: "Revisar texto",
              is_public: false
            });
          }
        });

        if (createdProjects.length) {
          state.selectedProjectId = createdProjects[0].id;
        } else if (overwrittenProjects.length) {
          state.selectedProjectId = overwrittenProjects[0].id;
        }

        intakeFiles.value = "";
        intakeOverwrite.checked = false;
        applyFilters();

        if (state.selectedProjectId) {
          loadProjectImages(state.selectedProjectId);
        }

        setBulkImportFeedback("Upload concluído.", false);
        renderIntakeReport({
          createdProjects: createdProjects.map(function (project) { return project.title; }),
          overwrittenProjects: overwrittenProjects.map(function (project) { return project.title; }),
          duplicateIdentifiers: duplicateIdentifiers,
          duplicateTitles: duplicateTitles,
          invalidFiles: grouped.invalidGroups
        });
        setSaveState("Projetos criados a partir do upload");
      })
      .catch(function (error) {
        setBulkImportFeedback("Não foi possível criar os projetos: " + error.message, true);
        renderIntakeReport(null);
        setSaveState("Erro no upload inicial");
      });
  }

  function loadProjectImages(projectId) {
    if (!projectId) return;

    mediaList.innerHTML = '<div class="admin-card">Carregando imagens...</div>';

    fetch(backend.url + "/rest/v1/project_images?select=id,project_id,storage_path,kind,alt_text,sort_order,is_published,created_at&project_id=eq." + encodeURIComponent(projectId) + "&order=sort_order.asc,created_at.asc", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar imagens");
          });
        }
        return response.json();
      })
      .then(function (images) {
        if (state.selectedProjectId !== projectId) return;
        state.imagesByProject[projectId] = images || [];
        renderMediaList();
        var selectedProject = getSelectedProject();
        if (selectedProject && selectedProject.id === projectId) {
          syncPublicationChecklist(selectedProject);
        }
      })
      .catch(function () {
        mediaList.innerHTML = '<div class="admin-card">Não foi possível carregar as imagens deste projeto.</div>';
      });
  }

  function renderMediaList() {
    var project = getSelectedProject();
    if (!project) {
      mediaList.innerHTML = "";
      return;
    }

    var images = state.imagesByProject[project.id];
    if (!images) {
      mediaList.innerHTML = '<div class="admin-card">Carregando imagens...</div>';
      return;
    }

    if (!images.length) {
      mediaList.innerHTML = '<div class="admin-card">Este projeto ainda não tem imagens.</div>';
      return;
    }

    mediaList.innerHTML = images.map(function (image) {
      var publicUrl = buildPublicMediaUrl(image.storage_path);
      var label = image.kind === "thumb"
        ? "Thumb"
        : "Imagem " + String(Number(image.sort_order || 0) + 1).padStart(2, "0");
      return '' +
        '<article class="admin-media-item">' +
          '<img class="admin-media-preview" src="' + escapeHtml(publicUrl) + '" alt="' + escapeHtml(image.alt_text || "") + '">' +
          '<div class="admin-media-body">' +
            '<div class="admin-media-meta">' +
              '<strong>' + escapeHtml(label) + '</strong>' +
            '</div>' +
            '<div class="admin-media-actions">' +
              '<button class="admin-danger-button" type="button" data-remove-media="' + escapeHtml(image.id) + '">Remover mídia</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join("");
  }

  function renderTagResults() {
    var project = getSelectedProject();
    var query = String(tagSearch.value || "").trim().toLowerCase();
    var linkedIds = project ? (state.projectTagsByProject[project.id] || []) : [];
    var matches = state.tags.filter(function (tag) {
      if (!query) return true;
      var haystack = [tag.label, tag.slug, tag.group_name].join(" ").toLowerCase();
      return haystack.indexOf(query) !== -1;
    }).sort(function (left, right) {
      var leftActive = linkedIds.indexOf(left.id) !== -1 ? 1 : 0;
      var rightActive = linkedIds.indexOf(right.id) !== -1 ? 1 : 0;
      if (leftActive !== rightActive) return rightActive - leftActive;
      return String(left.label || "").localeCompare(String(right.label || ""));
    }).slice(0, 80);

    if (!matches.length) {
      tagResults.innerHTML = '<p class="admin-inline-empty">Nenhuma tag encontrada.</p>';
      return;
    }

    tagResults.innerHTML = matches.map(function (tag) {
      var isActive = linkedIds.indexOf(tag.id) !== -1;
      return '' +
        '<button class="admin-chip ' + (isActive ? 'is-active' : '') + '" type="button" data-toggle-tag="' + escapeHtml(tag.id) + '"' + (!project ? ' disabled' : '') + '>' +
          escapeHtml(tag.label) +
        '</button>';
    }).join("");
  }

  function renderBatchTagResults() {
    var selectedProjects = getBatchSelectedProjects();
    var query = String(batchTagSearch.value || "").trim().toLowerCase();

    if (!selectedProjects.length) {
      batchTagResults.innerHTML = '<p class="admin-inline-empty">Selecione projetos para aplicar tags em lote.</p>';
      return;
    }

    var selectedIds = selectedProjects.map(function (project) { return project.id; });
    var matches = state.tags.filter(function (tag) {
      if (!query) return true;
      var haystack = [tag.label, tag.slug, tag.group_name].join(" ").toLowerCase();
      return haystack.indexOf(query) !== -1;
    }).sort(function (left, right) {
      return String(left.label || "").localeCompare(String(right.label || ""));
    }).slice(0, 80);

    if (!matches.length) {
      batchTagResults.innerHTML = '<p class="admin-inline-empty">Nenhuma tag encontrada.</p>';
      return;
    }

    batchTagResults.innerHTML = matches.map(function (tag) {
      var coverage = getTagCoverageState(selectedIds, tag.id);
      var className = "admin-chip";

      if (coverage === "all") {
        className += " is-active";
      } else if (coverage === "some") {
        className += " is-mixed";
      }

      return '' +
        '<button class="' + className + '" type="button" data-batch-tag-id="' + escapeHtml(tag.id) + '">' +
          escapeHtml(tag.label) +
        '</button>';
    }).join("");
  }

  function handleTagResultsClick(event) {
    var button = event.target.closest("[data-toggle-tag]");
    if (!button) return;

    var project = getSelectedProject();
    var tagId = button.getAttribute("data-toggle-tag");
    if (!project || !tagId) return;

    var linkedIds = state.projectTagsByProject[project.id] || [];
    if (linkedIds.indexOf(tagId) !== -1) {
      removeTagFromProject(project.id, tagId);
      return;
    }

    addTagToProject(project.id, tagId)
      .then(function () {
        setSaveState("Tag marcada");
      })
      .catch(function () {
        setSaveState("Erro ao marcar tag");
      });
  }

  function selectTagForManagement(tagId) {
    state.selectedTagId = tagId || null;
    renderTagManager();
  }

  function handleTagManagerSelectionChange() {
    selectTagForManagement(tagManagerSelect.value);
  }

  function renderTagManager() {
    var tag = state.selectedTagId ? getTagById(state.selectedTagId) : null;
    var options = ['<option value="">Selecione uma tag</option>'].concat(
      state.tags
        .slice()
        .sort(function (left, right) {
          return String(left.label || "").localeCompare(String(right.label || ""), "pt-BR");
        })
        .map(function (item) {
          var isSelected = item.id === state.selectedTagId;
          return '<option value="' + escapeHtml(item.id) + '"' + (isSelected ? ' selected' : '') + '>' + escapeHtml(item.label) + '</option>';
        })
    );

    tagManagerSelect.innerHTML = options.join("");
    tagManagerSelect.disabled = !state.tags.length;

    if (!tag) {
      tagManagerSelect.value = "";
      tagManagerLabel.value = "";
      tagManagerLabel.disabled = true;
      tagManagerSaveButton.disabled = true;
      tagManagerDeleteButton.disabled = true;
      tagManagerFeedback.textContent = "";
      return;
    }

    tagManagerSelect.value = tag.id;
    tagManagerLabel.value = tag.label || "";
    tagManagerLabel.disabled = false;
    tagManagerSaveButton.disabled = false;
    tagManagerDeleteButton.disabled = false;
    tagManagerFeedback.textContent = "";
  }

  function renderSiteConfigEditor() {
    if (!siteNavigationFields || !sitePageTabs || !sitePageMeta || !sitePageContent || !siteFilterFields) return;

    ensureActiveSitePage();

    var siteConfig = state.siteConfig || createDefaultSiteConfig();
    var activePage = getSiteNavigationItem(state.activeSitePageId) || siteConfig.navigation[0] || { id: "inicio", label: "Início" };
    var pageContent = siteConfig.page_content[activePage.id] || "";

    siteNavigationFields.innerHTML = siteConfig.navigation.map(function (item) {
      return '' +
        '<label class="admin-field">' +
          '<span class="admin-label">' + escapeHtml(item.id) + '</span>' +
          '<input class="admin-input" type="text" data-site-nav-id="' + escapeHtml(item.id) + '" value="' + escapeHtml(item.label || "") + '">' +
        '</label>';
    }).join("");

    sitePageTabs.innerHTML = siteConfig.navigation.map(function (item) {
      var className = "admin-editor-tab" + (item.id === activePage.id ? " is-active" : "");
      return '' +
        '<button class="' + className + '" type="button" data-site-page-id="' + escapeHtml(item.id) + '">' +
          escapeHtml(item.label || item.id) +
        '</button>';
    }).join("");

    sitePageMeta.textContent = getSitePageMeta(activePage);
    quillPage.root.innerHTML = pageContent || "";

    if (dossieEntryBuilder) {
      dossieEntryBuilder.hidden = activePage.id !== "dossie";
    }

    siteFilterFields.innerHTML = siteConfig.filters.map(function (item) {
      return '' +
        '<article class="admin-site-filter-card">' +
          '<div class="admin-site-filter-head">' +
            '<h4>' + escapeHtml(item.label || item.id) + '</h4>' +
            '<button type="button" class="admin-danger-button admin-filter-delete-btn" data-delete-filter-id="' + escapeHtml(item.id) + '" title="Excluir trilha">Excluir</button>' +
          '</div>' +
          '<label class="admin-field">' +
            '<span class="admin-label">Nome</span>' +
            '<input class="admin-input" type="text" data-site-filter-id="' + escapeHtml(item.id) + '" data-site-filter-field="label" value="' + escapeHtml(item.label || "") + '">' +
          '</label>' +
        '</article>';
    }).join("");

    siteConfigFeedback.textContent = "";
  }

  function handleSiteConfigClick(event) {
    var pageButton = event.target.closest("[data-site-page-id]");
    if (!pageButton) return;

    state.activeSitePageId = pageButton.getAttribute("data-site-page-id") || "inicio";
    renderSiteConfigEditor();
  }

  function handleSiteConfigInput(event) {
    var target = event.target;
    if (!target) return;

    var navId = target.getAttribute("data-site-nav-id");
    if (navId) {
      updateSiteNavigationLabel(navId, target.value);
      updateSitePageMeta();
      updateSitePageTabsLabel(navId, target.value);
      return;
    }

    var filterId = target.getAttribute("data-site-filter-id");
    var filterField = target.getAttribute("data-site-filter-field");
    if (filterId && filterField) {
      updateSiteFilterField(filterId, filterField, target.value);
      return;
    }

  }

  function handlePageContentInput() {
    if (!state.siteConfig.page_content) state.siteConfig.page_content = {};
    state.siteConfig.page_content[state.activeSitePageId] = quillPage.root.innerHTML || "";
  }

  function updateSiteNavigationLabel(pageId, value) {
    var item = getSiteNavigationItem(pageId);
    if (!item) return;
    item.label = String(value || "").trim() || getDefaultSiteNavigationLabel(pageId);
  }

  function updateSiteFilterField(filterId, fieldName, value) {
    var item = getSiteFilterItem(filterId);
    if (!item) return;
    item[fieldName] = String(value || "").trim();
  }

  function updateSitePageMeta() {
    var activePage = getSiteNavigationItem(state.activeSitePageId);
    if (!sitePageMeta || !activePage) return;
    sitePageMeta.textContent = getSitePageMeta(activePage);
  }

  function getSitePageMeta(activePage) {
    var baseLabel = "Página ativa: " + (activePage.label || activePage.id) + " (" + activePage.id + ").";

    if (activePage.id === "portfolio") {
      return baseLabel + " Mantenha os marcadores data-portfolio-overview e data-portfolio-buttons para a navegação dinâmica.";
    }

    if (activePage.id === "inicio") {
      return baseLabel + " Se quiser botões de navegação, use data-action=\"open-page\" com o data-page-id desejado.";
    }

    if (activePage.id === "dossie") {
      return baseLabel + " Use o construtor abaixo para inserir entradas formatadas, ou edite o HTML diretamente.";
    }

    return baseLabel;
  }

  function updateSitePageTabsLabel(pageId, value) {
    var button = sitePageTabs.querySelector("[data-site-page-id='" + pageId + "']");
    if (!button) return;

    button.textContent = String(value || "").trim() || getDefaultSiteNavigationLabel(pageId);
  }

  function getSiteNavigationItem(pageId) {
    var navigation = (state.siteConfig && state.siteConfig.navigation) || [];
    for (var i = 0; i < navigation.length; i += 1) {
      if (navigation[i].id === pageId) return navigation[i];
    }
    return null;
  }

  function getSiteFilterItem(filterId) {
    var filters = (state.siteConfig && state.siteConfig.filters) || [];
    for (var i = 0; i < filters.length; i += 1) {
      if (filters[i].id === filterId) return filters[i];
    }
    return null;
  }

  function handleFilterAdd() {
    var label = filterNewLabel.value.trim();
    if (!label) return;
    var id = label.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    var filters = state.siteConfig.filters || [];
    if (filters.some(function(f) { return f.id === id; })) {
      window.alert("Já existe uma trilha com esse nome.");
      return;
    }
    filters.push({ id: id, label: label, summary: "", description: "" });
    state.siteConfig.filters = filters;
    filterAddForm.hidden = true;
    filterNewLabel.value = "";
    renderSiteConfigEditor();
  }

  function handleFilterDelete(event) {
    var btn = event.target.closest("[data-delete-filter-id]");
    if (!btn) return;
    var id = btn.getAttribute("data-delete-filter-id");
    if (!window.confirm('Excluir a trilha "' + id + '"? Esta ação não pode ser desfeita.')) return;
    state.siteConfig.filters = (state.siteConfig.filters || []).filter(function(f) { return f.id !== id; });
    renderSiteConfigEditor();
  }

  function handleSiteConfigSave(event) {
    if (event && event.preventDefault) event.preventDefault();

    ensureActiveSitePage();
    setSiteConfigFeedback("Salvando conteúdo do site...", false);
    siteConfigSaveButton.disabled = true;

    fetch(backend.url + "/rest/v1/site_config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify([serializeSiteConfigForSave()])
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao salvar conteudo do site");
          });
        }
        return response.json();
      })
      .then(function (items) {
        state.siteConfig = normalizeSiteConfig(items && items[0] ? items[0] : serializeSiteConfigForSave());
        renderSiteConfigEditor();
        setSiteConfigFeedback("Conteúdo do site salvo.", false);
      })
      .catch(function (error) {
        setSiteConfigFeedback("Não foi possível salvar o conteúdo do site: " + error.message, true);
      })
      .finally(function () {
        siteConfigSaveButton.disabled = false;
      });
  }

  function handleDossieInsert() {
    var typeEl = document.getElementById("dossie-type");
    var titleEl = document.getElementById("dossie-title");
    var bodyEl = document.getElementById("dossie-body");
    var mediaEl = document.getElementById("dossie-media");
    var galleryUrlsEl = document.getElementById("dossie-gallery-urls");

    var type = typeEl ? String(typeEl.value || "nota") : "nota";
    var title = titleEl ? String(titleEl.value || "").trim() : "";
    var body = bodyEl ? String(bodyEl.value || "").trim() : "";
    var media = mediaEl ? String(mediaEl.value || "").trim() : "";
    var galleryUrls = galleryUrlsEl
      ? String(galleryUrlsEl.value || "").split("\n").map(function(u) { return u.trim(); }).filter(Boolean)
      : [];

    if (type === "galeria") {
      if (!galleryUrls.length) {
        alert("Adicione ao menos uma URL de imagem para a galeria.");
        return;
      }
    } else if (!title && !body) {
      alert("Preencha ao menos um título ou texto.");
      return;
    }

    var html = buildDossieEntryHtml(type, title, body, media, galleryUrls);
    var current = sitePageContent ? String(sitePageContent.value || "") : "";
    if (sitePageContent) {
      sitePageContent.value = current + (current ? "\n\n" : "") + html;
      if (!state.siteConfig.page_content) {
        state.siteConfig.page_content = {};
      }
      state.siteConfig.page_content["dossie"] = String(sitePageContent.value);
    }

    if (titleEl) titleEl.value = "";
    if (bodyEl) bodyEl.value = "";
    if (mediaEl) mediaEl.value = "";
    if (galleryUrlsEl) galleryUrlsEl.value = "";
  }

  function buildDossieEntryHtml(type, title, body, media, galleryUrls) {
    if (type === "galeria") {
      var slides = (galleryUrls || []).map(function(url) {
        return '  <figure class="dossie-slide"><img src="' + escapeHtml(url) + '" alt="' + escapeHtml(title) + '" loading="lazy"></figure>';
      });
      var parts = ['<div class="dossie-entry dossie-entry-galeria">'];
      if (title) parts.push('  <h2 class="dossie-title">' + escapeHtml(title) + '</h2>');
      parts.push('  <div class="dossie-gallery">');
      parts = parts.concat(slides);
      parts.push('  </div>');
      if (body) parts.push('  <p class="dossie-body">' + escapeHtml(body) + '</p>');
      parts.push('</div>');
      return parts.join("\n");
    }

    var parts = ['<article class="dossie-entry dossie-entry-' + escapeHtml(type) + '">'];
    if (title) {
      parts.push('  <h2 class="dossie-title">' + escapeHtml(title) + '</h2>');
    }
    if (media) {
      if (type === "clip") {
        parts.push('  <div class="dossie-media"><iframe src="' + escapeHtml(media) + '" allowfullscreen loading="lazy"></iframe></div>');
      } else {
        parts.push('  <figure class="dossie-media"><img src="' + escapeHtml(media) + '" alt="' + escapeHtml(title) + '" loading="lazy"></figure>');
      }
    }
    if (body) {
      parts.push('  <p class="dossie-body">' + escapeHtml(body) + '</p>');
    }
    parts.push('</article>');
    return parts.join("\n");
  }

  function serializeSiteConfigForSave() {
    return {
      key: "main",
      navigation: ((state.siteConfig && state.siteConfig.navigation) || []).map(function (item) {
        return {
          id: item.id,
          label: String(item.label || "").trim() || getDefaultSiteNavigationLabel(item.id)
        };
      }),
      filters: ((state.siteConfig && state.siteConfig.filters) || []).map(function (item) {
        return {
          id: item.id,
          label: String(item.label || "").trim(),
          summary: String(item.summary || "").trim(),
          description: String(item.description || "").trim()
        };
      }),
      labels: state.siteConfig && state.siteConfig.labels && typeof state.siteConfig.labels === "object"
        ? state.siteConfig.labels
        : {},
      page_content: state.siteConfig && state.siteConfig.page_content && typeof state.siteConfig.page_content === "object"
        ? state.siteConfig.page_content
        : {}
    };
  }

  function setSiteConfigFeedback(message, isError) {
    siteConfigFeedback.textContent = message || "";
    siteConfigFeedback.classList.toggle("is-error", Boolean(isError));
  }

  function handleTagUpdate() {
    var tag = state.selectedTagId ? getTagById(state.selectedTagId) : null;
    var nextLabel = String(tagManagerLabel.value || "").trim();
    var nextSlug = sanitizeSlug(nextLabel);

    if (!tag) {
      setTagManagerFeedback("Selecione uma tag para editar.", true);
      return;
    }

    if (!nextLabel || !nextSlug) {
      setTagManagerFeedback("Digite um nome válido para a tag.", true);
      return;
    }

    var duplicateTag = state.tags.find(function (item) {
      if (item.id === tag.id) return false;
      return item.slug === nextSlug || normalizeTitleKey(item.label) === normalizeTitleKey(nextLabel);
    });
    if (duplicateTag) {
      setTagManagerFeedback("Já existe outra tag com esse nome.", true);
      return;
    }

    setTagManagerFeedback("Salvando tag...", false);

    fetch(backend.url + "/rest/v1/tags?id=eq." + encodeURIComponent(tag.id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        slug: nextSlug,
        label: nextLabel,
        group_name: inferTagGroup(nextLabel)
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao atualizar tag");
          });
        }
        return response.json();
      })
      .then(function (items) {
        if (items && items.length) {
          replaceTag(items[0]);
        }
        renderTagResults();
        renderBatchTagResults();
        renderTagManager();
        setTagManagerFeedback("Tag atualizada.", false);
      })
      .catch(function (error) {
        setTagManagerFeedback("Não foi possível atualizar a tag: " + error.message, true);
      });
  }

  function handleTagDelete() {
    var tag = state.selectedTagId ? getTagById(state.selectedTagId) : null;
    if (!tag) {
      setTagManagerFeedback("Selecione uma tag para excluir.", true);
      return;
    }

    if (!window.confirm('Excluir a tag "' + tag.label + '"?')) {
      return;
    }

    setTagManagerFeedback("Excluindo tag...", false);

    fetch(backend.url + "/rest/v1/tags?id=eq." + encodeURIComponent(tag.id), {
      method: "DELETE",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao excluir tag");
          });
        }

        state.tags = state.tags.filter(function (item) {
          return item.id !== tag.id;
        });
        Object.keys(state.projectTagsByProject).forEach(function (projectId) {
          state.projectTagsByProject[projectId] = (state.projectTagsByProject[projectId] || []).filter(function (tagId) {
            return tagId !== tag.id;
          });
        });
        state.selectedTagId = null;
        renderTagResults();
        renderBatchTagResults();
        renderTagManager();
        setTagManagerFeedback("Tag excluída.", false);
      })
      .catch(function (error) {
        setTagManagerFeedback("Não foi possível excluir a tag: " + error.message, true);
      });
  }

  function setTagManagerFeedback(message, isError) {
    tagManagerFeedback.textContent = message || "";
    tagManagerFeedback.classList.toggle("is-error", Boolean(isError));
  }

  function handleBatchTagToggle(event) {
    var button = event.target.closest("[data-batch-tag-id]");
    if (!button) return;

    var tagId = button.getAttribute("data-batch-tag-id");
    var projectIds = state.selectedProjectIds.slice();
    if (!tagId || !projectIds.length) return;

    var coverage = getTagCoverageState(projectIds, tagId);

    if (coverage === "all") {
      removeTagFromProjects(projectIds, tagId);
      return;
    }

    addTagToProjects(projectIds, tagId)
      .then(function () {
        setSaveState("Tag aplicada em lote");
      })
      .catch(function () {
        setSaveState("Erro ao aplicar tag em lote");
      });
  }

  function handleCreateTag(event) {
    if (event && event.preventDefault) event.preventDefault();

    var project = getSelectedProject();
    var label = String(newTagLabel.value || "").trim();
    var slug = sanitizeSlug(label);
    if (!label || !slug) {
      setNewTagFeedback("Digite um nome válido para a nova tag.", true);
      return;
    }

    var existingTag = state.tags.find(function (tag) {
      return tag.slug === slug || normalizeTitleKey(tag.label) === normalizeTitleKey(label);
    });

    if (existingTag) {
      if (!project) {
        setNewTagFeedback("Essa tag já existe.", true);
        return;
      }

      addTagToProject(project.id, existingTag.id)
        .then(function () {
          newTagLabel.value = "";
          setNewTagFeedback("Essa tag já existia e foi marcada no projeto.", false);
        })
        .catch(function () {
          setNewTagFeedback("Não foi possível marcar a tag existente.", true);
        });
      return;
    }

    setNewTagFeedback("Criando tag...", false);

    fetch(backend.url + "/rest/v1/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        slug: slug,
        label: label,
        group_name: inferTagGroup(label),
        is_public: true
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao criar tag");
          });
        }
        return response.json();
      })
      .then(function (items) {
        if (items && items.length) {
          state.tags.push(items[0]);
          state.tags.sort(function (left, right) {
            return left.label.localeCompare(right.label);
          });
        }
        newTagLabel.value = "";
        renderTagResults();
        renderBatchTagResults();

        if (!project || !items || !items.length) {
          setNewTagFeedback("Tag criada com sucesso.", false);
          return;
        }

        return addTagToProject(project.id, items[0].id)
          .then(function () {
            setNewTagFeedback("Tag criada e marcada no projeto.", false);
          });
      })
      .catch(function (error) {
        setNewTagFeedback("Não foi possível criar a tag: " + error.message, true);
      });
  }

  function addTagToProject(projectId, tagId) {
    setSaveState("Marcando tag...");

    return fetch(backend.url + "/rest/v1/project_tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        project_id: projectId,
        tag_id: tagId
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao marcar tag");
          });
        }
        return response.json();
      })
      .then(function () {
        if (!state.projectTagsByProject[projectId]) {
          state.projectTagsByProject[projectId] = [];
        }
        if (state.projectTagsByProject[projectId].indexOf(tagId) === -1) {
          state.projectTagsByProject[projectId].push(tagId);
        }
        renderTagResults();
        renderBatchTagResults();
      });
  }

  function removeTagFromProject(projectId, tagId) {
    setSaveState("Removendo tag...");

    fetch(backend.url + "/rest/v1/project_tags?project_id=eq." + encodeURIComponent(projectId) + "&tag_id=eq." + encodeURIComponent(tagId), {
      method: "DELETE",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao remover tag");
          });
        }
        state.projectTagsByProject[projectId] = (state.projectTagsByProject[projectId] || []).filter(function (id) {
          return id !== tagId;
        });
        renderTagResults();
        renderBatchTagResults();
        setSaveState("Tag removida");
      })
      .catch(function () {
        setSaveState("Erro ao remover tag");
      });
  }

  function addTagToProjects(projectIds, tagId) {
    setSaveState("Aplicando tag em lote...");

    var payload = projectIds.map(function (projectId) {
      return {
        project_id: projectId,
        tag_id: tagId
      };
    });

    return fetch(backend.url + "/rest/v1/project_tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payloadResponse) {
            throw new Error(payloadResponse.message || payloadResponse.msg || "falha ao aplicar tag em lote");
          });
        }
        return response.json();
      })
      .then(function () {
        projectIds.forEach(function (projectId) {
          if (!state.projectTagsByProject[projectId]) {
            state.projectTagsByProject[projectId] = [];
          }
          if (state.projectTagsByProject[projectId].indexOf(tagId) === -1) {
            state.projectTagsByProject[projectId].push(tagId);
          }
        });
        renderTagResults();
        renderBatchTagResults();
        setBatchFeedback("Tag aplicada aos projetos selecionados.", false);
      });
  }

  function removeTagFromProjects(projectIds, tagId) {
    setSaveState("Removendo tag em lote...");

    fetch(backend.url + "/rest/v1/project_tags?project_id=" + buildInFilter(projectIds) + "&tag_id=eq." + encodeURIComponent(tagId), {
      method: "DELETE",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payloadResponse) {
            throw new Error(payloadResponse.message || payloadResponse.msg || "falha ao remover tag em lote");
          });
        }

        projectIds.forEach(function (projectId) {
          state.projectTagsByProject[projectId] = (state.projectTagsByProject[projectId] || []).filter(function (id) {
            return id !== tagId;
          });
        });

        renderTagResults();
        renderBatchTagResults();
        setBatchFeedback("Tag removida dos projetos selecionados.", false);
        setSaveState("Tag removida em lote");
      })
      .catch(function () {
        setBatchFeedback("Não foi possível remover a tag em lote.", true);
        setSaveState("Erro ao remover tag em lote");
      });
  }

  function renderPairResults() {
    var project = getSelectedProject();
    var query = String(pairSearch.value || "").trim().toLowerCase();

    if (!project) {
      pairSearch.disabled = true;
      pairConnectButton.disabled = true;
      pairResults.innerHTML = "";
      pairList.innerHTML = "";
      renderPairSelectionPreview();
      return;
    }

    pairSearch.disabled = false;
    pairConnectButton.disabled = !state.pendingPairIds.length;

    if (!query) {
      pairResults.innerHTML = "";
      renderPairSelectionPreview();
      return;
    }

    var connectedIds = getConnectedProjectIds(project.id);
    var matches = state.projects.filter(function (candidate) {
      if (candidate.id === project.id) return false;
      if (connectedIds.indexOf(candidate.id) !== -1) return false;

      var haystack = [
        candidate.title,
        candidate.slug,
        candidate.client,
        candidate.project_type
      ].join(" ").toLowerCase();

      return haystack.indexOf(query) !== -1;
    }).slice(0, 20);

    if (!matches.length) {
      pairResults.innerHTML = '<p class="admin-inline-empty">Nenhum projeto encontrado.</p>';
      renderPairSelectionPreview();
      return;
    }

    pairResults.innerHTML = matches.map(function (candidate) {
      var isSelected = state.pendingPairIds.indexOf(candidate.id) !== -1;
      return '' +
        '<button class="admin-pair-result' + (isSelected ? ' is-active' : '') + '" type="button" data-toggle-pair-candidate="' + escapeHtml(candidate.id) + '">' +
          '<strong>' + escapeHtml(candidate.title) + '</strong>' +
          '<span>' + escapeHtml(formatPublisherLabel(candidate.client || "Sem editora")) + '</span>' +
          '<span>' + escapeHtml(formatProjectTypeLabel(candidate.project_type)) + '</span>' +
        '</button>';
    }).join("");

    renderPairSelectionPreview();
  }

  function renderPairList() {
    var project = getSelectedProject();
    if (!project) {
      pairList.innerHTML = "";
      return;
    }

    var items = state.pairs
      .filter(function (pair) {
        return pair.project_id === project.id;
      })
      .map(function (pair) {
        var pairedProject = getProjectById(pair.paired_project_id);
        if (!pairedProject) return null;

        return '' +
          '<div class="admin-pair-item">' +
            '<div>' +
              '<div class="admin-pair-title">' + escapeHtml(pairedProject.title) + '</div>' +
              '<div class="admin-pair-meta">' + escapeHtml(formatPublisherLabel(pairedProject.client || "Sem editora")) + ' • ' + escapeHtml(formatProjectTypeLabel(pairedProject.project_type)) + '</div>' +
            '</div>' +
            '<button class="admin-danger-button" type="button" data-remove-pair="' + escapeHtml(pair.id) + '" data-paired-project-id="' + escapeHtml(pairedProject.id) + '">Remover</button>' +
          '</div>';
      })
      .filter(Boolean);

    if (!items.length) {
      pairList.innerHTML = '<p class="admin-inline-empty">Nenhum par conectado a este projeto.</p>';
      return;
    }

    pairList.innerHTML = items.join("");
  }

  function renderPairSelectionPreview() {
    var project = getSelectedProject();
    var pendingProjects = state.pendingPairIds
      .map(function (projectId) { return getProjectById(projectId); })
      .filter(Boolean);

    if (!project) {
      pairSelectionPreview.innerHTML = "";
      pairConnectButton.disabled = true;
      return;
    }

    pairConnectButton.disabled = !pendingProjects.length;

    if (!pendingProjects.length) {
      pairSelectionPreview.innerHTML = '<p class="admin-inline-empty">Nenhum projeto selecionado para conectar.</p>';
      return;
    }

    pairSelectionPreview.innerHTML = pendingProjects.map(function (candidate) {
      return '<span class="admin-selection-chip">' + escapeHtml(candidate.title) + '</span>';
    }).join("");
  }

  function handlePairCandidateToggle(event) {
    var button = event.target.closest("[data-toggle-pair-candidate]");
    if (!button) return;

    var project = getSelectedProject();
    var pairedProjectId = button.getAttribute("data-toggle-pair-candidate");
    if (!project || !pairedProjectId) return;

    var index = state.pendingPairIds.indexOf(pairedProjectId);
    if (index >= 0) {
      state.pendingPairIds.splice(index, 1);
    } else {
      state.pendingPairIds.push(pairedProjectId);
    }

    renderPairResults();
    renderPairSelectionPreview();
  }

  function handleAddPairs() {
    var project = getSelectedProject();
    var pendingIds = state.pendingPairIds.slice();
    if (!project || !pendingIds.length) return;

    var missingIds = pendingIds.filter(function (pairedProjectId) {
      return !hasPair(project.id, pairedProjectId);
    });

    if (!missingIds.length) {
      setSaveState("Os pares selecionados já existem");
      state.pendingPairIds = [];
      renderPairResults();
      renderPairSelectionPreview();
      return;
    }

    setSaveState("Adicionando pares...");

    var payload = [];
    missingIds.forEach(function (pairedProjectId) {
      payload.push({
        project_id: project.id,
        paired_project_id: pairedProjectId,
        pair_type: "pair"
      });
      payload.push({
        project_id: pairedProjectId,
        paired_project_id: project.id,
        pair_type: "pair"
      });
    });

    fetch(backend.url + "/rest/v1/project_pairs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao adicionar pares");
          });
        }
        return response.json();
      })
      .then(function (items) {
        mergePairs(items || []);
        state.pendingPairIds = [];
        pairSearch.value = "";
        renderPairResults();
        renderPairSelectionPreview();
        renderPairList();
        setSaveState(missingIds.length === 1 ? "Par adicionado" : "Pares adicionados");
      })
      .catch(function () {
        setSaveState("Erro ao adicionar pares");
      });
  }

  function handlePairRemoval(event) {
    var button = event.target.closest("[data-remove-pair]");
    if (!button) return;

    var pairId = button.getAttribute("data-remove-pair");
    var pairedProjectId = button.getAttribute("data-paired-project-id");
    var project = getSelectedProject();
    if (!pairId || !pairedProjectId || !project) return;

    var mirroredPair = state.pairs.find(function (pair) {
      return pair.project_id === pairedProjectId &&
        pair.paired_project_id === project.id &&
        pair.pair_type === "pair";
    });

    setSaveState("Removendo par...");

    Promise.all([
      deletePairById(pairId),
      mirroredPair ? deletePairById(mirroredPair.id) : Promise.resolve()
    ])
      .then(function () {
        state.pairs = state.pairs.filter(function (pair) {
          return pair.id !== pairId && (!mirroredPair || pair.id !== mirroredPair.id);
        });
        renderPairResults();
        renderPairList();
        setSaveState("Par removido");
      })
      .catch(function () {
        setSaveState("Erro ao remover par");
      });
  }

  function handleMediaUpload(event) {
    if (event && event.preventDefault) event.preventDefault();

    var project = getSelectedProject();
    var files = mediaFiles.files;
    if (!project || !files || !files.length) {
      setSaveState("Selecione ao menos uma imagem");
      return;
    }

    var currentImages = state.imagesByProject[project.id] || [];
    var uploads = [];
    var invalidFiles = [];

    Array.prototype.forEach.call(files, function (file) {
      var parsed = parseIncomingFilename(file.name);
      if (!parsed || parsed.slug !== project.slug) {
        invalidFiles.push(file.name);
        return;
      }

      uploads.push(overwritePreparedImage(project, currentImages, file, parsed.kind, parsed.sortOrder));
    });

    if (!uploads.length) {
      setSaveState("Os arquivos precisam seguir o nome do projeto, como " + project.slug + "_thumb.jpg ou " + project.slug + "_03.jpg");
      return;
    }

    setSaveState("Enviando imagens...");

    Promise.all(uploads)
      .then(function () {
        mediaFiles.value = "";
        if (invalidFiles.length) {
          setSaveState("Imagens enviadas. Ignoradas: " + invalidFiles.join(", "));
        } else {
          setSaveState("Imagens enviadas");
        }
        loadProjectImages(project.id);
      })
      .catch(function () {
        setSaveState("Erro ao enviar mídia");
      });
  }

  function createProjectsFromGroups(groups) {
    var payload = groups.map(function (group) {
      return {
        slug: group.slug,
        title: buildProvisionalTitle(group.slug),
        status: "draft",
        publication_notes: "Projeto criado por upload inicial. Ajustar titulo final, tipo e editora antes de publicar."
      };
    });

    return fetch(backend.url + "/rest/v1/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payloadResponse) {
            throw new Error(payloadResponse.message || payloadResponse.msg || "falha ao criar projetos do upload");
          });
        }
        return response.json();
      });
  }

  function findGroupBySlug(groups, slug) {
    for (var i = 0; i < groups.length; i += 1) {
      if (groups[i].slug === slug) return groups[i];
    }
    return null;
  }

  function groupIncomingFiles(fileList) {
    var groupsBySlug = {};
    var invalidGroups = [];

    Array.prototype.forEach.call(fileList, function (file) {
      var parsed = parseIncomingFilename(file.name);
      if (!parsed) {
        invalidGroups.push(file.name);
        return;
      }

      if (!groupsBySlug[parsed.slug]) {
        groupsBySlug[parsed.slug] = {
          slug: parsed.slug,
          files: []
        };
      }

      groupsBySlug[parsed.slug].files.push({
        file: file,
        kind: parsed.kind,
        sortOrder: parsed.sortOrder
      });
    });

    var items = Object.keys(groupsBySlug)
      .sort()
      .map(function (slug) {
        var group = groupsBySlug[slug];
        group.files.sort(function (left, right) {
          if (left.kind !== right.kind) return left.kind === "thumb" ? -1 : 1;
          return left.sortOrder - right.sortOrder;
        });
        return group;
      });

    return {
      items: items,
      invalidGroups: invalidGroups
    };
  }

  function parseIncomingFilename(filename) {
    var safeName = String(filename || "").trim();
    var extensionless = safeName.replace(/\.[^.]+$/, "");
    var match = extensionless.match(/^(.*?)[-_](thumb|o?\d{1,2})$/i);
    if (!match) return null;

    var rawBase = match[1];
    var rawSuffix = String(match[2] || "").toLowerCase();
    var slug = sanitizeSlug(rawBase);
    if (!slug) return null;

    if (rawSuffix === "thumb") {
      return {
        slug: slug,
        kind: "thumb",
        sortOrder: 0
      };
    }

    var imageNumber = Number(rawSuffix.replace(/^o/i, ""));
    if (!imageNumber || imageNumber < 1) return null;

    return {
      slug: slug,
      kind: "gallery",
      sortOrder: imageNumber - 1
    };
  }

  function buildProvisionalTitle(slug) {
    return String(slug || "")
      .split(/[-_]+/)
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function inferTagGroup(label) {
    var value = normalizeTitleKey(label);
    var colorTerms = {
      amarelo: true,
      azul: true,
      bege: true,
      branco: true,
      cinza: true,
      dourado: true,
      laranja: true,
      marrom: true,
      preto: true,
      rosa: true,
      roxo: true,
      verde: true,
      vermelho: true
    };

    return colorTerms[value] ? "cor" : "tema";
  }

  function formatProjectTypeLabel(value) {
    var normalized = normalizeProjectType(value);

    if (normalized === "livro") return "Livro";
    if (normalized === "hq") return "HQ";
    if (normalized === "revista") return "Revista";
    if (normalized === "especial") return "Projeto especial";
    if (normalized === "outros") return "Outros";
    return normalized || "Sem tipo";
  }

  function formatPublisherLabel(value) {
    var normalized = String(value || "").trim();
    var lower = normalized.toLowerCase();

    if (!normalized) return "";
    if (lower === "intrinseca") return "Intrínseca";
    if (lower === "permanencia") return "Permanência";
    if (/[A-ZÀ-Ý]/.test(normalized)) return normalized;

    return normalized.split(/\s+/).map(function (part, index) {
      var word = String(part || "").toLowerCase();
      if (index > 0 && ["de", "da", "do", "das", "dos", "e"].indexOf(word) !== -1) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function normalizeProjectType(value) {
    var normalized = String(value || "").trim();
    var folded = normalized.toLowerCase();

    if (!folded) return "";
    if (folded === "hq") return "hq";
    if (folded === "livro" || folded === "livros") return "livro";
    if (folded === "revista" || folded === "revistas") return "revista";
    if (folded === "especial" || folded === "projeto especial" || folded === "projetos especiais") return "especial";
    if (folded === "outro" || folded === "outros") return "outros";

    return normalized;
  }

  function normalizeTitleKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizeSearchText(value) {
    return normalizeTitleKey(value).replace(/\s+/g, " ");
  }

  function getProjectInitial(project) {
    var source = normalizeSearchText(project && (project.title || project.slug));
    var match = source.match(/[a-z0-9]/);
    if (!match) return "#";
    if (/\d/.test(match[0])) return "#";
    return match[0].toUpperCase();
  }

  function uploadPreparedImage(project, file, kind, sortOrder) {
    var nextPath = project.slug + "/" + sanitizeFilename(file.name);

    return fetch(backend.url + "/storage/v1/object/project-media/" + encodeStoragePath(nextPath), {
      method: "POST",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token,
        "x-upsert": "false",
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha no upload inicial");
          });
        }
      })
      .then(function () {
        return fetch(backend.url + "/rest/v1/project_images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
            apikey: backend.anonKey,
            Authorization: "Bearer " + state.token
          },
          body: JSON.stringify({
            project_id: project.id,
            storage_path: nextPath,
            kind: kind,
            alt_text: null,
            sort_order: sortOrder,
            is_published: true
          })
        });
      })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao registrar imagem inicial");
          });
        }
        return response.json();
      })
      .then(function (items) {
        if (!items || !items.length) return;
        if (!state.imagesByProject[project.id]) {
          state.imagesByProject[project.id] = [];
        }
        state.imagesByProject[project.id].push(items[0]);
        state.imagesByProject[project.id] = sortProjectImages(state.imagesByProject[project.id]);
      });
  }

  function overwriteProjectMedia(project, group) {
    return loadProjectImagesSnapshot(project.id)
      .then(function (images) {
        var jobs = group.files.map(function (entry) {
          return overwritePreparedImage(project, images, entry.file, entry.kind, entry.sortOrder);
        });
        return Promise.all(jobs).then(function () {
          return project;
        });
      });
  }

  function loadProjectImagesSnapshot(projectId) {
    if (state.imagesByProject[projectId]) {
      return Promise.resolve(state.imagesByProject[projectId]);
    }

    return fetch(backend.url + "/rest/v1/project_images?select=id,project_id,storage_path,kind,alt_text,sort_order,is_published,created_at&project_id=eq." + encodeURIComponent(projectId) + "&order=sort_order.asc,created_at.asc", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao carregar imagens existentes");
          });
        }
        return response.json();
      })
      .then(function (images) {
        state.imagesByProject[projectId] = images || [];
        return state.imagesByProject[projectId];
      });
  }

  function overwritePreparedImage(project, currentImages, file, kind, sortOrder) {
    var nextPath = project.slug + "/" + sanitizeFilename(file.name);
    var existingImage = (currentImages || []).find(function (image) {
      return image.kind === kind && Number(image.sort_order) === Number(sortOrder);
    });

    return fetch(backend.url + "/storage/v1/object/project-media/" + encodeStoragePath(nextPath), {
      method: "POST",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token,
        "x-upsert": "true",
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao sobrescrever arquivo");
          });
        }

        if (!existingImage) {
          return fetch(backend.url + "/rest/v1/project_images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=representation",
              apikey: backend.anonKey,
              Authorization: "Bearer " + state.token
            },
            body: JSON.stringify({
              project_id: project.id,
              storage_path: nextPath,
              kind: kind,
              alt_text: null,
              sort_order: sortOrder,
              is_published: true
            })
          });
        }

        return fetch(backend.url + "/rest/v1/project_images?id=eq." + encodeURIComponent(existingImage.id), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
            apikey: backend.anonKey,
            Authorization: "Bearer " + state.token
          },
          body: JSON.stringify({
            storage_path: nextPath,
            kind: kind,
            sort_order: sortOrder
          })
        }).then(function (response) {
          if (existingImage.storage_path && existingImage.storage_path !== nextPath) {
            fetch(backend.url + "/storage/v1/object/project-media/" + encodeStoragePath(existingImage.storage_path), {
              method: "DELETE",
              headers: {
                apikey: backend.anonKey,
                Authorization: "Bearer " + state.token
              }
            }).catch(function () {});
          }
          return response;
        });
      })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao atualizar registro da imagem");
          });
        }
        return response.json();
      })
      .then(function (items) {
        if (!items || !items.length) return;
        var storedImage = items[0];
        if (!state.imagesByProject[project.id]) {
          state.imagesByProject[project.id] = [];
        }
        var replaced = false;
        state.imagesByProject[project.id] = state.imagesByProject[project.id].map(function (image) {
          if (image.id === storedImage.id) {
            replaced = true;
            return storedImage;
          }
          return image;
        });
        if (!replaced) {
          state.imagesByProject[project.id].push(storedImage);
        }
        state.imagesByProject[project.id] = sortProjectImages(state.imagesByProject[project.id]);
      });
  }

  function handleMediaListClick(event) {
    var removeButton = event.target.closest("[data-remove-media]");
    if (removeButton) {
      handleMediaRemoval(removeButton.getAttribute("data-remove-media"));
    }
  }

  function handleMediaRemoval(imageId) {
    var project = getSelectedProject();
    var image = getProjectImageById(project && project.id, imageId);
    if (!project || !image) return;

    setSaveState("Removendo mídia...");

    deleteStorageObject(image.storage_path)
      .then(function (response) {
        return fetch(backend.url + "/rest/v1/project_images?id=eq." + encodeURIComponent(imageId), {
          method: "DELETE",
          headers: {
            apikey: backend.anonKey,
            Authorization: "Bearer " + state.token
          }
        });
      })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao remover registro");
          });
        }
        removeProjectImage(project.id, imageId);
        renderMediaList();
        syncPublicationChecklist(project);
        setSaveState("Midia removida");
      })
      .catch(function () {
        setSaveState("Erro ao remover mídia");
      });
  }

  function deleteStorageObject(storagePath) {
    return fetch(backend.url + "/storage/v1/object/project-media/" + encodeStoragePath(storagePath), {
      method: "DELETE",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (response.ok || response.status === 404) return response;
        return response.json().then(function (payload) {
          throw new Error(payload.message || payload.msg || "falha ao remover arquivo");
        });
      });
  }

  function replaceProject(project) {
    for (var i = 0; i < state.projects.length; i += 1) {
      if (state.projects[i].id === project.id) {
        state.projects[i] = project;
        return;
      }
    }
  }

  function replaceProjectImage(projectId, image) {
    var images = state.imagesByProject[projectId] || [];
    for (var i = 0; i < images.length; i += 1) {
      if (images[i].id === image.id) {
        images[i] = image;
        state.imagesByProject[projectId] = sortProjectImages(images);
        return;
      }
    }
  }

  function removeProjectImage(projectId, imageId) {
    var images = state.imagesByProject[projectId] || [];
    state.imagesByProject[projectId] = images.filter(function (image) {
      return image.id !== imageId;
    });
  }

  function deletePairById(pairId) {
    return fetch(backend.url + "/rest/v1/project_pairs?id=eq." + encodeURIComponent(pairId), {
      method: "DELETE",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    }).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (payload) {
          throw new Error(payload.message || payload.msg || "falha ao remover par");
        });
      }
    });
  }

  function setAuthFeedback(message, isError) {
    authFeedback.textContent = message;
    authFeedback.classList.toggle("is-error", Boolean(isError));
  }

  function setBulkImportFeedback(message, isError) {
    if (!bulkImportFeedback) return;
    bulkImportFeedback.textContent = message;
    bulkImportFeedback.classList.toggle("is-error", Boolean(isError));
  }

  function setBatchFeedback(message, isError) {
    if (!batchFeedback) return;
    batchFeedback.textContent = message;
    batchFeedback.classList.toggle("is-error", Boolean(isError));
  }

  function renderIntakeReport(report) {
    if (!intakeReport) return;
    if (!report) {
      setHidden(intakeReport, true);
      intakeReport.innerHTML = "";
      return;
    }

    var blocks = [];

    if (report.createdProjects && report.createdProjects.length) {
      blocks.push(renderIntakeReportGroup("Projetos criados", report.createdProjects, "is-created"));
    }

    if (report.overwrittenProjects && report.overwrittenProjects.length) {
      blocks.push(renderIntakeReportGroup("Projetos atualizados", report.overwrittenProjects, "is-created"));
    }

    if (report.duplicateIdentifiers && report.duplicateIdentifiers.length) {
      blocks.push(renderIntakeReportGroup("Ja existentes", report.duplicateIdentifiers, "is-warning"));
    }

    if (report.duplicateTitles && report.duplicateTitles.length) {
      blocks.push(renderIntakeReportGroup("Títulos repetidos ou muito próximos", report.duplicateTitles, "is-warning"));
    }

    if (report.invalidFiles && report.invalidFiles.length) {
      blocks.push(renderIntakeReportGroup("Arquivos fora do padrao", report.invalidFiles, "is-error"));
    }

    setHidden(intakeReport, !blocks.length);
    intakeReport.innerHTML = blocks.join("");
  }

  function renderIntakeReportGroup(title, items, modifierClass) {
    return '' +
      '<section class="admin-intake-report-group ' + modifierClass + '">' +
        '<h3>' + escapeHtml(title) + '</h3>' +
        '<ul>' +
          items.map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
          }).join("") +
        '</ul>' +
      '</section>';
  }

  function setNewTagFeedback(message, isError) {
    newTagFeedback.textContent = message;
    newTagFeedback.classList.toggle("is-error", Boolean(isError));
  }

  function setSaveState(message) {
    saveState.textContent = message;
  }

  function renderEditorTabs() {
    var activeSection = state.editorSection || "details";

    editorTabs.forEach(function (button) {
      var isActive = button.getAttribute("data-editor-tab") === activeSection;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    editorSections.forEach(function (section) {
      var isActive = section.getAttribute("data-editor-section") === activeSection;
      section.classList.toggle("is-active", isActive);
      setHidden(section, !isActive);
    });
  }

  function updatePublicationPanel(project) {
    if (!project) {
      publicationPill.textContent = "Rascunho";
      publicationPill.dataset.status = "draft";
      publicationState.textContent = "Rascunho";
      publicationDate.textContent = "Não definido";
      fieldFeatured.checked = false;
      fieldFeatured.disabled = true;
      flagReviewText.checked = false;
      flagFutureFeature.checked = false;
      flagReviewText.disabled = true;
      flagFutureFeature.disabled = true;
      checklistSummary.innerHTML = "";
      checklistList.innerHTML = "";
      flagSummary.innerHTML = "";
      return;
    }

    var status = String(project.status || "draft");
    publicationPill.textContent = formatStatusLabel(status);
    publicationPill.dataset.status = status;
    publicationState.textContent = formatStatusLabel(status);
    publicationDate.textContent = project.sort_year ? String(project.sort_year) : "Não definido";
    fieldFeatured.checked = Boolean(project.is_featured);
    fieldFeatured.disabled = false;
    flagReviewText.disabled = false;
    flagFutureFeature.disabled = false;
    syncPublicationChecklist(project);
  }

  function syncEditorialFlagsPanel(projectId) {
    flagReviewText.checked = hasEditorialFlag(projectId, "review_text");
    flagFutureFeature.checked = hasEditorialFlag(projectId, "future_feature");
    flagSummary.innerHTML = renderEditorialFlagSummary(projectId);
  }

  function syncPublicationChecklist(project) {
    var checks = getPublicationChecks(project);
    var readyCount = checks.filter(function (item) { return item.ok; }).length;

    checklistSummary.innerHTML = '<span class="admin-status-pill">' + readyCount + '/' + checks.length + ' itens</span>';
    checklistList.innerHTML = checks.map(function (item) {
      return '' +
        '<div class="admin-check-item ' + (item.ok ? 'is-ok' : 'is-missing') + '">' +
          '<strong>' + escapeHtml(item.label) + '</strong>' +
          '<span class="admin-check-badge ' + (item.ok ? 'is-ok' : 'is-missing') + '">' + (item.ok ? 'ok' : 'falta') + '</span>' +
        '</div>';
    }).join("");
  }

  function getPublicationChecks(project) {
    return [
      {
        label: "Título principal",
        ok: Boolean(String(project.title || "").trim()),
        help: "O projeto pode ser publicado com o título principal definido."
      },
      {
        label: "Editora",
        ok: Boolean(String(project.client || "").trim()),
        help: "Ajuda a localizar e filtrar o projeto depois."
      },
      {
        label: "Tipo",
        ok: Boolean(String(project.project_type || "").trim()),
        help: "Livro, revista, HQ ou outra classificação básica."
      },
      {
        label: "Ano",
        ok: typeof project.sort_year === "number" && project.sort_year >= 1000,
        help: "Use apenas o ano com quatro dígitos."
      }
    ];
  }

  function handleEditorialFlagChange(event) {
    var project = getSelectedProject();
    if (!project) return;

    var input = event.target;
    var flagKey = input.id === "flag-review-text" ? "review_text" : "future_feature";
    var flagLabel = flagKey === "review_text" ? "Revisar texto" : "Destaque futuro";

    setSaveState("Atualizando flag...");

    if (input.checked) {
      upsertEditorialFlag(project.id, flagKey, flagLabel)
        .then(function (item) {
          if (!state.editorialFlagsByProject[project.id]) {
            state.editorialFlagsByProject[project.id] = [];
          }
          if (!hasEditorialFlag(project.id, flagKey)) {
            state.editorialFlagsByProject[project.id].push(item);
          }
          syncEditorialFlagsPanel(project.id);
          renderProjectList();
          setSaveState("Flag atualizada");
        })
        .catch(function () {
          input.checked = false;
          setSaveState("Erro ao atualizar flag");
        });
      return;
    }

    deleteEditorialFlag(project.id, flagKey)
      .then(function () {
        state.editorialFlagsByProject[project.id] = (state.editorialFlagsByProject[project.id] || []).filter(function (flag) {
          return flag.flag_key !== flagKey;
        });
        syncEditorialFlagsPanel(project.id);
        renderProjectList();
        setSaveState("Flag removida");
      })
      .catch(function () {
        input.checked = true;
        setSaveState("Erro ao remover flag");
      });
  }

  function hasPair(projectId, pairedProjectId) {
    return state.pairs.some(function (pair) {
      return pair.project_id === projectId && pair.paired_project_id === pairedProjectId;
    });
  }

  function getConnectedProjectIds(projectId) {
    return state.pairs
      .filter(function (pair) {
        return pair.project_id === projectId;
      })
      .map(function (pair) {
        return pair.paired_project_id;
      });
  }

  function getProjectById(projectId) {
    for (var i = 0; i < state.projects.length; i += 1) {
      if (state.projects[i].id === projectId) {
        return state.projects[i];
      }
    }
    return null;
  }

  function getTagById(tagId) {
    for (var i = 0; i < state.tags.length; i += 1) {
      if (state.tags[i].id === tagId) {
        return state.tags[i];
      }
    }
    return null;
  }

  function replaceTag(tag) {
    var replaced = false;

    state.tags = state.tags.map(function (item) {
      if (item.id === tag.id) {
        replaced = true;
        return tag;
      }
      return item;
    });

    if (!replaced) {
      state.tags.push(tag);
    }

    state.tags.sort(function (left, right) {
      return String(left.label || "").localeCompare(String(right.label || ""), "pt-BR");
    });
  }

  function mergePairs(nextPairs) {
    (nextPairs || []).forEach(function (pair) {
      var exists = state.pairs.some(function (item) {
        return item.id === pair.id;
      });
      if (!exists) {
        state.pairs.push(pair);
      }
    });
  }

  function hasEditorialFlag(projectId, flagKey) {
    return (state.editorialFlagsByProject[projectId] || []).some(function (flag) {
      return flag.flag_key === flagKey;
    });
  }

  function renderProjectFlagPills(projectId) {
    var pills = [];

    if (hasEditorialFlag(projectId, "review_text")) {
      pills.push('<span class="admin-status-pill is-review-flag">Texto</span>');
    } else {
      pills.push('<span class="admin-status-pill is-approved-flag">Ok</span>');
    }

    if (hasEditorialFlag(projectId, "future_feature")) {
      pills.push('<span class="admin-status-pill is-future-flag">Futuro</span>');
    }

    var project = getProjectById(projectId);
    if (project && project.is_featured) {
      pills.push('<span class="admin-status-pill">Site</span>');
    }

    return pills.join("");
  }

  function renderEditorialFlagSummary(projectId) {
    var pills = [];

    if (hasEditorialFlag(projectId, "review_text")) {
      pills.push('<span class="admin-status-pill is-review-flag">Texto em revisão</span>');
    } else {
      pills.push('<span class="admin-status-pill is-approved-flag">Texto aprovado</span>');
    }

    if (hasEditorialFlag(projectId, "future_feature")) {
      pills.push('<span class="admin-status-pill is-future-flag">Destaque futuro</span>');
    }

    var project = getProjectById(projectId);
    if (project && project.is_featured) {
      pills.push('<span class="admin-status-pill">Destaque no site</span>');
    }

    return pills.join("");
  }

  function upsertEditorialFlag(projectId, flagKey, flagLabel) {
    return fetch(backend.url + "/rest/v1/project_editorial_flags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        project_id: projectId,
        flag_key: flagKey,
        flag_label: flagLabel,
        is_public: false
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao salvar flag");
          });
        }
        return response.json();
      })
      .then(function (items) {
        return items && items.length ? items[0] : {
          project_id: projectId,
          flag_key: flagKey,
          flag_label: flagLabel,
          is_public: false
        };
      });
  }

  function deleteEditorialFlag(projectId, flagKey) {
    return fetch(backend.url + "/rest/v1/project_editorial_flags?project_id=eq." + encodeURIComponent(projectId) + "&flag_key=eq." + encodeURIComponent(flagKey), {
      method: "DELETE",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    }).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (payload) {
          throw new Error(payload.message || payload.msg || "falha ao remover flag");
        });
      }
    });
  }

  function getProjectImageById(projectId, imageId) {
    var images = state.imagesByProject[projectId] || [];
    for (var i = 0; i < images.length; i += 1) {
      if (images[i].id === imageId) {
        return images[i];
      }
    }
    return null;
  }

  function sortProjectImages(images) {
    return images.slice().sort(function (left, right) {
      if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order;
      return String(left.created_at || "").localeCompare(String(right.created_at || ""));
    });
  }

  function buildPublicMediaUrl(storagePath) {
    var path = String(storagePath || "").trim();
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (/^(assets|textos)\//i.test(path)) return path;
    if (path.charAt(0) === "/") return path;
    return backend.url + "/storage/v1/object/public/project-media/" + encodeStoragePath(path);
  }

  function encodeStoragePath(storagePath) {
    return String(storagePath || "")
      .split("/")
      .map(function (part) { return encodeURIComponent(part); })
      .join("/");
  }

  function buildInFilter(values) {
    return "in.(" + values.map(function (value) {
      return encodeURIComponent(String(value || ""));
    }).join(",") + ")";
  }

  function sanitizeFilename(value) {
    return String(value || "arquivo")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, "-")
      .replace(/-{2,}/g, "-");
  }

  function resolvePublishedAt(project, nextStatus) {
    if (nextStatus === "published") {
      return project.published_at || new Date().toISOString();
    }
    return null;
  }

  function formatStatusLabel(status) {
    if (status === "review") return "Em revisão";
    if (status === "published") return "Publicado";
    if (status === "archived") return "Arquivado";
    return "Rascunho";
  }

  function formatDateTime(value) {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
  }

  function sanitizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-_]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();

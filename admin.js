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
  var batchCheckReadinessButton = document.getElementById("batch-check-readiness-button");
  var batchConvertDraftsButton = document.getElementById("batch-convert-drafts-button");
  var batchReadinessResults = document.getElementById("batch-readiness-results");
  var batchTagSearch = document.getElementById("batch-tag-search");
  var batchTagResults = document.getElementById("batch-tag-results");
  var batchServicoResults = document.getElementById("batch-servico-results");
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

  // Quill: lazy init — inicializar só quando o container já está visível,
  // pois pickers do Quill 1.x falham quando inicializados dentro de display:none.
  var quillPage = null;
  var quillDesc = null;
  var quillDossie = null;

  function initQuillPage() {
    if (quillPage) return quillPage;
    quillPage = new Quill("#site-page-quill", { modules: { toolbar: QUILL_TOOLBAR }, theme: "snow" });
    quillPage.on("text-change", handlePageContentInput);
    return quillPage;
  }
  function initQuillDesc() {
    if (quillDesc) return quillDesc;
    quillDesc = new Quill("#field-description-quill", { modules: { toolbar: QUILL_TOOLBAR }, theme: "snow" });
    return quillDesc;
  }
  function initQuillDossie() {
    if (quillDossie) return quillDossie;
    quillDossie = new Quill("#dossie-quill-editor", { modules: { toolbar: QUILL_TOOLBAR }, theme: "snow" });
    return quillDossie;
  }
  var siteConfigFeedback = document.getElementById("site-config-feedback");

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
    activeSitePageId: "inicio",
    editingDossie: null,
    albumPhotos: [],
    dossieLang: "pt",
    dossieLangTitulo: { pt: "", en: "", es: "" },
    dossieLangContent: { pt: "", en: "", es: "" }
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
  batchServicoResults.addEventListener("click", handleBatchServicoToggle);
  batchPublisherResults.addEventListener("click", handleBatchPublisherChipClick);
  batchSelectVisibleButton.addEventListener("click", handleSelectVisibleProjects);
  batchClearSelectionButton.addEventListener("click", clearBatchSelection);
  batchCheckReadinessButton.addEventListener("click", handleCheckReadiness);
  batchConvertDraftsButton.addEventListener("click", handleConvertIncompleteToDraft);
  batchApplyPublisherButton.addEventListener("click", handleBatchPublisherApply);
  batchClearPublisherButton.addEventListener("click", handleBatchPublisherClear);
  if (flagReviewText) flagReviewText.addEventListener("change", handleEditorialFlagChange);
  if (flagFutureFeature) flagFutureFeature.addEventListener("change", handleEditorialFlagChange);
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

  setupDossieWorkspace();

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
      if (flagSummary) flagSummary.innerHTML = "";
      state.siteConfig = createDefaultSiteConfig();
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

    if (state.workspace === "album") {
      initAlbumWorkspace();
    }
  }

  function renderDossieWorkspace() {
    var container = document.getElementById("dossie-list-container");
    if (!container) return;
    var dossies = state.dossies || [];
    if (!dossies.length) {
      container.innerHTML = '<p class="admin-copy" style="color:var(--admin-muted);">Nenhum dossiê cadastrado.</p>';
      return;
    }
    var items = dossies.map(function(d) {
      var project = (state.projects || []).find(function(p) { return p.id === d.projeto_id; });
      var projectLabel = project
        ? escapeHtml(project.title || project.slug)
        : '<em style="color:var(--admin-muted);">Sem projeto vinculado</em>';
      return '<div class="admin-site-filter-card">' +
        '<div class="admin-site-filter-head">' +
          '<div><h4>' + escapeHtml(d.titulo) + '</h4>' +
          '<p style="margin:4px 0 0;font-size:13px;color:var(--admin-muted);">' + projectLabel + '</p></div>' +
          '<button class="admin-button admin-button-sm" type="button" data-dossie-edit="' + escapeHtml(d.id) + '">Editar</button>' +
        '</div>' +
      '</div>';
    }).join("");
    container.innerHTML = items;
    container.querySelectorAll("[data-dossie-edit]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = btn.getAttribute("data-dossie-edit");
        var dossie = (state.dossies || []).find(function(d) { return d.id === id; });
        if (dossie) openDossieForm(dossie);
      });
    });
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
    fetch(backend.url + "/rest/v1/projects?select=id,slug,title,subtitle,description,client,project_type,status,published_at,sort_year,is_featured,servico&order=title.asc", {
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
    }).sort(function (a, b) {
      var ka = normalizeSearchText(stripLeadingArticle(String(a.title || a.slug || "")));
      var kb = normalizeSearchText(stripLeadingArticle(String(b.title || b.slug || "")));
      return ka.localeCompare(kb, "pt-BR");
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
                renderReadinessPill(project) +
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
    renderBatchServicoResults();
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
    initQuillDesc().clipboard.dangerouslyPasteHTML(project.description || "");
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
    return fetch(backend.url + "/rest/v1/dossies?select=id,titulo,conteudo,titulo_en,conteudo_en,titulo_es,conteudo_es,media,projeto_id,criado_em,atualizado_em&order=titulo.asc", {
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

  // ── Dossiê CRUD ──────────────────────────────────────────────────────────────

  function switchDossieLanguage(lang) {
    var tituloEl = document.getElementById("dossie-field-titulo");
    var currentLang = state.dossieLang || "pt";
    // Salvar valores atuais no estado
    if (tituloEl) state.dossieLangTitulo[currentLang] = tituloEl.value;
    if (quillDossie) state.dossieLangContent[currentLang] = quillDossie.root.innerHTML;
    // Trocar idioma
    state.dossieLang = lang;
    // Restaurar valores do novo idioma
    if (tituloEl) tituloEl.value = state.dossieLangTitulo[lang] || "";
    if (quillDossie) quillDossie.clipboard.dangerouslyPasteHTML(state.dossieLangContent[lang] || "");
    // Atualizar UI das abas
    document.querySelectorAll(".dossie-lang-tab").forEach(function(btn) {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
    });
  }

  function setupDossieWorkspace() {
    var newBtn = document.getElementById("dossie-new-button");
    var cancelBtn = document.getElementById("dossie-form-cancel");
    var saveBtn = document.getElementById("dossie-form-save");
    var deleteBtn = document.getElementById("dossie-form-delete");
    var uploadBtn = document.getElementById("dossie-media-upload-button");
    var langTabs = document.getElementById("dossie-lang-tabs");

    if (newBtn) newBtn.addEventListener("click", function() { openDossieForm(null); });
    if (cancelBtn) cancelBtn.addEventListener("click", closeDossieForm);
    if (saveBtn) saveBtn.addEventListener("click", saveDossieRecord);
    if (langTabs) {
      langTabs.addEventListener("click", function(e) {
        var btn = e.target.closest(".dossie-lang-tab");
        if (!btn) return;
        var lang = btn.dataset.lang;
        if (lang && lang !== state.dossieLang) switchDossieLanguage(lang);
      });
    }
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function() {
        if (state.editingDossie) deleteDossieRecord(state.editingDossie.id);
      });
    }
    if (uploadBtn) {
      uploadBtn.addEventListener("click", function() {
        if (!state.editingDossie) return;
        var input = document.getElementById("dossie-media-upload-input");
        if (!input || !input.files.length) {
          setDossieMediaFeedback("Selecione ao menos um arquivo.");
          return;
        }
        uploadDossieMedia(state.editingDossie.id, Array.from(input.files));
      });
    }
  }

  function openDossieForm(dossie) {
    state.editingDossie = dossie || null;

    // Mostrar form antes de inicializar o Quill para que o container não esteja em display:none
    var listView = document.getElementById("dossie-list-view");
    var formView = document.getElementById("dossie-form-view");
    setHidden(listView, true);
    setHidden(formView, false);

    var heading = document.getElementById("dossie-form-heading");
    var tituloEl = document.getElementById("dossie-field-titulo");
    var projetoEl = document.getElementById("dossie-field-projeto");
    var deleteBtn = document.getElementById("dossie-form-delete");
    var mediaSection = document.getElementById("dossie-media-section");
    var feedback = document.getElementById("dossie-form-feedback");

    if (heading) heading.textContent = dossie ? "Editar dossiê" : "Novo dossiê";
    if (feedback) feedback.textContent = "";

    if (projetoEl) {
      projetoEl.innerHTML = '<option value="">Nenhum</option>';
      (state.projects || []).forEach(function(p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.title || p.slug;
        projetoEl.appendChild(opt);
      });
      projetoEl.value = dossie && dossie.projeto_id ? dossie.projeto_id : "";
    }

    // Inicializar Quill lazy (container já visível agora)
    initQuillDossie();

    // Estado multilíngue
    state.dossieLang = "pt";
    state.dossieLangTitulo = {
      pt: dossie ? String(dossie.titulo || "") : "",
      en: dossie ? String(dossie.titulo_en || "") : "",
      es: dossie ? String(dossie.titulo_es || "") : ""
    };
    state.dossieLangContent = {
      pt: dossie ? String(dossie.conteudo || "") : "",
      en: dossie ? String(dossie.conteudo_en || "") : "",
      es: dossie ? String(dossie.conteudo_es || "") : ""
    };

    // Preencher campos com idioma PT (ativo por padrão)
    if (tituloEl) tituloEl.value = state.dossieLangTitulo.pt;
    if (quillDossie) quillDossie.clipboard.dangerouslyPasteHTML(state.dossieLangContent.pt || "");

    // Resetar abas para PT
    document.querySelectorAll(".dossie-lang-tab").forEach(function(btn) {
      btn.classList.toggle("is-active", btn.dataset.lang === "pt");
    });

    setHidden(deleteBtn, !dossie);
    setHidden(mediaSection, !dossie);

    var descricaoEl = document.getElementById("dossie-field-descricao");
    if (descricaoEl) descricaoEl.value = dossie ? (dossie.descricao || "") : "";
    updateDossieThumbPreview(dossie ? dossie.thumb_path : null);

    if (dossie) {
      renderDossieMediaList(dossie.media || []);
    } else {
      var mediaList = document.getElementById("dossie-media-list");
      if (mediaList) mediaList.innerHTML = "";
    }

  }

  function updateDossieThumbPreview(thumbPath) {
    var img = document.getElementById("dossie-thumb-img");
    var none = document.getElementById("dossie-thumb-none");
    if (!img || !none) return;
    if (thumbPath) {
      img.src = buildPublicMediaUrl(thumbPath);
      img.style.display = "";
      none.style.display = "none";
    } else {
      img.src = "";
      img.style.display = "none";
      none.style.display = "";
    }
    if (state.editingDossie) state.editingDossie.thumb_path = thumbPath || null;
  }

  function closeDossieForm() {
    state.editingDossie = null;
    setHidden(document.getElementById("dossie-list-view"), false);
    setHidden(document.getElementById("dossie-form-view"), true);
    renderDossieWorkspace();
  }

  function saveDossieRecord() {
    var tituloEl = document.getElementById("dossie-field-titulo");
    var projetoEl = document.getElementById("dossie-field-projeto");
    var feedback = document.getElementById("dossie-form-feedback");
    var saveBtn = document.getElementById("dossie-form-save");
    var deleteBtn = document.getElementById("dossie-form-delete");
    var mediaSection = document.getElementById("dossie-media-section");

    // Capturar conteúdo do idioma atualmente visível antes de montar o payload
    var currentLang = state.dossieLang || "pt";
    if (tituloEl) state.dossieLangTitulo[currentLang] = tituloEl.value;
    if (quillDossie) state.dossieLangContent[currentLang] = quillDossie.root.innerHTML;

    var titulo = (state.dossieLangTitulo.pt || "").trim();
    if (!titulo) {
      if (feedback) feedback.textContent = "Preencha o título em português.";
      return;
    }

    var payload = {
      titulo:      state.dossieLangTitulo.pt || null,
      conteudo:    state.dossieLangContent.pt || null,
      titulo_en:   state.dossieLangTitulo.en || null,
      conteudo_en: state.dossieLangContent.en || null,
      titulo_es:   state.dossieLangTitulo.es || null,
      conteudo_es: state.dossieLangContent.es || null,
      projeto_id:  projetoEl && projetoEl.value ? projetoEl.value : null,
      descricao:   document.getElementById("dossie-field-descricao") ? (document.getElementById("dossie-field-descricao").value.trim() || null) : null,
      thumb_path:  state.editingDossie ? (state.editingDossie.thumb_path || null) : null
    };

    if (feedback) feedback.textContent = "Salvando…";
    if (saveBtn) saveBtn.disabled = true;

    var isNew = !state.editingDossie;
    var url = backend.url + "/rest/v1/dossies" +
      (isNew ? "" : "?id=eq." + encodeURIComponent(state.editingDossie.id));

    fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify(payload)
    })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(p) { throw new Error(p.message || "erro"); });
      return r.json();
    })
    .then(function(items) {
      var saved = Array.isArray(items) ? items[0] : items;
      if (isNew) {
        state.dossies.push(saved);
        rebuildDossieSelectOptions();
        var heading = document.getElementById("dossie-form-heading");
        if (heading) heading.textContent = "Editar dossiê";
        setHidden(deleteBtn, false);
        setHidden(mediaSection, false);
        renderDossieMediaList(saved.media || []);
      } else {
        var idx = state.dossies.findIndex(function(d) { return d.id === saved.id; });
        if (idx >= 0) state.dossies[idx] = saved;
      }
      state.editingDossie = saved;
      if (feedback) feedback.textContent = "Salvo.";
    })
    .catch(function(err) {
      if (feedback) feedback.textContent = "Erro: " + err.message;
    })
    .finally(function() {
      if (saveBtn) saveBtn.disabled = false;
    });
  }

  function deleteDossieRecord(id) {
    var confirmed = window.confirm("Excluir este dossiê? Esta ação não pode ser desfeita.");
    if (!confirmed) return;

    var feedback = document.getElementById("dossie-form-feedback");
    if (feedback) feedback.textContent = "Excluindo…";

    var mediaItems = (state.editingDossie && state.editingDossie.media) || [];
    Promise.all(mediaItems.map(function(m) {
      return deleteStorageObject(m.storage_path).catch(function() {});
    }))
    .then(function() {
      return fetch(backend.url + "/rest/v1/dossies?id=eq." + encodeURIComponent(id), {
        method: "DELETE",
        headers: { apikey: backend.anonKey, Authorization: "Bearer " + state.token }
      });
    })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(p) { throw new Error(p.message || "erro"); });
      state.dossies = state.dossies.filter(function(d) { return d.id !== id; });
      rebuildDossieSelectOptions();
      closeDossieForm();
    })
    .catch(function(err) {
      if (feedback) feedback.textContent = "Erro: " + err.message;
    });
  }

  function uploadDossieMedia(dossieId, files) {
    var feedback = document.getElementById("dossie-media-feedback");
    var uploadBtn = document.getElementById("dossie-media-upload-button");
    var input = document.getElementById("dossie-media-upload-input");

    setDossieMediaFeedback("Fazendo upload…");
    if (uploadBtn) uploadBtn.disabled = true;

    var uploads = files.map(function(file) {
      var path = "dossie/" + dossieId + "/" + sanitizeFilename(file.name);
      return fetch(backend.url + "/storage/v1/object/project-media/" + encodeStoragePath(path), {
        method: "POST",
        headers: {
          apikey: backend.anonKey,
          Authorization: "Bearer " + state.token,
          "x-upsert": "true",
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      })
      .then(function(r) {
        if (!r.ok) return r.json().then(function(p) { throw new Error(p.message || "upload falhou"); });
        return { storage_path: path, alt: "" };
      });
    });

    Promise.all(uploads)
    .then(function(newItems) {
      var existing = (state.editingDossie && state.editingDossie.media) || [];
      var merged = existing.concat(newItems);
      return fetch(backend.url + "/rest/v1/dossies?id=eq." + encodeURIComponent(dossieId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: backend.anonKey,
          Authorization: "Bearer " + state.token
        },
        body: JSON.stringify({ media: merged })
      })
      .then(function(r) {
        if (!r.ok) return r.json().then(function(p) { throw new Error(p.message || "erro ao salvar mídia"); });
        return r.json();
      })
      .then(function(items) {
        var saved = Array.isArray(items) ? items[0] : items;
        state.editingDossie = saved;
        var idx = state.dossies.findIndex(function(d) { return d.id === saved.id; });
        if (idx >= 0) state.dossies[idx] = saved;
        renderDossieMediaList(saved.media || []);
        setDossieMediaFeedback("Upload concluído.");
        if (input) input.value = "";
      });
    })
    .catch(function(err) {
      setDossieMediaFeedback("Erro: " + err.message);
    })
    .finally(function() {
      if (uploadBtn) uploadBtn.disabled = false;
    });
  }

  function removeDossieMedia(dossieId, storagePath) {
    setDossieMediaFeedback("Removendo…");

    deleteStorageObject(storagePath)
    .catch(function() {})
    .then(function() {
      var existing = (state.editingDossie && state.editingDossie.media) || [];
      var filtered = existing.filter(function(m) { return m.storage_path !== storagePath; });
      return fetch(backend.url + "/rest/v1/dossies?id=eq." + encodeURIComponent(dossieId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: backend.anonKey,
          Authorization: "Bearer " + state.token
        },
        body: JSON.stringify({ media: filtered })
      })
      .then(function(r) {
        if (!r.ok) return r.json().then(function(p) { throw new Error(p.message || "erro"); });
        return r.json();
      })
      .then(function(items) {
        var saved = Array.isArray(items) ? items[0] : items;
        state.editingDossie = saved;
        var idx = state.dossies.findIndex(function(d) { return d.id === saved.id; });
        if (idx >= 0) state.dossies[idx] = saved;
        renderDossieMediaList(saved.media || []);
        setDossieMediaFeedback("Mídia removida.");
      });
    })
    .catch(function(err) {
      setDossieMediaFeedback("Erro: " + err.message);
    });
  }

  function renderDossieMediaList(media) {
    var list = document.getElementById("dossie-media-list");
    if (!list) return;
    if (!media || !media.length) {
      list.innerHTML = '<p class="admin-copy" style="color:var(--admin-muted);margin:8px 0 0;">Nenhuma mídia adicionada.</p>';
      return;
    }
    list.innerHTML = media.map(function(m) {
      var url = buildPublicMediaUrl(m.storage_path);
      var isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(m.storage_path);
      var preview = isImage
        ? '<img class="admin-media-preview" src="' + escapeHtml(url) + '" alt="' + escapeHtml(m.alt || "") + '" loading="lazy">'
        : '<div class="admin-media-preview" style="display:flex;align-items:center;justify-content:center;background:var(--admin-bg-alt);font-size:11px;color:var(--admin-muted);">vídeo</div>';
      var filename = m.storage_path.split("/").pop();
      return '<div class="admin-media-item">' +
        preview +
        '<div class="admin-media-body">' +
          '<p class="admin-media-meta">' + escapeHtml(filename) + '</p>' +
          '<div class="admin-media-actions">' +
            '<a href="' + escapeHtml(url) + '" target="_blank" class="admin-button admin-button-sm">Abrir</a> ' +
            (isImage ? '<button class="admin-button admin-button-sm" type="button" data-set-thumb="' + escapeHtml(m.storage_path) + '">Thumb</button> ' : '') +
            '<button class="admin-button admin-button-sm admin-button-danger" type="button" data-remove-path="' + escapeHtml(m.storage_path) + '">Remover</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");
    list.querySelectorAll("[data-remove-path]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        if (state.editingDossie) {
          removeDossieMedia(state.editingDossie.id, btn.getAttribute("data-remove-path"));
        }
      });
    });
    list.querySelectorAll("[data-set-thumb]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        if (!state.editingDossie) return;
        var path = btn.getAttribute("data-set-thumb");
        fetch(backend.url + "/rest/v1/dossies?id=eq." + encodeURIComponent(state.editingDossie.id), {
          method: "PATCH",
          headers: {
            apikey: backend.anonKey,
            Authorization: "Bearer " + state.token,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify({ thumb_path: path })
        })
        .then(function(r) { return r.json(); })
        .then(function(rows) {
          var saved = rows && rows[0];
          if (saved) {
            state.editingDossie.thumb_path = saved.thumb_path;
            updateDossieThumbPreview(saved.thumb_path);
            setDossieMediaFeedback("Thumb definida.");
          }
        })
        .catch(function(err) { setDossieMediaFeedback("Erro: " + err.message); });
      });
    });
  }

  function setDossieMediaFeedback(msg) {
    var el = document.getElementById("dossie-media-feedback");
    if (el) el.textContent = msg;
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
        description: quillDesc ? (quillDesc.root.innerHTML || null) : null,
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
        var allImages = images || [];

        // Detect duplicate records (same kind + sort_order) and delete the older ones
        var seen = {};
        var duplicateIds = [];
        allImages.forEach(function (img) {
          var key = img.kind + ":" + String(img.sort_order);
          if (seen[key]) {
            // Keep the newer one (higher created_at), discard the older
            if (img.created_at > seen[key].created_at) {
              duplicateIds.push(seen[key].id);
              seen[key] = img;
            } else {
              duplicateIds.push(img.id);
            }
          } else {
            seen[key] = img;
          }
        });

        if (duplicateIds.length) {
          duplicateIds.forEach(function (dupId) {
            fetch(backend.url + "/rest/v1/project_images?id=eq." + encodeURIComponent(dupId), {
              method: "DELETE",
              headers: {
                apikey: backend.anonKey,
                Authorization: "Bearer " + state.token
              }
            }).catch(function () {});
          });
          allImages = allImages.filter(function (img) {
            return duplicateIds.indexOf(img.id) === -1;
          });
        }

        state.imagesByProject[projectId] = allImages;
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

  function renderBatchServicoResults() {
    var selectedProjects = getBatchSelectedProjects();
    var tipos = getServicoTypes();

    if (!selectedProjects.length) {
      batchServicoResults.innerHTML = '<p class="admin-inline-empty">Selecione projetos para aplicar execução em lote.</p>';
      return;
    }

    if (!tipos.length) {
      batchServicoResults.innerHTML = '<p class="admin-inline-empty">Nenhum tipo de serviço cadastrado ainda.</p>';
      return;
    }

    batchServicoResults.innerHTML = tipos.map(function(tipo) {
      var hasAll = selectedProjects.every(function(p) {
        return (p.servico || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean).indexOf(tipo) !== -1;
      });
      var hasSome = selectedProjects.some(function(p) {
        return (p.servico || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean).indexOf(tipo) !== -1;
      });
      var className = "admin-chip" + (hasAll ? " is-active" : hasSome ? " is-mixed" : "");
      return '<button class="' + className + '" type="button" data-batch-servico="' + escapeHtml(tipo) + '">' + escapeHtml(tipo) + '</button>';
    }).join("");
  }

  function handleBatchServicoToggle(event) {
    var button = event.target.closest("[data-batch-servico]");
    if (!button) return;
    var tipo = button.getAttribute("data-batch-servico");
    var selectedProjects = getBatchSelectedProjects();
    if (!tipo || !selectedProjects.length) return;

    var hasAll = selectedProjects.every(function(p) {
      return (p.servico || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean).indexOf(tipo) !== -1;
    });

    var jobs = selectedProjects.map(function(project) {
      var current = (project.servico || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      var hasIt = current.indexOf(tipo) !== -1;
      var novoValor;
      if (hasAll) {
        novoValor = current.filter(function(s) { return s !== tipo; }).join(",") || null;
      } else {
        if (hasIt) return null;
        novoValor = current.concat([tipo]).join(",");
      }
      return fetch(backend.url + "/rest/v1/projects?id=eq." + encodeURIComponent(project.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: backend.anonKey,
          Authorization: "Bearer " + state.token
        },
        body: JSON.stringify({ servico: novoValor || null })
      }).then(function(r) { return r.json(); }).then(function(items) {
        if (items && items.length) replaceProject(items[0]);
      });
    }).filter(Boolean);

    Promise.all(jobs).then(function() {
      renderBatchServicoResults();
    }).catch(function() {
      setBatchFeedback("Erro ao aplicar execução em lote.", true);
    });
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
    if (!siteNavigationFields || !siteFilterFields) return;

    var siteConfig = state.siteConfig || createDefaultSiteConfig();

    siteNavigationFields.innerHTML = siteConfig.navigation.map(function (item) {
      return '' +
        '<label class="admin-field">' +
          '<span class="admin-label">' + escapeHtml(item.id) + '</span>' +
          '<input class="admin-input" type="text" data-site-nav-id="' + escapeHtml(item.id) + '" value="' + escapeHtml(item.label || "") + '">' +
        '</label>';
    }).join("");

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
    // reserved for future click handling in site config form
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
    state.siteConfig.page_content[state.activeSitePageId] = quillPage ? (quillPage.root.innerHTML || "") : "";
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
      page_content: {}
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

    var fileArray = Array.prototype.slice.call(files);
    var invalidFiles = [];
    var validEntries = [];

    fileArray.forEach(function (file) {
      var parsed = parseIncomingFilename(file.name);
      if (!parsed || parsed.slug !== project.slug) {
        invalidFiles.push(file.name);
      } else {
        validEntries.push({ file: file, kind: parsed.kind, sortOrder: parsed.sortOrder });
      }
    });

    if (!validEntries.length) {
      setSaveState("Os arquivos precisam seguir o nome do projeto, como " + project.slug + "_thumb.jpg ou " + project.slug + "_03.jpg");
      return;
    }

    setSaveState("Enviando imagens...");

    // Always fetch fresh images from DB before uploading to avoid stale-cache duplicates
    fetch(backend.url + "/rest/v1/project_images?select=id,project_id,storage_path,kind,alt_text,sort_order,is_published,created_at&project_id=eq." + encodeURIComponent(project.id) + "&order=sort_order.asc,created_at.asc", {
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) return Promise.resolve([]);
        return response.json();
      })
      .then(function (freshImages) {
        state.imagesByProject[project.id] = freshImages || [];
        var uploads = validEntries.map(function (entry) {
          return overwritePreparedImage(project, state.imagesByProject[project.id], entry.file, entry.kind, entry.sortOrder);
        });
        return Promise.all(uploads);
      })
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

  function stripLeadingArticle(text) {
    return text.replace(/^(a|o|as|os|um|uma|uns|umas|the|an?)\s+/i, "");
  }

  function getProjectInitial(project) {
    var source = normalizeSearchText(project && (project.title || project.slug));
    var stripped = normalizeSearchText(stripLeadingArticle(source));
    var match = stripped.match(/[a-z0-9]/);
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

    var storageDelete = image.storage_path
      ? deleteStorageObject(image.storage_path).catch(function () {})
      : Promise.resolve();

    storageDelete
      .then(function () {
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
        setSaveState("Mídia removida");
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
      if (publicationPill) { publicationPill.textContent = "Rascunho"; publicationPill.dataset.status = "draft"; }
      if (publicationState) publicationState.textContent = "Rascunho";
      if (publicationDate) publicationDate.textContent = "Não definido";
      if (fieldFeatured) { fieldFeatured.checked = false; fieldFeatured.disabled = true; }
      return;
    }

    var status = String(project.status || "draft");
    if (publicationPill) { publicationPill.textContent = formatStatusLabel(status); publicationPill.dataset.status = status; }
    if (publicationState) publicationState.textContent = formatStatusLabel(status);
    if (publicationDate) publicationDate.textContent = project.sort_year ? String(project.sort_year) : "Não definido";
    if (fieldFeatured) { fieldFeatured.checked = Boolean(project.is_featured); fieldFeatured.disabled = false; }
  }

  function syncEditorialFlagsPanel(projectId) {
    // flags panel removed — no-op
  }

  function syncPublicationChecklist(project) {
    // checklist panel removed — no-op
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
    var flagKey = "future_feature";
    var flagLabel = "Destaque futuro";

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

    if (hasEditorialFlag(projectId, "future_feature")) {
      pills.push('<span class="admin-status-pill is-future-flag">Futuro</span>');
    }

    var project = getProjectById(projectId);
    if (project && project.is_featured) {
      pills.push('<span class="admin-status-pill">Site</span>');
    }

    return pills.join("");
  }

  function getReadinessIssues(project) {
    var issues = [];
    if (!String(project.title || "").trim() || project.title === project.slug) issues.push("Título");
    if (!String(project.client || "").trim()) issues.push("Editora");
    if (!String(project.project_type || "").trim()) issues.push("Tipo");
    if (!project.sort_year) issues.push("Ano");
    if (!String(project.servico || "").trim()) issues.push("Execução");
    if (!(state.projectTagsByProject[project.id] || []).length) issues.push("Tags");
    return issues;
  }

  function renderReadinessPill(project) {
    var issues = getReadinessIssues(project);
    if (!issues.length) return "";
    return issues.map(function (issue) {
      return '<span class="admin-status-pill is-review-flag">' + escapeHtml(issue) + '</span>';
    }).join("");
  }

  function handleCheckReadiness() {
    var incomplete = state.projects.filter(function (p) {
      return getReadinessIssues(p).length > 0;
    });

    if (!incomplete.length) {
      batchReadinessResults.innerHTML = '<p class="admin-copy" style="color:var(--admin-success,green);margin:8px 0 0;">Todos os projetos atendem os requisitos mínimos.</p>';
      batchConvertDraftsButton.disabled = true;
      return;
    }

    batchReadinessResults.innerHTML = '<p class="admin-copy" style="margin:8px 0 4px;">' + incomplete.length + ' projeto(s) com pendências:</p>' +
      '<ul style="margin:0;padding-left:16px;font-size:12px;">' +
      incomplete.map(function (p) {
        var issues = getReadinessIssues(p);
        return '<li><strong>' + escapeHtml(p.title || p.slug) + '</strong>: ' + escapeHtml(issues.join(", ")) + '</li>';
      }).join("") +
      '</ul>';
    batchConvertDraftsButton.disabled = false;
  }

  function handleConvertIncompleteToDraft() {
    var toConvert = state.projects.filter(function (p) {
      return p.status === "published" && getReadinessIssues(p).length > 0;
    });

    if (!toConvert.length) {
      setBatchFeedback("Nenhum projeto publicado com pendências encontrado.", false);
      return;
    }

    if (!window.confirm("Converter " + toConvert.length + " projeto(s) publicado(s) para Rascunho?")) return;

    setBatchFeedback("Convertendo...", false);
    var jobs = toConvert.map(function (p) {
      return fetch(backend.url + "/rest/v1/projects?id=eq." + encodeURIComponent(p.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: backend.anonKey,
          Authorization: "Bearer " + state.token
        },
        body: JSON.stringify({ status: "draft", published_at: null })
      }).then(function () {
        p.status = "draft";
        p.published_at = null;
      });
    });

    Promise.all(jobs)
      .then(function () {
        setBatchFeedback(toConvert.length + " projeto(s) convertido(s) para Rascunho.", false);
        batchConvertDraftsButton.disabled = true;
        renderProjectList();
        handleCheckReadiness();
      })
      .catch(function () {
        setBatchFeedback("Erro ao converter alguns projetos.", true);
      });
  }

  function renderEditorialFlagSummary(projectId) {
    var pills = [];

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

  // ── Álbum secreto ────────────────────────────────────────────────────────

  var albumInitialized = false;

  function initAlbumWorkspace() {
    if (!albumInitialized) {
      albumInitialized = true;
      setupAlbumWorkspace();
    }
    loadAlbumPhotos();
  }

  function setupAlbumWorkspace() {
    var uploadBtn = document.getElementById("album-upload-button");
    var input = document.getElementById("album-upload-input");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", function() {
        if (input && input.files && input.files.length) {
          uploadAlbumPhotos(Array.prototype.slice.call(input.files));
        } else {
          setAlbumFeedback("Selecione ao menos uma imagem.");
        }
      });
    }
  }

  function loadAlbumPhotos() {
    fetch(backend.url + "/rest/v1/album_photos?select=id,storage_path,url,legenda,created_at&order=created_at.desc", {
      headers: { apikey: backend.anonKey, Authorization: "Bearer " + state.token }
    })
    .then(function(r) { return r.json(); })
    .then(function(photos) {
      state.albumPhotos = Array.isArray(photos) ? photos : [];
      renderAlbumPhotoGrid(state.albumPhotos);
    })
    .catch(function() { setAlbumFeedback("Erro ao carregar fotos."); });
  }

  function uploadAlbumPhotos(files) {
    var uploadBtn = document.getElementById("album-upload-button");
    var input = document.getElementById("album-upload-input");
    setAlbumFeedback("Enviando " + files.length + " foto(s)…");
    if (uploadBtn) uploadBtn.disabled = true;

    var uploads = files.map(function(file) {
      var safeName = sanitizeFilename(file.name);
      var path = "album/" + Date.now() + "_" + safeName;
      return fetch(backend.url + "/storage/v1/object/project-media/" + encodeStoragePath(path), {
        method: "POST",
        headers: {
          apikey: backend.anonKey,
          Authorization: "Bearer " + state.token,
          "x-upsert": "true",
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      })
      .then(function(r) {
        if (!r.ok) return r.json().then(function(p) { throw new Error(p.message || "upload falhou"); });
        var url = buildPublicMediaUrl(path);
        return fetch(backend.url + "/rest/v1/album_photos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
            apikey: backend.anonKey,
            Authorization: "Bearer " + state.token
          },
          body: JSON.stringify({ storage_path: path, url: url, legenda: "" })
        })
        .then(function(r2) { return r2.json(); })
        .then(function(rows) { return Array.isArray(rows) ? rows[0] : rows; });
      });
    });

    Promise.all(uploads)
    .then(function() {
      if (input) input.value = "";
      setAlbumFeedback("Upload concluído.");
      loadAlbumPhotos();
    })
    .catch(function(err) { setAlbumFeedback("Erro: " + err.message); })
    .finally(function() { if (uploadBtn) uploadBtn.disabled = false; });
  }

  function saveAlbumLegenda(id, legenda) {
    fetch(backend.url + "/rest/v1/album_photos?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({ legenda: legenda })
    }).catch(function() { setAlbumFeedback("Erro ao salvar legenda."); });
  }

  function deleteAlbumPhoto(id, storagePath) {
    setAlbumFeedback("Removendo…");
    deleteStorageObject(storagePath)
    .catch(function() {})
    .then(function() {
      return fetch(backend.url + "/rest/v1/album_photos?id=eq." + encodeURIComponent(id), {
        method: "DELETE",
        headers: { apikey: backend.anonKey, Authorization: "Bearer " + state.token }
      });
    })
    .then(function() {
      setAlbumFeedback("Foto removida.");
      loadAlbumPhotos();
    })
    .catch(function() { setAlbumFeedback("Erro ao remover foto."); });
  }

  function renderAlbumPhotoGrid(photos) {
    var grid = document.getElementById("album-photo-grid");
    if (!grid) return;
    if (!photos || !photos.length) {
      grid.innerHTML = '<p class="admin-copy" style="color:var(--admin-muted);margin:0;">Nenhuma foto no álbum.</p>';
      return;
    }
    grid.innerHTML = photos.map(function(photo) {
      var isSecret = Boolean(photo.is_secret);
      return '<div class="album-admin-item' + (isSecret ? ' is-secret' : '') + '" data-photo-id="' + escapeHtml(photo.id) + '">' +
        '<img class="album-admin-thumb" src="' + escapeHtml(photo.url) + '" alt="" loading="lazy">' +
        '<div class="album-admin-item-body">' +
          '<label class="album-secret-check">' +
            '<input type="checkbox" data-album-secret-toggle="' + escapeHtml(photo.id) + '"' + (isSecret ? ' checked' : '') + '> ' +
            'Capa secreta' +
          '</label>' +
          '<textarea class="album-admin-legenda" rows="2" placeholder="Legenda (ex: Rio, 2023)">' + escapeHtml(photo.legenda || "") + '</textarea>' +
          '<div class="album-admin-actions">' +
            '<button class="admin-button admin-button-sm" type="button" data-album-save="' + escapeHtml(photo.id) + '">Salvar</button>' +
            '<button class="admin-button admin-button-sm admin-button-danger" type="button" data-album-delete="' + escapeHtml(photo.id) + '" data-album-path="' + escapeHtml(photo.storage_path) + '">Remover</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");

    grid.querySelectorAll("[data-album-secret-toggle]").forEach(function(checkbox) {
      checkbox.addEventListener("change", function() {
        var id = checkbox.getAttribute("data-album-secret-toggle");
        if (!checkbox.checked) {
          // Desmarcar
          setAlbumSecret(id, false);
          return;
        }
        // Marcar: primeiro desmarcar todos os outros no banco e na UI
        var allCheckboxes = grid.querySelectorAll("[data-album-secret-toggle]");
        allCheckboxes.forEach(function(cb) {
          if (cb !== checkbox && cb.checked) {
            cb.checked = false;
            var otherId = cb.getAttribute("data-album-secret-toggle");
            var otherItem = cb.closest(".album-admin-item");
            if (otherItem) otherItem.classList.remove("is-secret");
            setAlbumSecret(otherId, false);
          }
        });
        setAlbumSecret(id, true);
        var item = checkbox.closest(".album-admin-item");
        if (item) item.classList.add("is-secret");
      });
    });

    grid.querySelectorAll("[data-album-save]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = btn.getAttribute("data-album-save");
        var item = btn.closest(".album-admin-item");
        var textarea = item && item.querySelector(".album-admin-legenda");
        if (id && textarea) saveAlbumLegenda(id, textarea.value.trim());
        setAlbumFeedback("Legenda salva.");
      });
    });

    grid.querySelectorAll("[data-album-delete]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = btn.getAttribute("data-album-delete");
        var path = btn.getAttribute("data-album-path");
        if (id && path) deleteAlbumPhoto(id, path);
      });
    });
  }

  function setAlbumSecret(id, value) {
    fetch(backend.url + "/rest/v1/album_photos?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({ is_secret: value })
    }).catch(function() { setAlbumFeedback("Erro ao atualizar capa secreta."); });
  }

  function setAlbumFeedback(msg) {
    var el = document.getElementById("album-feedback");
    if (el) el.textContent = msg;
  }

})();

(function () {
  var backend = window.GIZ_BACKEND_CONFIG || {};
  var AUTH_STORAGE_KEY = "giz_admin_access_token";

  var authScreen = document.getElementById("auth-screen");
  var adminApp = document.getElementById("admin-app");
  var authForm = document.getElementById("auth-form");
  var authFeedback = document.getElementById("auth-feedback");
  var authSubmitButton = document.getElementById("auth-submit-button");
  var sessionEmail = document.getElementById("session-email");
  var logoutButton = document.getElementById("logout-button");
  var projectSearch = document.getElementById("project-search");
  var statusFilter = document.getElementById("status-filter");
  var projectCount = document.getElementById("project-count");
  var projectList = document.getElementById("project-list");
  var editorEmpty = document.getElementById("editor-empty");
  var editorForm = document.getElementById("editor-form");
  var editorTabs = Array.prototype.slice.call(document.querySelectorAll("[data-editor-tab]"));
  var editorSections = Array.prototype.slice.call(document.querySelectorAll("[data-editor-section]"));
  var editorSlug = document.getElementById("editor-slug");
  var editorTitle = document.getElementById("editor-title");
  var saveState = document.getElementById("save-state");
  var fieldSlug = document.getElementById("field-slug");
  var fieldTitle = document.getElementById("field-title");
  var fieldSubtitle = document.getElementById("field-subtitle");
  var fieldClient = document.getElementById("field-client");
  var fieldType = document.getElementById("field-type");
  var fieldStatus = document.getElementById("field-status");
  var fieldDescription = document.getElementById("field-description");
  var fieldPublicationNotes = document.getElementById("field-publication-notes");
  var fieldFeatured = document.getElementById("field-featured");
  var publicationPill = document.getElementById("publication-pill");
  var publicationState = document.getElementById("publication-state");
  var publicationDate = document.getElementById("publication-date");
  var markDraftButton = document.getElementById("mark-draft-button");
  var markReviewButton = document.getElementById("mark-review-button");
  var publishButton = document.getElementById("publish-button");
  var archiveButton = document.getElementById("archive-button");
  var checklistSummary = document.getElementById("checklist-summary");
  var checklistList = document.getElementById("checklist-list");
  var flagSummary = document.getElementById("flag-summary");
  var flagReviewText = document.getElementById("flag-review-text");
  var flagFutureFeature = document.getElementById("flag-future-feature");
  var tagSearch = document.getElementById("tag-search");
  var tagResults = document.getElementById("tag-results");
  var addTagButton = document.getElementById("add-tag-button");
  var newTagForm = document.getElementById("new-tag-form");
  var newTagLabel = document.getElementById("new-tag-label");
  var newTagGroup = document.getElementById("new-tag-group");
  var newTagPublic = document.getElementById("new-tag-public");
  var newTagFeedback = document.getElementById("new-tag-feedback");
  var tagList = document.getElementById("tag-list");
  var pairSearch = document.getElementById("pair-search");
  var pairResults = document.getElementById("pair-results");
  var addPairButton = document.getElementById("add-pair-button");
  var pairList = document.getElementById("pair-list");
  var mediaUploadForm = document.getElementById("media-upload-form");
  var mediaFiles = document.getElementById("media-files");
  var mediaKind = document.getElementById("media-kind");
  var mediaList = document.getElementById("media-list");
  var newProjectButton = document.getElementById("new-project-button");
  var newProjectForm = document.getElementById("new-project-form");
  var newProjectSlug = document.getElementById("new-project-slug");
  var newProjectTitle = document.getElementById("new-project-title");
  var cancelNewProjectButton = document.getElementById("cancel-new-project-button");
  var bulkImportPanel = document.getElementById("bulk-import-panel");
  var bulkImportForm = document.getElementById("bulk-import-form");
  var bulkImportStatus = document.getElementById("bulk-import-status");
  var bulkImportBatch = document.getElementById("bulk-import-batch");
  var bulkImportInput = document.getElementById("bulk-import-input");
  var bulkImportClearButton = document.getElementById("bulk-import-clear-button");
  var bulkImportFeedback = document.getElementById("bulk-import-feedback");

  var state = {
    token: null,
    sessionEmail: "",
    projects: [],
    tags: [],
    projectTagsByProject: {},
    editorialFlagsByProject: {},
    imagesByProject: {},
    pairs: [],
    filteredProjects: [],
    selectedProjectId: null,
    editorSection: "details"
  };

  if (!backend.url || !backend.anonKey) {
    setAuthFeedback("Backend config ausente no admin.", true);
    return;
  }

  authForm.addEventListener("submit", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    submitAuthRequest();
  });

  authSubmitButton.addEventListener("click", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    submitAuthRequest();
  });

  logoutButton.addEventListener("click", function () {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    state.token = null;
    state.sessionEmail = "";
    state.projects = [];
    state.editorialFlagsByProject = {};
    state.imagesByProject = {};
    state.filteredProjects = [];
    state.selectedProjectId = null;
    setAuthFeedback("Sessao encerrada.", false);
    renderAuthState();
  });

  projectSearch.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  projectList.addEventListener("click", handleProjectSelection);
  editorForm.addEventListener("click", handleEditorTabClick);
  editorForm.addEventListener("submit", handleProjectSave);
  newProjectButton.addEventListener("click", toggleNewProjectForm);
  cancelNewProjectButton.addEventListener("click", toggleNewProjectForm);
  newProjectForm.addEventListener("submit", handleCreateProject);
  bulkImportForm.addEventListener("submit", handleBulkImport);
  bulkImportClearButton.addEventListener("click", clearBulkImportForm);
  mediaUploadForm.addEventListener("submit", handleMediaUpload);
  mediaList.addEventListener("click", handleMediaListClick);
  tagSearch.addEventListener("input", renderTagResults);
  tagResults.addEventListener("change", syncTagActionState);
  tagResults.addEventListener("dblclick", handleAddTag);
  addTagButton.addEventListener("click", handleAddTag);
  newTagForm.addEventListener("submit", handleCreateTag);
  tagList.addEventListener("click", handleTagRemoval);
  markDraftButton.addEventListener("click", function () { handlePublicationAction("draft"); });
  markReviewButton.addEventListener("click", function () { handlePublicationAction("review"); });
  publishButton.addEventListener("click", function () { handlePublicationAction("published"); });
  archiveButton.addEventListener("click", function () { handlePublicationAction("archived"); });
  flagReviewText.addEventListener("change", handleEditorialFlagChange);
  flagFutureFeature.addEventListener("change", handleEditorialFlagChange);
  pairSearch.addEventListener("input", renderPairResults);
  pairResults.addEventListener("change", syncPairActionState);
  pairResults.addEventListener("dblclick", handleAddPair);
  addPairButton.addEventListener("click", handleAddPair);
  pairList.addEventListener("click", handlePairRemoval);

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
      pairResults.disabled = true;
      addPairButton.disabled = true;
      state.imagesByProject = {};
      state.projectTagsByProject = {};
      state.editorialFlagsByProject = {};
      mediaUploadForm.hidden = true;
      bulkImportPanel.open = false;
      pairResults.innerHTML = "";
      pairList.innerHTML = "";
      mediaList.innerHTML = "";
      tagResults.innerHTML = "";
      tagList.innerHTML = "";
      flagSummary.innerHTML = "";
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

  function renderAuthState() {
    var isLoggedIn = Boolean(state.token);
    authScreen.hidden = isLoggedIn;
    adminApp.hidden = !isLoggedIn;
    authScreen.style.display = isLoggedIn ? "none" : "grid";
    adminApp.style.display = isLoggedIn ? "block" : "none";
    sessionEmail.textContent = state.sessionEmail || "sessao ativa";

    if (!isLoggedIn) {
      projectCount.textContent = "0";
      projectList.innerHTML = "";
      editorEmpty.hidden = false;
      editorForm.hidden = true;
      renderEditorTabs();
      updatePublicationPanel(null);
      setSaveState("Pronto");
    }
  }

  function submitAuthRequest() {
    var email = "";
    if (authForm.elements && authForm.elements.email) {
      email = String(authForm.elements.email.value || "").trim().toLowerCase();
    }

    if (!email || email.indexOf("@") === -1) {
      setAuthFeedback("Digite um e-mail valido.", true);
      return;
    }

    authSubmitButton.disabled = true;
    authSubmitButton.textContent = "Enviando...";
    setAuthFeedback("Enviando magic link...", false);

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
        authSubmitButton.textContent = "Reenviar acesso";
      })
      .catch(function (error) {
        setAuthFeedback("Nao foi possivel enviar o acesso: " + error.message, true);
        authSubmitButton.disabled = false;
        authSubmitButton.textContent = "Enviar acesso";
      });
  }

  function loadProjects() {
    fetch(backend.url + "/rest/v1/projects?select=id,slug,title,subtitle,description,client,project_type,status,publication_notes,published_at,is_featured&order=title.asc", {
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
          })
        ]);
      })
      .then(function () {
        renderAuthState();
        applyFilters();
      })
      .catch(function (error) {
        setSaveState("Erro ao carregar projetos");
        projectList.innerHTML = '<div class="admin-card">Nao foi possivel carregar os projetos.</div>';
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

  function applyFilters() {
    var query = String(projectSearch.value || "").trim().toLowerCase();
    var status = String(statusFilter.value || "");

    state.filteredProjects = state.projects.filter(function (project) {
      var matchesStatus = !status || project.status === status;
      var haystack = [project.title, project.slug, project.client, project.project_type].join(" ").toLowerCase();
      var matchesQuery = !query || haystack.indexOf(query) !== -1;
      return matchesStatus && matchesQuery;
    });

    if (state.selectedProjectId) {
      var stillVisible = state.filteredProjects.some(function (project) {
        return project.id === state.selectedProjectId;
      });
      if (!stillVisible) {
        state.selectedProjectId = state.filteredProjects.length ? state.filteredProjects[0].id : null;
      }
    }

    renderProjectList();
    renderEditor();
  }

  function renderProjectList() {
    projectCount.textContent = String(state.filteredProjects.length);

    if (!state.filteredProjects.length) {
      projectList.innerHTML = '<div class="admin-card">Nenhum projeto encontrado.</div>';
      return;
    }

    projectList.innerHTML = state.filteredProjects.map(function (project) {
      var activeClass = project.id === state.selectedProjectId ? " is-active" : "";
      return '' +
        '<button class="admin-project-item' + activeClass + '" type="button" data-project-id="' + escapeHtml(project.id) + '">' +
          '<div class="admin-project-item-head">' +
            "<strong>" + escapeHtml(project.title) + "</strong>" +
            '<span class="admin-status-pill" data-status="' + escapeHtml(project.status) + '">' + escapeHtml(formatStatusLabel(project.status)) + '</span>' +
          '</div>' +
          '<div class="admin-project-meta">' +
            "<span>" + escapeHtml(project.client || "sem cliente") + "</span>" +
            "<span>" + escapeHtml(project.slug) + "</span>" +
          "</div>" +
          '<div class="admin-project-meta">' +
            renderProjectFlagPills(project.id) +
          "</div>" +
        "</button>";
    }).join("");
  }

  function handleProjectSelection(event) {
    var button = event.target.closest("[data-project-id]");
    if (!button) return;
    state.selectedProjectId = button.getAttribute("data-project-id");
    renderProjectList();
    renderEditor();
  }

  function handleEditorTabClick(event) {
    var button = event.target.closest("[data-editor-tab]");
    if (!button) return;
    state.editorSection = button.getAttribute("data-editor-tab") || "details";
    renderEditorTabs();
  }

  function renderEditor() {
    var project = getSelectedProject();
    if (!project) {
      editorEmpty.hidden = false;
      editorForm.hidden = true;
      renderEditorTabs();
      updatePublicationPanel(null);
      return;
    }

    editorEmpty.hidden = true;
    editorForm.hidden = false;
    mediaUploadForm.hidden = false;
    renderEditorTabs();
    editorSlug.textContent = project.slug;
    editorTitle.textContent = project.title;
    fieldSlug.value = project.slug || "";
    fieldTitle.value = project.title || "";
    fieldSubtitle.value = project.subtitle || "";
    fieldClient.value = project.client || "";
    fieldType.value = project.project_type || "";
    fieldStatus.value = project.status || "draft";
    fieldDescription.value = project.description || "";
    fieldPublicationNotes.value = project.publication_notes || "";
    fieldFeatured.checked = Boolean(project.is_featured);
    updatePublicationPanel(project);
    syncEditorialFlagsPanel(project.id);
    renderMediaList();
    loadProjectImages(project.id);
    renderTagResults();
    renderTagList();
    renderPairResults();
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

  function persistCurrentProject(forcedStatus) {
    var project = getSelectedProject();
    if (!project) return;
    var nextSlug = sanitizeSlug(fieldSlug.value);
    var nextStatus = String(forcedStatus || fieldStatus.value || "draft");

    if (!nextSlug) {
      setSaveState("Slug invalido");
      return;
    }

    fieldStatus.value = nextStatus;

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
        client: String(fieldClient.value || "").trim() || null,
        project_type: String(fieldType.value || "").trim() || null,
        status: nextStatus,
        description: String(fieldDescription.value || "").trim() || null,
        publication_notes: String(fieldPublicationNotes.value || "").trim() || null,
        is_featured: Boolean(fieldFeatured.checked),
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
          editorSlug.textContent = items[0].slug;
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

  function handlePublicationAction(nextStatus) {
    persistCurrentProject(nextStatus);
  }

  function toggleNewProjectForm() {
    newProjectForm.hidden = !newProjectForm.hidden;
  }

  function handleCreateProject(event) {
    if (event && event.preventDefault) event.preventDefault();

    var slug = String(newProjectSlug.value || "").trim().toLowerCase();
    var title = String(newProjectTitle.value || "").trim();

    if (!slug || !title) {
      setSaveState("Preencha slug e titulo");
      return;
    }

    fetch(backend.url + "/rest/v1/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        slug: slug,
        title: title,
        status: "draft"
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao criar projeto");
          });
        }
        return response.json();
      })
      .then(function (items) {
        if (items && items.length) {
          state.projects.push(items[0]);
          state.projectTagsByProject[items[0].id] = [];
          state.imagesByProject[items[0].id] = [];
          state.selectedProjectId = items[0].id;
          newProjectForm.hidden = true;
          newProjectSlug.value = "";
          newProjectTitle.value = "";
          applyFilters();
        }
        setSaveState("Draft criado");
      })
      .catch(function (error) {
        setSaveState("Erro ao criar");
      });
  }

  function handleBulkImport(event) {
    if (event && event.preventDefault) event.preventDefault();

    var rawInput = String(bulkImportInput.value || "").trim();
    var initialStatus = String(bulkImportStatus.value || "draft");
    var importedBatch = String(bulkImportBatch.value || "").trim() || null;

    if (!rawInput) {
      setBulkImportFeedback("Cole o conteúdo do lote antes de importar.", true);
      return;
    }

    var parsedItems;
    try {
      parsedItems = parseBulkImportInput(rawInput);
    } catch (error) {
      setBulkImportFeedback(error.message, true);
      return;
    }

    if (!parsedItems.length) {
      setBulkImportFeedback("Nenhum projeto valido foi encontrado no lote.", true);
      return;
    }

    var existingSlugs = {};
    for (var i = 0; i < state.projects.length; i += 1) {
      existingSlugs[state.projects[i].slug] = true;
    }

    var duplicateSlugs = [];
    var seenInBatch = {};
    var payload = parsedItems.map(function (item) {
      var slug = sanitizeSlug(item.slug || item.title);
      if (!slug || !item.title) {
        return null;
      }
      if (existingSlugs[slug] || seenInBatch[slug]) {
        duplicateSlugs.push(slug);
        return null;
      }
      seenInBatch[slug] = true;
      return {
        slug: slug,
        title: String(item.title || "").trim(),
        subtitle: normalizeOptionalText(item.subtitle),
        client: normalizeOptionalText(item.client),
        project_type: normalizeOptionalText(item.project_type || item.type),
        description: normalizeOptionalText(item.description),
        publication_notes: normalizeOptionalText(item.publication_notes),
        imported_batch: importedBatch,
        status: initialStatus
      };
    }).filter(Boolean);

    if (!payload.length) {
      setBulkImportFeedback("O lote foi descartado porque todos os slugs ja existem ou estavam invalidos.", true);
      return;
    }

    setBulkImportFeedback("Importando " + payload.length + " projetos...", false);

    fetch(backend.url + "/rest/v1/projects", {
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
            throw new Error(payloadResponse.message || payloadResponse.msg || "falha ao importar lote");
          });
        }
        return response.json();
      })
      .then(function (items) {
        var created = items || [];
        for (var i = 0; i < created.length; i += 1) {
          state.projects.push(created[i]);
          state.projectTagsByProject[created[i].id] = [];
          state.imagesByProject[created[i].id] = [];
        }
        if (created.length) {
          state.selectedProjectId = created[0].id;
        }
        applyFilters();
        clearBulkImportForm();
        setBulkImportFeedback(
          "Lote criado com " + created.length + " projetos." +
          (duplicateSlugs.length ? " Slugs ignorados: " + duplicateSlugs.join(", ") + "." : ""),
          false
        );
        setSaveState("Lote importado");
      })
      .catch(function (error) {
        setBulkImportFeedback("Nao foi possivel importar o lote: " + error.message, true);
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
        mediaList.innerHTML = '<div class="admin-card">Nao foi possivel carregar as imagens deste projeto.</div>';
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
      mediaList.innerHTML = '<div class="admin-card">Este projeto ainda nao tem imagens.</div>';
      return;
    }

    mediaList.innerHTML = images.map(function (image) {
      var publicUrl = buildPublicMediaUrl(image.storage_path);
      return '' +
        '<article class="admin-media-item">' +
          '<img class="admin-media-preview" src="' + escapeHtml(publicUrl) + '" alt="' + escapeHtml(image.alt_text || "") + '">' +
          '<div class="admin-media-body">' +
            '<div class="admin-media-meta">' +
              '<strong>' + escapeHtml(image.kind === "thumb" ? "Thumb" : "Galeria") + '</strong>' +
              '<div class="admin-media-path">' + escapeHtml(image.storage_path) + '</div>' +
            '</div>' +
            '<div class="admin-media-fields">' +
              '<label class="admin-field">' +
                '<span class="admin-label">Tipo</span>' +
                '<select class="admin-input" data-media-kind="' + escapeHtml(image.id) + '">' +
                  '<option value="gallery"' + (image.kind === "gallery" ? " selected" : "") + '>Galeria</option>' +
                  '<option value="thumb"' + (image.kind === "thumb" ? " selected" : "") + '>Thumb</option>' +
                '</select>' +
              '</label>' +
              '<label class="admin-field">' +
                '<span class="admin-label">Alt</span>' +
                '<input class="admin-input" data-media-alt="' + escapeHtml(image.id) + '" type="text" value="' + escapeHtml(image.alt_text || "") + '">' +
              '</label>' +
              '<label class="admin-field">' +
                '<span class="admin-label">Ordem</span>' +
                '<input class="admin-input" data-media-sort="' + escapeHtml(image.id) + '" type="number" value="' + escapeHtml(image.sort_order) + '">' +
              '</label>' +
              '<label class="admin-media-toggle">' +
                '<input data-media-published="' + escapeHtml(image.id) + '" type="checkbox"' + (image.is_published ? " checked" : "") + '>' +
                '<span>Publicada</span>' +
              '</label>' +
            '</div>' +
            '<div class="admin-media-actions">' +
              '<button class="admin-secondary-button" type="button" data-save-media="' + escapeHtml(image.id) + '">Salvar midia</button>' +
              '<button class="admin-danger-button" type="button" data-remove-media="' + escapeHtml(image.id) + '">Remover midia</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join("");
  }

  function renderTagResults() {
    var project = getSelectedProject();
    var query = String(tagSearch.value || "").trim().toLowerCase();

    if (!project) {
      tagResults.innerHTML = "";
      addTagButton.disabled = true;
      tagList.innerHTML = "";
      return;
    }

    var linkedIds = state.projectTagsByProject[project.id] || [];
    var matches = state.tags.filter(function (tag) {
      if (linkedIds.indexOf(tag.id) !== -1) return false;
      if (!query) return true;
      var haystack = [tag.label, tag.slug, tag.group_name].join(" ").toLowerCase();
      return haystack.indexOf(query) !== -1;
    }).slice(0, 30);

    if (!matches.length) {
      tagResults.innerHTML = '<option value="">Nenhuma tag disponivel</option>';
      addTagButton.disabled = true;
      return;
    }

    tagResults.innerHTML = matches.map(function (tag) {
      return '<option value="' + escapeHtml(tag.id) + '">' +
        escapeHtml(tag.label) + ' · ' + escapeHtml(tag.group_name) +
      '</option>';
    }).join("");

    tagResults.selectedIndex = 0;
    syncTagActionState();
  }

  function renderTagList() {
    var project = getSelectedProject();
    if (!project) {
      tagList.innerHTML = "";
      return;
    }

    var linkedIds = state.projectTagsByProject[project.id] || [];
    var linkedTags = linkedIds
      .map(getTagById)
      .filter(Boolean);

    if (!linkedTags.length) {
      tagList.innerHTML = '<div class="admin-card">Nenhuma tag vinculada a este projeto.</div>';
      return;
    }

    tagList.innerHTML = linkedTags.map(function (tag) {
      return '' +
        '<div class="admin-tag-item">' +
          '<div class="admin-tag-main">' +
            '<strong>' + escapeHtml(tag.label) + '</strong>' +
            '<div class="admin-tag-meta">' + escapeHtml(tag.slug) + ' · ' + escapeHtml(tag.group_name) + (tag.is_public ? ' · publica' : ' · interna') + '</div>' +
          '</div>' +
          '<button class="admin-danger-button" type="button" data-remove-tag="' + escapeHtml(tag.id) + '">Remover</button>' +
        '</div>';
    }).join("");
  }

  function syncTagActionState() {
    addTagButton.disabled = !tagResults.value;
  }

  function handleAddTag() {
    var project = getSelectedProject();
    var tagId = tagResults.value;
    if (!project || !tagId) return;

    setSaveState("Vinculando tag...");

    fetch(backend.url + "/rest/v1/project_tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        project_id: project.id,
        tag_id: tagId
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao vincular tag");
          });
        }
        return response.json();
      })
      .then(function () {
        if (!state.projectTagsByProject[project.id]) {
          state.projectTagsByProject[project.id] = [];
        }
        state.projectTagsByProject[project.id].push(tagId);
        tagSearch.value = "";
        renderTagResults();
        renderTagList();
        setSaveState("Tag vinculada");
      })
      .catch(function () {
        setSaveState("Erro ao vincular tag");
      });
  }

  function handleCreateTag(event) {
    if (event && event.preventDefault) event.preventDefault();

    var label = String(newTagLabel.value || "").trim();
    var slug = sanitizeSlug(label);
    if (!label || !slug) {
      setNewTagFeedback("Digite um nome valido para a nova tag.", true);
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
        group_name: String(newTagGroup.value || "tema"),
        is_public: Boolean(newTagPublic.checked)
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
            return (left.group_name + left.label).localeCompare(right.group_name + right.label);
          });
        }
        newTagLabel.value = "";
        newTagGroup.value = "tema";
        newTagPublic.checked = true;
        renderTagResults();
        setNewTagFeedback("Tag criada com sucesso.", false);
      })
      .catch(function (error) {
        setNewTagFeedback("Nao foi possivel criar a tag: " + error.message, true);
      });
  }

  function handleTagRemoval(event) {
    var button = event.target.closest("[data-remove-tag]");
    if (!button) return;

    var project = getSelectedProject();
    var tagId = button.getAttribute("data-remove-tag");
    if (!project || !tagId) return;

    setSaveState("Removendo tag...");

    fetch(backend.url + "/rest/v1/project_tags?project_id=eq." + encodeURIComponent(project.id) + "&tag_id=eq." + encodeURIComponent(tagId), {
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
        state.projectTagsByProject[project.id] = (state.projectTagsByProject[project.id] || []).filter(function (id) {
          return id !== tagId;
        });
        renderTagResults();
        renderTagList();
        setSaveState("Tag removida");
      })
      .catch(function () {
        setSaveState("Erro ao remover tag");
      });
  }

  function renderPairResults() {
    var project = getSelectedProject();
    var query = String(pairSearch.value || "").trim().toLowerCase();

    if (!project) {
      pairSearch.disabled = true;
      pairResults.disabled = true;
      addPairButton.disabled = true;
      pairResults.innerHTML = "";
      pairList.innerHTML = "";
      return;
    }

    pairSearch.disabled = false;
    pairResults.disabled = false;

    if (!query) {
      pairResults.innerHTML = '<option value="">Digite para buscar um projeto</option>';
      addPairButton.disabled = true;
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
      pairResults.innerHTML = '<option value="">Nenhum projeto encontrado</option>';
      addPairButton.disabled = true;
      return;
    }

    pairResults.innerHTML = matches.map(function (candidate) {
      return '<option value="' + escapeHtml(candidate.id) + '">' +
        escapeHtml(candidate.title) + ' · ' + escapeHtml(candidate.slug) +
      '</option>';
    }).join("");

    pairResults.selectedIndex = 0;
    syncPairActionState();
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
              '<div class="admin-pair-meta">' + escapeHtml(pairedProject.slug) + ' · ' + escapeHtml(pair.pair_type) + '</div>' +
            '</div>' +
            '<button class="admin-danger-button" type="button" data-remove-pair="' + escapeHtml(pair.id) + '" data-paired-project-id="' + escapeHtml(pairedProject.id) + '">Remover</button>' +
          '</div>';
      })
      .filter(Boolean);

    if (!items.length) {
      pairList.innerHTML = '<div class="admin-card">Nenhum par conectado a este projeto.</div>';
      return;
    }

    pairList.innerHTML = items.join("");
  }

  function syncPairActionState() {
    addPairButton.disabled = !pairResults.value;
  }

  function handleAddPair() {
    var project = getSelectedProject();
    var pairedProjectId = pairResults.value;
    if (!project || !pairedProjectId) return;

    if (hasPair(project.id, pairedProjectId)) {
      setSaveState("Esse par ja existe");
      return;
    }

    setSaveState("Adicionando par...");
    addPairButton.disabled = true;

    fetch(backend.url + "/rest/v1/project_pairs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify([
        {
          project_id: project.id,
          paired_project_id: pairedProjectId,
          pair_type: "pair"
        },
        {
          project_id: pairedProjectId,
          paired_project_id: project.id,
          pair_type: "pair"
        }
      ])
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao adicionar par");
          });
        }
        return response.json();
      })
      .then(function (items) {
        state.pairs = state.pairs.concat(items || []);
        pairSearch.value = "";
        renderPairResults();
        renderPairList();
        setSaveState("Par adicionado");
      })
      .catch(function (error) {
        setSaveState("Erro ao adicionar par");
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
    var kind = String(mediaKind.value || "gallery");
    if (!project || !files || !files.length) {
      setSaveState("Selecione ao menos uma imagem");
      return;
    }

    setSaveState("Enviando imagens...");

    var uploads = Array.prototype.map.call(files, function (file, index) {
      return uploadSingleImage(project, file, kind, index);
    });

    Promise.all(uploads)
      .then(function () {
        mediaFiles.value = "";
        setSaveState("Midia enviada");
        loadProjectImages(project.id);
      })
      .catch(function () {
        setSaveState("Erro ao enviar midia");
      });
  }

  function uploadSingleImage(project, file, kind, index) {
    var nextPath = project.slug + "/" + Date.now() + "-" + index + "-" + sanitizeFilename(file.name);
    var existingItems = state.imagesByProject[project.id] || [];
    var nextSortOrder = existingItems.filter(function (item) {
      return item.kind === kind;
    }).length;

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
            throw new Error(payload.message || payload.msg || "falha no upload");
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
            sort_order: nextSortOrder,
            is_published: true
          })
        });
      })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao registrar imagem");
          });
        }
      });
  }

  function handleMediaListClick(event) {
    var saveButton = event.target.closest("[data-save-media]");
    if (saveButton) {
      handleMediaMetadataSave(saveButton.getAttribute("data-save-media"));
      return;
    }

    var removeButton = event.target.closest("[data-remove-media]");
    if (removeButton) {
      handleMediaRemoval(removeButton.getAttribute("data-remove-media"));
    }
  }

  function handleMediaMetadataSave(imageId) {
    var project = getSelectedProject();
    var image = getProjectImageById(project && project.id, imageId);
    if (!project || !image) return;

    var nextKind = getValue("[data-media-kind=\"" + cssEscape(imageId) + "\"]");
    var nextAlt = getValue("[data-media-alt=\"" + cssEscape(imageId) + "\"]");
    var nextSortOrder = Number(getValue("[data-media-sort=\"" + cssEscape(imageId) + "\"]") || 0);
    var nextPublished = getChecked("[data-media-published=\"" + cssEscape(imageId) + "\"]");

    setSaveState("Salvando midia...");

    fetch(backend.url + "/rest/v1/project_images?id=eq." + encodeURIComponent(imageId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      },
      body: JSON.stringify({
        kind: nextKind,
        alt_text: nextAlt || null,
        sort_order: nextSortOrder,
        is_published: Boolean(nextPublished)
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao salvar midia");
          });
        }
        return response.json();
      })
      .then(function (items) {
        if (items && items.length) {
          replaceProjectImage(project.id, items[0]);
          renderMediaList();
          syncPublicationChecklist(project);
        }
        setSaveState("Midia salva");
      })
      .catch(function () {
        setSaveState("Erro ao salvar midia");
      });
  }

  function handleMediaRemoval(imageId) {
    var project = getSelectedProject();
    var image = getProjectImageById(project && project.id, imageId);
    if (!project || !image) return;

    setSaveState("Removendo midia...");

    fetch(backend.url + "/storage/v1/object/project-media/" + encodeStoragePath(image.storage_path), {
      method: "DELETE",
      headers: {
        apikey: backend.anonKey,
        Authorization: "Bearer " + state.token
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            throw new Error(payload.message || payload.msg || "falha ao remover arquivo");
          });
        }

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
        setSaveState("Erro ao remover midia");
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
    bulkImportFeedback.textContent = message;
    bulkImportFeedback.classList.toggle("is-error", Boolean(isError));
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
      section.hidden = !isActive;
    });
  }

  function clearBulkImportForm() {
    bulkImportInput.value = "";
    bulkImportBatch.value = "";
    bulkImportStatus.value = "draft";
    setBulkImportFeedback("", false);
  }

  function updatePublicationPanel(project) {
    if (!project) {
      publicationPill.textContent = "Draft";
      publicationPill.dataset.status = "draft";
      publicationState.textContent = "Draft";
      publicationDate.textContent = "Ainda nao publicado";
      markDraftButton.disabled = true;
      markReviewButton.disabled = true;
      publishButton.disabled = true;
      archiveButton.disabled = true;
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
    publicationDate.textContent = project.published_at ? formatDateTime(project.published_at) : "Ainda nao publicado";
    markDraftButton.disabled = status === "draft";
    markReviewButton.disabled = status === "review";
    publishButton.disabled = status === "published";
    archiveButton.disabled = status === "archived";
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
          '<div>' +
            '<strong>' + escapeHtml(item.label) + '</strong>' +
            '<small>' + escapeHtml(item.help) + '</small>' +
          '</div>' +
          '<span class="admin-check-badge ' + (item.ok ? 'is-ok' : 'is-missing') + '">' + (item.ok ? 'ok' : 'falta') + '</span>' +
        '</div>';
    }).join("");
  }

  function getPublicationChecks(project) {
    var images = state.imagesByProject[project.id] || [];
    var hasThumb = images.some(function (image) {
      return image.kind === "thumb";
    });
    var hasPrimaryImage = images.some(function (image) {
      return image.kind === "gallery" && image.sort_order === 0;
    });

    return [
      {
        label: "Titulo principal",
        ok: Boolean(String(project.title || "").trim()),
        help: "O projeto pode ser publicado com o titulo principal definido."
      },
      {
        label: "Cliente / editora",
        ok: Boolean(String(project.client || "").trim()),
        help: "Ajuda a localizar e filtrar o projeto depois."
      },
      {
        label: "Tipo",
        ok: Boolean(String(project.project_type || "").trim()),
        help: "Livro, revista, HQ ou outra classificacao basica."
      },
      {
        label: "Thumb",
        ok: hasThumb,
        help: "A thumb e o recorte principal da navegacao no portfolio."
      },
      {
        label: "Imagem 01",
        ok: hasPrimaryImage,
        help: "A primeira imagem de galeria deve existir para abrir o projeto."
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

  function hasEditorialFlag(projectId, flagKey) {
    return (state.editorialFlagsByProject[projectId] || []).some(function (flag) {
      return flag.flag_key === flagKey;
    });
  }

  function renderProjectFlagPills(projectId) {
    var pills = [];

    if (hasEditorialFlag(projectId, "review_text")) {
      pills.push('<span class="admin-status-pill is-review-flag">Texto em revisao</span>');
    } else {
      pills.push('<span class="admin-status-pill is-approved-flag">Texto ok</span>');
    }

    if (hasEditorialFlag(projectId, "future_feature")) {
      pills.push('<span class="admin-status-pill is-future-flag">Destaque futuro</span>');
    }

    return pills.join("");
  }

  function renderEditorialFlagSummary(projectId) {
    var pills = [];

    if (hasEditorialFlag(projectId, "review_text")) {
      pills.push('<span class="admin-status-pill is-review-flag">Texto em revisao</span>');
    } else {
      pills.push('<span class="admin-status-pill is-approved-flag">Texto aprovado</span>');
    }

    if (hasEditorialFlag(projectId, "future_feature")) {
      pills.push('<span class="admin-status-pill is-future-flag">Destaque futuro</span>');
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
    return backend.url + "/storage/v1/object/public/project-media/" + encodeStoragePath(storagePath);
  }

  function encodeStoragePath(storagePath) {
    return String(storagePath || "")
      .split("/")
      .map(function (part) { return encodeURIComponent(part); })
      .join("/");
  }

  function sanitizeFilename(value) {
    return String(value || "arquivo")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, "-")
      .replace(/-{2,}/g, "-");
  }

  function getValue(selector) {
    var element = document.querySelector(selector);
    return element ? String(element.value || "") : "";
  }

  function getChecked(selector) {
    var element = document.querySelector(selector);
    return element ? Boolean(element.checked) : false;
  }

  function cssEscape(value) {
    return String(value || "").replace(/"/g, '\\"');
  }

  function parseBulkImportInput(rawInput) {
    var trimmed = String(rawInput || "").trim();
    if (!trimmed) return [];

    if (trimmed.charAt(0) === "[" || trimmed.charAt(0) === "{") {
      return parseBulkImportJson(trimmed);
    }

    return parseBulkImportLines(trimmed);
  }

  function parseBulkImportJson(rawInput) {
    var parsed = JSON.parse(rawInput);
    var items = Array.isArray(parsed) ? parsed : [parsed];

    return items.map(function (item, index) {
      if (!item || typeof item !== "object") {
        throw new Error("O item " + (index + 1) + " do JSON nao e um objeto valido.");
      }

      return {
        slug: item.slug,
        title: item.title || item.titulo,
        subtitle: item.subtitle || item.subtitulo,
        client: item.client || item.cliente || item.editora,
        project_type: item.project_type || item.tipo,
        description: item.description || item.descricao,
        publication_notes: item.publication_notes || item.notas_editoriais
      };
    });
  }

  function parseBulkImportLines(rawInput) {
    return rawInput
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line, index) {
        var parts = line.split("|").map(function (part) { return part.trim(); });
        if (parts.length < 2) {
          throw new Error("A linha " + (index + 1) + " precisa ter ao menos slug e titulo.");
        }

        return {
          slug: parts[0],
          title: parts[1],
          client: parts[2] || null,
          project_type: parts[3] || null
        };
      });
  }

  function normalizeOptionalText(value) {
    var text = String(value == null ? "" : value).trim();
    return text || null;
  }

  function resolvePublishedAt(project, nextStatus) {
    if (nextStatus === "published") {
      return project.published_at || new Date().toISOString();
    }
    return null;
  }

  function formatStatusLabel(status) {
    if (status === "review") return "Review";
    if (status === "published") return "Published";
    if (status === "archived") return "Archived";
    return "Draft";
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

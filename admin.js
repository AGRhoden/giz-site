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
  var newTagForm = document.getElementById("new-tag-form");
  var newTagLabel = document.getElementById("new-tag-label");
  var newTagFeedback = document.getElementById("new-tag-feedback");
  var pairSearch = document.getElementById("pair-search");
  var pairResults = document.getElementById("pair-results");
  var pairList = document.getElementById("pair-list");
  var mediaUploadForm = document.getElementById("media-upload-form");
  var mediaFiles = document.getElementById("media-files");
  var mediaKind = document.getElementById("media-kind");
  var mediaList = document.getElementById("media-list");
  var newProjectForm = document.getElementById("new-project-form");
  var intakeFiles = document.getElementById("intake-files");
  var intakeOverwrite = document.getElementById("intake-overwrite");
  var bulkImportFeedback = document.getElementById("bulk-import-feedback");
  var intakeReport = document.getElementById("intake-report");

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
    state.selectedProjectId = null;
    setAuthFeedback("Sessao encerrada.", false);
    renderAuthState();
  });

  projectSearch.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  projectList.addEventListener("click", handleProjectSelection);
  editorForm.addEventListener("click", handleEditorTabClick);
  editorForm.addEventListener("submit", handleProjectSave);
  newProjectForm.addEventListener("submit", handleIntakeUpload);
  mediaUploadForm.addEventListener("submit", handleMediaUpload);
  mediaList.addEventListener("click", handleMediaListClick);
  tagSearch.addEventListener("input", renderTagResults);
  tagResults.addEventListener("click", handleTagToggle);
  newTagForm.addEventListener("submit", handleCreateTag);
  flagReviewText.addEventListener("change", handleEditorialFlagChange);
  flagFutureFeature.addEventListener("change", handleEditorialFlagChange);
  pairSearch.addEventListener("input", renderPairResults);
  pairResults.addEventListener("click", handleAddPair);
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
      state.imagesByProject = {};
      state.projectTagsByProject = {};
      state.editorialFlagsByProject = {};
      setHidden(mediaUploadForm, true);
      pairResults.innerHTML = "";
      pairList.innerHTML = "";
      mediaList.innerHTML = "";
      tagResults.innerHTML = "";
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
    sessionEmail.textContent = state.sessionEmail || "sessao ativa";

    if (!isLoggedIn) {
      projectCount.textContent = "0";
      projectList.innerHTML = "";
      setHidden(editorEmpty, false);
      setHidden(editorForm, true);
      renderEditorTabs();
      updatePublicationPanel(null);
      setSaveState("Pronto");
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
      setAuthFeedback("Digite um e-mail valido.", true);
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
        setAuthFeedback("Nao foi possivel entrar: " + error.message, true);
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
      setAuthFeedback("Digite um e-mail valido.", true);
      return;
    }

    authSubmitButton.disabled = true;
    authRecoveryButton.disabled = true;
    authMagicLinkButton.disabled = true;
    authMagicLinkButton.textContent = "Enviando...";
    setAuthFeedback("Enviando link magico...", false);

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
        authMagicLinkButton.textContent = "Enviar link magico";
      })
      .catch(function (error) {
        setAuthFeedback("Nao foi possivel enviar o acesso: " + error.message, true);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authMagicLinkButton.textContent = "Enviar link magico";
      });
  }

  function submitPasswordRecovery() {
    var email = "";
    if (authForm.elements && authForm.elements.email) {
      email = String(authForm.elements.email.value || "").trim().toLowerCase();
    }

    if (!email || email.indexOf("@") === -1) {
      setAuthFeedback("Digite um e-mail valido.", true);
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
            throw new Error(payload.msg || payload.error_description || "falha ao enviar recuperacao");
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
        setAuthFeedback("Nao foi possivel enviar a recuperacao: " + error.message, true);
        authSubmitButton.disabled = false;
        authRecoveryButton.disabled = false;
        authMagicLinkButton.disabled = false;
        authRecoveryButton.textContent = "Definir ou recuperar senha";
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
      setHidden(editorEmpty, false);
      setHidden(editorForm, true);
      renderEditorTabs();
      updatePublicationPanel(null);
      return;
    }

    setHidden(editorEmpty, true);
    setHidden(editorForm, false);
    setHidden(mediaUploadForm, false);
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
    updatePublicationPanel(project);
    syncEditorialFlagsPanel(project.id);
    renderMediaList();
    loadProjectImages(project.id);
    renderTagResults();
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
        is_featured: Boolean(project.is_featured),
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
      setBulkImportFeedback("Nenhum arquivo valido foi reconhecido.", true);
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

        setBulkImportFeedback("Upload concluido.", false);
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
        setBulkImportFeedback("Nao foi possivel criar os projetos: " + error.message, true);
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
      return;
    }

    var linkedIds = state.projectTagsByProject[project.id] || [];
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
        '<button class="admin-chip ' + (isActive ? 'is-active' : '') + '" type="button" data-toggle-tag="' + escapeHtml(tag.id) + '">' +
          escapeHtml(tag.label) +
        '</button>';
    }).join("");
  }

  function handleTagToggle(event) {
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

  function handleCreateTag(event) {
    if (event && event.preventDefault) event.preventDefault();

    var project = getSelectedProject();
    var label = String(newTagLabel.value || "").trim();
    var slug = sanitizeSlug(label);
    if (!label || !slug) {
      setNewTagFeedback("Digite um nome valido para a nova tag.", true);
      return;
    }

    var existingTag = state.tags.find(function (tag) {
      return tag.slug === slug || normalizeTitleKey(tag.label) === normalizeTitleKey(label);
    });

    if (existingTag) {
      if (!project) {
        setNewTagFeedback("Essa tag ja existe.", true);
        return;
      }

      addTagToProject(project.id, existingTag.id)
        .then(function () {
          newTagLabel.value = "";
          setNewTagFeedback("Essa tag ja existia e foi marcada no projeto.", false);
        })
        .catch(function () {
          setNewTagFeedback("Nao foi possivel marcar a tag existente.", true);
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
        setNewTagFeedback("Nao foi possivel criar a tag: " + error.message, true);
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
      pairResults.innerHTML = "";
      pairList.innerHTML = "";
      return;
    }

    pairSearch.disabled = false;

    if (!query) {
      pairResults.innerHTML = "";
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
      return;
    }

    pairResults.innerHTML = matches.map(function (candidate) {
      return '' +
        '<button class="admin-pair-result" type="button" data-add-pair="' + escapeHtml(candidate.id) + '">' +
          '<strong>' + escapeHtml(candidate.title) + '</strong>' +
          '<span>' + escapeHtml(candidate.slug) + '</span>' +
        '</button>';
    }).join("");
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
              '<div class="admin-pair-meta">' + escapeHtml(pairedProject.slug) + '</div>' +
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

  function handleAddPair(event) {
    var button = event.target.closest("[data-add-pair]");
    if (!button) return;

    var project = getSelectedProject();
    var pairedProjectId = button.getAttribute("data-add-pair");
    if (!project || !pairedProjectId) return;

    if (hasPair(project.id, pairedProjectId)) {
      setSaveState("Esse par ja existe");
      return;
    }

    setSaveState("Adicionando par...");

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
      .catch(function () {
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

  function normalizeTitleKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
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
    if (!bulkImportFeedback) return;
    bulkImportFeedback.textContent = message;
    bulkImportFeedback.classList.toggle("is-error", Boolean(isError));
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
      blocks.push(renderIntakeReportGroup("Titulos repetidos ou muito proximos", report.duplicateTitles, "is-warning"));
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
      publicationPill.textContent = "Draft";
      publicationPill.dataset.status = "draft";
      publicationState.textContent = "Draft";
      publicationDate.textContent = "Ainda nao publicado";
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

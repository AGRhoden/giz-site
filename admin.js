(function () {
  var backend = window.GIZ_BACKEND_CONFIG || {};
  var AUTH_STORAGE_KEY = "giz_admin_access_token";

  var authScreen = document.getElementById("auth-screen");
  var adminApp = document.getElementById("admin-app");
  var authForm = document.getElementById("auth-form");
  var authFeedback = document.getElementById("auth-feedback");
  var authSubmitButton = document.getElementById("auth-submit-button");
  var debugStage = document.getElementById("debug-stage");
  var debugHash = document.getElementById("debug-hash");
  var debugSession = document.getElementById("debug-session");
  var debugProjects = document.getElementById("debug-projects");
  var debugError = document.getElementById("debug-error");
  var debugSdk = document.getElementById("debug-sdk");
  var debugConfig = document.getElementById("debug-config");
  var sessionEmail = document.getElementById("session-email");
  var logoutButton = document.getElementById("logout-button");
  var projectSearch = document.getElementById("project-search");
  var statusFilter = document.getElementById("status-filter");
  var projectCount = document.getElementById("project-count");
  var projectList = document.getElementById("project-list");
  var editorEmpty = document.getElementById("editor-empty");
  var editorForm = document.getElementById("editor-form");
  var editorSlug = document.getElementById("editor-slug");
  var editorTitle = document.getElementById("editor-title");
  var saveState = document.getElementById("save-state");
  var fieldTitle = document.getElementById("field-title");
  var fieldSubtitle = document.getElementById("field-subtitle");
  var fieldClient = document.getElementById("field-client");
  var fieldType = document.getElementById("field-type");
  var fieldStatus = document.getElementById("field-status");
  var fieldDescription = document.getElementById("field-description");
  var pairSearch = document.getElementById("pair-search");
  var pairResults = document.getElementById("pair-results");
  var addPairButton = document.getElementById("add-pair-button");
  var pairList = document.getElementById("pair-list");
  var newProjectButton = document.getElementById("new-project-button");
  var newProjectForm = document.getElementById("new-project-form");
  var newProjectSlug = document.getElementById("new-project-slug");
  var newProjectTitle = document.getElementById("new-project-title");
  var cancelNewProjectButton = document.getElementById("cancel-new-project-button");

  var state = {
    token: null,
    sessionEmail: "",
    projects: [],
    filteredProjects: [],
    selectedProjectId: null
  };

  window.__gizAdminInlineClick = function (event) {
    if (event && event.preventDefault) event.preventDefault();
    if (event && event.stopPropagation) event.stopPropagation();
    updateDebug({ stage: "inline-click", error: "nenhum" });
    authSubmitButton.textContent = "Clicado";
    submitAuthRequest();
  };

  if (!backend.url || !backend.anonKey) {
    updateDebug({
      stage: "erro-config",
      config: "config-ausente",
      error: "backend config ausente"
    });
    setAuthFeedback("Backend config ausente no admin.", true);
    return;
  }

  updateDebug({
    stage: "init",
    hash: window.location.hash ? "hash presente" : "sem hash",
    sdk: "sdk-nao-usado",
    config: "config-ok"
  });

  authForm.addEventListener("submit", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    submitAuthRequest();
  });

  authSubmitButton.addEventListener("click", function (event) {
    if (event && event.preventDefault) event.preventDefault();
    updateDebug({ stage: "click-submit", error: "nenhum" });
    submitAuthRequest();
  });

  logoutButton.addEventListener("click", function () {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    state.token = null;
    state.sessionEmail = "";
    state.projects = [];
    state.filteredProjects = [];
    state.selectedProjectId = null;
    setAuthFeedback("Sessao encerrada.", false);
    renderAuthState();
  });

  projectSearch.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  projectList.addEventListener("click", handleProjectSelection);
  editorForm.addEventListener("submit", handleProjectSave);
  newProjectButton.addEventListener("click", toggleNewProjectForm);
  cancelNewProjectButton.addEventListener("click", toggleNewProjectForm);
  newProjectForm.addEventListener("submit", handleCreateProject);

  pairSearch.disabled = true;
  pairResults.disabled = true;
  addPairButton.disabled = true;
  pairList.innerHTML = '<div class="admin-card">Gestao de pares volta depois que o login estiver estavel.</div>';

  boot();

  function boot() {
    tryConsumeHash();

    state.token = sessionStorage.getItem(AUTH_STORAGE_KEY);
    renderAuthState();

    if (state.token) {
      loadProjects();
    } else {
      updateDebug({ stage: "aguardando-login", session: "sem sessao" });
      setAuthFeedback("Entre com um e-mail autorizado para acessar o painel.", false);
    }
  }

  function tryConsumeHash() {
    if (!window.location.hash || window.location.hash.charAt(0) !== "#") return;

    var hash = new URLSearchParams(window.location.hash.slice(1));
    var accessToken = hash.get("access_token");
    var email = decodeURIComponent(hash.get("email") || "");
    var authError = hash.get("error_description") || hash.get("error_code");

    updateDebug({ hash: accessToken ? "tokens presentes" : "hash sem tokens" });

    if (authError) {
      updateDebug({
        stage: "erro-hash",
        error: decodeURIComponent(authError)
      });
      setAuthFeedback("Falha no link de acesso: " + decodeURIComponent(authError), true);
      clearHash();
      return;
    }

    if (!accessToken) return;

    sessionStorage.setItem(AUTH_STORAGE_KEY, accessToken);
    state.token = accessToken;
    state.sessionEmail = email || "admin autenticado";
    updateDebug({
      stage: "token-capturado",
      session: state.sessionEmail
    });
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
    sessionEmail.textContent = state.sessionEmail || "sessao ativa";
    updateDebug({ session: isLoggedIn ? (state.sessionEmail || "token salvo") : "sem sessao" });

    if (!isLoggedIn) {
      projectCount.textContent = "0";
      projectList.innerHTML = "";
      editorEmpty.hidden = false;
      editorForm.hidden = true;
    }
  }

  function submitAuthRequest() {
    var email = "";
    if (authForm.elements && authForm.elements.email) {
      email = String(authForm.elements.email.value || "").trim().toLowerCase();
    }

    updateDebug({ stage: "submit-handler", error: "nenhum" });

    if (!email || email.indexOf("@") === -1) {
      setAuthFeedback("Digite um e-mail valido.", true);
      updateDebug({ stage: "form-invalid", error: "e-mail invalido ou ausente" });
      return;
    }

    authSubmitButton.disabled = true;
    authSubmitButton.textContent = "Enviando...";
    setAuthFeedback("Enviando magic link...", false);
    updateDebug({ stage: "enviando-magic-link", error: "nenhum" });

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
        updateDebug({ stage: "magic-link-enviado", session: email });
        setAuthFeedback("Link enviado para " + email + ".", false);
        authSubmitButton.disabled = false;
        authSubmitButton.textContent = "Reenviar acesso";
        window.alert("Link enviado para " + email + ". Abra o e-mail e clique em Log In.");
      })
      .catch(function (error) {
        updateDebug({ stage: "erro-envio", error: error.message });
        setAuthFeedback("Nao foi possivel enviar o acesso: " + error.message, true);
        authSubmitButton.disabled = false;
        authSubmitButton.textContent = "Enviar acesso";
      });
  }

  function loadProjects() {
    updateDebug({ stage: "carregando-projetos", error: "nenhum" });

    fetch(backend.url + "/rest/v1/projects?select=id,slug,title,subtitle,description,client,project_type,status&order=title.asc", {
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
        updateDebug({
          stage: "projetos-carregados",
          projects: String(state.projects.length),
          error: "nenhum"
        });
        renderAuthState();
        applyFilters();
      })
      .catch(function (error) {
        updateDebug({ stage: "erro-projetos", error: error.message });
        setSaveState("Erro ao carregar projetos");
        projectList.innerHTML = '<div class="admin-card">Nao foi possivel carregar os projetos.</div>';
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
          "<strong>" + escapeHtml(project.title) + "</strong>" +
          '<div class="admin-project-meta">' +
            "<span>" + escapeHtml(project.client || "sem cliente") + "</span>" +
            "<span>" + escapeHtml(project.status) + "</span>" +
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

  function renderEditor() {
    var project = getSelectedProject();
    if (!project) {
      editorEmpty.hidden = false;
      editorForm.hidden = true;
      return;
    }

    editorEmpty.hidden = true;
    editorForm.hidden = false;
    editorSlug.textContent = project.slug;
    editorTitle.textContent = project.title;
    fieldTitle.value = project.title || "";
    fieldSubtitle.value = project.subtitle || "";
    fieldClient.value = project.client || "";
    fieldType.value = project.project_type || "";
    fieldStatus.value = project.status || "draft";
    fieldDescription.value = project.description || "";
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

    var project = getSelectedProject();
    if (!project) return;

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
        title: String(fieldTitle.value || "").trim(),
        subtitle: String(fieldSubtitle.value || "").trim() || null,
        client: String(fieldClient.value || "").trim() || null,
        project_type: String(fieldType.value || "").trim() || null,
        status: String(fieldStatus.value || "draft"),
        description: String(fieldDescription.value || "").trim() || null
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
          applyFilters();
        }
        setSaveState("Salvo");
      })
      .catch(function (error) {
        updateDebug({ stage: "erro-save", error: error.message });
        setSaveState("Erro ao salvar");
      });
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
          state.selectedProjectId = items[0].id;
          newProjectForm.hidden = true;
          newProjectSlug.value = "";
          newProjectTitle.value = "";
          applyFilters();
        }
        setSaveState("Draft criado");
      })
      .catch(function (error) {
        updateDebug({ stage: "erro-create", error: error.message });
        setSaveState("Erro ao criar");
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

  function setAuthFeedback(message, isError) {
    authFeedback.textContent = message;
    authFeedback.classList.toggle("is-error", Boolean(isError));
  }

  function setSaveState(message) {
    saveState.textContent = message;
  }

  function updateDebug(nextState) {
    if (nextState.stage) debugStage.textContent = nextState.stage;
    if (nextState.hash) debugHash.textContent = nextState.hash;
    if (nextState.session) debugSession.textContent = nextState.session;
    if (nextState.projects) debugProjects.textContent = nextState.projects;
    if (nextState.error) debugError.textContent = nextState.error;
    if (nextState.sdk) debugSdk.textContent = nextState.sdk;
    if (nextState.config) debugConfig.textContent = nextState.config;
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

const backend = window.GIZ_BACKEND_CONFIG || {};
const supabaseBrowser = window.supabase;

const PROJECT_SELECT = `
  id,
  slug,
  title,
  subtitle,
  description,
  client,
  project_type,
  status,
  project_pairs (
    id,
    project_id,
    pair_type,
    label_override,
    paired_project_id,
    paired:projects!project_pairs_paired_project_id_fkey (
      id,
      slug,
      title,
      subtitle
    )
  )
`;

const PAIR_SELECT = `
  id,
  project_id,
  pair_type,
  label_override,
  paired_project_id,
  paired:projects!project_pairs_paired_project_id_fkey (
    id,
    slug,
    title,
    subtitle
  )
`;

const adminState = {
  session: null,
  projects: [],
  filteredProjects: [],
  selectedProjectId: null,
  pairCandidates: []
};

const authScreen = document.getElementById("auth-screen");
const adminApp = document.getElementById("admin-app");
const authForm = document.getElementById("auth-form");
const authFeedback = document.getElementById("auth-feedback");
const sessionEmail = document.getElementById("session-email");
const logoutButton = document.getElementById("logout-button");
const projectSearch = document.getElementById("project-search");
const statusFilter = document.getElementById("status-filter");
const projectCount = document.getElementById("project-count");
const projectList = document.getElementById("project-list");
const newProjectButton = document.getElementById("new-project-button");
const newProjectForm = document.getElementById("new-project-form");
const newProjectSlug = document.getElementById("new-project-slug");
const newProjectTitle = document.getElementById("new-project-title");
const cancelNewProjectButton = document.getElementById("cancel-new-project-button");
const editorEmpty = document.getElementById("editor-empty");
const editorForm = document.getElementById("editor-form");
const editorSlug = document.getElementById("editor-slug");
const editorTitle = document.getElementById("editor-title");
const saveState = document.getElementById("save-state");
const fieldTitle = document.getElementById("field-title");
const fieldSubtitle = document.getElementById("field-subtitle");
const fieldClient = document.getElementById("field-client");
const fieldType = document.getElementById("field-type");
const fieldStatus = document.getElementById("field-status");
const fieldDescription = document.getElementById("field-description");
const pairSearch = document.getElementById("pair-search");
const pairResults = document.getElementById("pair-results");
const addPairButton = document.getElementById("add-pair-button");
const pairList = document.getElementById("pair-list");

let supabase = null;

initializeAdmin();

function initializeAdmin() {
  if (!backend.url || !backend.anonKey) {
    setAuthFeedback("Backend config ausente no admin.", true);
    return;
  }

  if (!supabaseBrowser?.createClient) {
    setAuthFeedback("Biblioteca do Supabase nao carregou. Recarregue a pagina.", true);
    return;
  }

  supabase = supabaseBrowser.createClient(backend.url, backend.anonKey);

  authForm.addEventListener("submit", handleAuthSubmit);
  logoutButton.addEventListener("click", handleLogout);
  projectSearch.addEventListener("input", applyProjectFilters);
  statusFilter.addEventListener("change", applyProjectFilters);
  projectList.addEventListener("click", handleProjectSelection);
  newProjectButton.addEventListener("click", toggleNewProjectForm);
  newProjectForm.addEventListener("submit", handleCreateProject);
  cancelNewProjectButton.addEventListener("click", toggleNewProjectForm);
  editorForm.addEventListener("submit", handleProjectSave);
  pairSearch.addEventListener("input", renderPairCandidates);
  addPairButton.addEventListener("click", handleAddPair);
  pairList.addEventListener("click", handleRemovePair);

  boot();
}

async function boot() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error(error);
    setAuthFeedback(`Falha ao iniciar sessao: ${error.message}`, true);
  }

  adminState.session = data?.session || null;
  updateAuthUI();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    adminState.session = session;
    updateAuthUI();

    if (session) {
      await loadProjects();
    }
  });

  if (adminState.session) {
    await loadProjects();
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const form = new FormData(authForm);
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!email) return;

  setAuthFeedback("Enviando magic link...", false);

  const redirectUrl = new URL("/admin", window.location.origin).toString();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectUrl
    }
  });

  if (error) {
    console.error(error);
    setAuthFeedback(`Nao foi possivel enviar o acesso: ${error.message}`, true);
    return;
  }

  setAuthFeedback("Link enviado. Abra o e-mail e volte para esta tela.", false);
}

async function handleLogout() {
  await supabase.auth.signOut();
}

function updateAuthUI() {
  const isLoggedIn = Boolean(adminState.session);

  authScreen.hidden = isLoggedIn;
  adminApp.hidden = !isLoggedIn;
  sessionEmail.textContent = adminState.session?.user?.email || "";

  if (!isLoggedIn) {
    adminState.projects = [];
    adminState.filteredProjects = [];
    adminState.selectedProjectId = null;
    projectList.innerHTML = "";
    projectCount.textContent = "0";
    editorEmpty.hidden = false;
    editorForm.hidden = true;
    setAuthFeedback("Entre com um e-mail autorizado para acessar o painel.", false);
  }
}

async function loadProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("title", { ascending: true });

  if (error) {
    console.error(error);
    projectList.innerHTML = `<div class="admin-card">Nao foi possivel carregar os projetos.</div>`;
    setSaveState("Erro ao carregar projetos", false);
    return;
  }

  adminState.projects = data || [];
  adminState.filteredProjects = [...adminState.projects];

  if (!adminState.selectedProjectId && adminState.filteredProjects.length) {
    adminState.selectedProjectId = adminState.filteredProjects[0].id;
  }

  applyProjectFilters();
}

function toggleNewProjectForm() {
  const isHidden = newProjectForm.hidden;
  newProjectForm.hidden = !isHidden;

  if (isHidden) {
    newProjectSlug.value = "";
    newProjectTitle.value = "";
    newProjectSlug.focus();
  }
}

function applyProjectFilters() {
  const query = projectSearch.value.trim().toLowerCase();
  const status = statusFilter.value;

  adminState.filteredProjects = adminState.projects.filter((project) => {
    const matchesStatus = !status || project.status === status;
    const haystack = [
      project.title,
      project.slug,
      project.client,
      project.project_type
    ].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);

    return matchesStatus && matchesQuery;
  });

  if (
    adminState.selectedProjectId &&
    !adminState.filteredProjects.some((project) => project.id === adminState.selectedProjectId)
  ) {
    adminState.selectedProjectId = adminState.filteredProjects[0]?.id || null;
  }

  renderProjectList();
  renderEditor();
}

function renderProjectList() {
  projectCount.textContent = String(adminState.filteredProjects.length);

  if (!adminState.filteredProjects.length) {
    projectList.innerHTML = `<div class="admin-card">Nenhum projeto encontrado.</div>`;
    return;
  }

  projectList.innerHTML = adminState.filteredProjects.map((project) => {
    const activeClass = project.id === adminState.selectedProjectId ? " is-active" : "";

    return `
      <button class="admin-project-item${activeClass}" type="button" data-project-id="${project.id}">
        <strong>${escapeHtml(project.title)}</strong>
        <div class="admin-project-meta">
          <span>${escapeHtml(project.client || "sem cliente")}</span>
          <span>${escapeHtml(project.status)}</span>
        </div>
      </button>
    `;
  }).join("");
}

function handleProjectSelection(event) {
  const button = event.target.closest("[data-project-id]");
  if (!button) return;

  adminState.selectedProjectId = button.dataset.projectId;
  renderProjectList();
  renderEditor();
}

function renderEditor() {
  const project = getSelectedProject();

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

  renderPairCandidates();
  renderPairList();
}

function getSelectedProject() {
  return adminState.projects.find((project) => project.id === adminState.selectedProjectId) || null;
}

async function handleProjectSave(event) {
  event.preventDefault();

  const project = getSelectedProject();
  if (!project) return;

  setSaveState("Salvando...", true);

  const payload = {
    title: fieldTitle.value.trim(),
    subtitle: fieldSubtitle.value.trim() || null,
    client: fieldClient.value.trim() || null,
    project_type: fieldType.value.trim() || null,
    status: fieldStatus.value,
    description: fieldDescription.value.trim() || null
  };

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", project.id)
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    console.error(error);
    setSaveState(`Erro ao salvar: ${error.message}`, false);
    return;
  }

  replaceProject(data);
  applyProjectFilters();
  setSaveState("Salvo", false);
}

async function handleCreateProject(event) {
  event.preventDefault();

  const slug = newProjectSlug.value.trim().toLowerCase();
  const title = newProjectTitle.value.trim();

  if (!slug || !title) {
    setSaveState("Preencha slug e titulo", false);
    return;
  }

  setSaveState("Criando draft...", true);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      slug,
      title,
      status: "draft"
    })
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    console.error(error);
    setSaveState(`Nao foi possivel criar: ${error.message}`, false);
    return;
  }

  adminState.projects = [...adminState.projects, data].sort((left, right) => {
    return left.title.localeCompare(right.title, "pt-BR");
  });
  adminState.selectedProjectId = data.id;
  newProjectForm.hidden = true;
  applyProjectFilters();
  setSaveState("Draft criado", false);
}

function renderPairCandidates() {
  const project = getSelectedProject();
  const query = pairSearch.value.trim().toLowerCase();

  if (!project) {
    pairResults.innerHTML = "";
    return;
  }

  const linkedIds = new Set((project.project_pairs || []).map((pair) => pair.paired_project_id));
  adminState.pairCandidates = adminState.projects.filter((candidate) => {
    if (candidate.id === project.id) return false;
    if (linkedIds.has(candidate.id)) return false;
    if (!query) return true;

    const haystack = [candidate.title, candidate.slug, candidate.client].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  pairResults.innerHTML = adminState.pairCandidates
    .slice(0, 50)
    .map((candidate) => {
      return `<option value="${candidate.id}">${escapeHtml(candidate.title)} (${escapeHtml(candidate.slug)})</option>`;
    })
    .join("");
}

async function handleAddPair() {
  const project = getSelectedProject();
  const pairedProjectId = pairResults.value;
  if (!project || !pairedProjectId) return;

  setSaveState("Salvando pares...", true);

  const pairPayload = [
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
  ];

  const { data, error } = await supabase
    .from("project_pairs")
    .upsert(pairPayload, {
      onConflict: "project_id,paired_project_id,pair_type"
    })
    .select(PAIR_SELECT);

  if (error) {
    console.error(error);
    setSaveState(`Erro ao salvar pares: ${error.message}`, false);
    return;
  }

  const forwardPair = (data || []).find((pair) => pair.project_id === project.id);
  const reversePair = (data || []).find((pair) => pair.project_id === pairedProjectId);

  if (forwardPair) {
    project.project_pairs = [
      ...(project.project_pairs || []).filter((pair) => pair.id !== forwardPair.id),
      forwardPair
    ];
  }

  const pairedProject = adminState.projects.find((candidate) => candidate.id === pairedProjectId);
  if (pairedProject && reversePair) {
    pairedProject.project_pairs = [
      ...(pairedProject.project_pairs || []).filter((pair) => pair.id !== reversePair.id),
      reversePair
    ];
  }

  renderPairCandidates();
  renderPairList();
  setSaveState("Salvo", false);
}

function renderPairList() {
  const project = getSelectedProject();
  const pairs = project?.project_pairs || [];

  if (!pairs.length) {
    pairList.innerHTML = `<div class="admin-card">Nenhum par conectado ainda.</div>`;
    return;
  }

  pairList.innerHTML = pairs.map((pair) => `
    <div class="admin-pair-item">
      <div>
        <div class="admin-pair-title">${escapeHtml(pair.paired?.title || pair.paired?.slug || "Projeto")}</div>
        <div class="admin-pair-meta">${escapeHtml(pair.paired?.slug || "")}</div>
      </div>
      <button class="admin-danger-button" type="button" data-pair-id="${pair.id}">Remover</button>
    </div>
  `).join("");
}

async function handleRemovePair(event) {
  const button = event.target.closest("[data-pair-id]");
  if (!button) return;

  const project = getSelectedProject();
  if (!project) return;

  const pairId = button.dataset.pairId;
  const pair = (project.project_pairs || []).find((item) => item.id === pairId);
  if (!pair) return;

  setSaveState("Removendo par...", true);

  const { error } = await supabase
    .from("project_pairs")
    .delete()
    .or([
      `id.eq.${pairId}`,
      `and(project_id.eq.${pair.paired_project_id},paired_project_id.eq.${project.id},pair_type.eq.${pair.pair_type})`
    ].join(","));

  if (error) {
    console.error(error);
    setSaveState(`Erro ao remover: ${error.message}`, false);
    return;
  }

  project.project_pairs = (project.project_pairs || []).filter((item) => item.id !== pairId);

  const pairedProject = adminState.projects.find((candidate) => candidate.id === pair.paired_project_id);
  if (pairedProject) {
    pairedProject.project_pairs = (pairedProject.project_pairs || []).filter((item) => {
      return !(item.paired_project_id === project.id && item.pair_type === pair.pair_type);
    });
  }

  renderPairCandidates();
  renderPairList();
  setSaveState("Salvo", false);
}

function replaceProject(project) {
  const index = adminState.projects.findIndex((item) => item.id === project.id);
  if (index === -1) return;
  adminState.projects[index] = project;
}

function setSaveState(message, busy) {
  saveState.textContent = message;
  saveState.classList.toggle("is-busy", busy);
}

function setAuthFeedback(message, isError) {
  authFeedback.textContent = message;
  authFeedback.classList.toggle("is-error", Boolean(isError));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const CONFIG = window.GIZ_PORTFOLIO_CONFIG || {};
const BACKEND_CONFIG = window.GIZ_BACKEND_CONFIG || {};
const PAGES = Array.isArray(CONFIG.pages) ? CONFIG.pages : [];
const FILTERS = Array.isArray(CONFIG.filters) ? CONFIG.filters : [];
const PAGE_BY_ID = new Map(PAGES.map((page) => [page.id, page]));
const FILTER_BY_ID = new Map(FILTERS.map((filter) => [filter.id, filter]));
const PANEL_CACHE = new Map();
const SITE_PANEL_OVERRIDES = {};
const FALLBACK_PROJECT_MESSAGE = "Imagem do projeto indisponível no momento.";
const ENABLE_HOVER_ZOOM = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const COLOR_SWATCHES = {
  preto: "#17110f",
  branco: "#f6f1e8",
  cinza: "#9b948d",
  grafite: "#47413d",
  verde: "#2f8c66",
  azul: "#3f6ea8",
  turquesa: "#4eb5b7",
  vermelho: "#b14a42",
  vinho: "#74394d",
  amarelo: "#d7b645",
  ocre: "#b78435",
  laranja: "#d86f36",
  rosa: "#cf8aa0",
  roxo: "#7c5ea7",
  marrom: "#7a5a42",
  bege: "#cab28b",
  creme: "#ede1c8",
  dourado: "#c4a24b",
  prata: "#b7bcc4"
};

const elements = {
  grid: document.getElementById("grid"),
  gridView: document.getElementById("grid-view"),
  viewerShell: document.getElementById("viewer-shell"),
  panel: document.getElementById("panel"),
  menuNav: document.getElementById("menu-nav"),
  collectionIntro: document.getElementById("collection-intro")
};

const state = {
  projects: [],
  shuffled: [],
  filtered: [],
  loadFailed: false,
  currentPage: CONFIG.defaultPageId || "inicio",
  portfolioMode: "intro",
  currentCriterionId: FILTERS[0]?.id || null,
  filters: createEmptyFilters(),
  currentProject: null,
  currentImageIndex: 0
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initialize();
});

function createEmptyFilters() {
  return FILTERS.reduce((acc, filter) => {
    acc[filter.id] = [];
    return acc;
  }, {});
}

function buildDefaultSiteSettings() {
  return {
    navigation: PAGES.map((page) => ({
      id: page.id,
      label: page.label
    })),
    filters: FILTERS.map((filter) => ({
      id: filter.id,
      label: filter.label,
      summary: filter.summary || "",
      description: filter.description || ""
    })),
    labels: Object.assign({}, CONFIG.labels || {}),
    pageContent: {}
  };
}

async function loadSiteSettings() {
  if (!BACKEND_CONFIG.enabled || !BACKEND_CONFIG.url || !BACKEND_CONFIG.anonKey) {
    return;
  }

  try {
    const response = await fetch(new URL("/rest/v1/site_config?select=navigation,filters,labels,page_content&key=eq.main&limit=1", BACKEND_CONFIG.url).toString(), {
      headers: {
        apikey: BACKEND_CONFIG.anonKey,
        Authorization: `Bearer ${BACKEND_CONFIG.anonKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar conteúdo do site (${response.status})`);
    }

    const payload = await response.json();
    applySiteSettings(payload?.[0]);
  } catch (error) {
    console.warn("Nao foi possivel carregar configuracoes do site:", error);
  }
}

function applySiteSettings(payload) {
  const defaults = buildDefaultSiteSettings();
  const navigation = normalizeSiteNavigation(payload?.navigation, defaults.navigation);
  const filters = normalizeSiteFilters(payload?.filters, defaults.filters);
  const labels = payload?.labels && typeof payload.labels === "object"
    ? Object.assign({}, defaults.labels, payload.labels)
    : defaults.labels;
  const pageContent = payload?.page_content && typeof payload.page_content === "object"
    ? payload.page_content
    : {};

  replaceArrayContents(PAGES, navigation.map((item) => {
    const page = CONFIG.pages?.find((candidate) => candidate.id === item.id) || {};
    return Object.assign({}, page, { id: item.id, label: item.label || item.id });
  }));

  replaceArrayContents(FILTERS, filters.map((item) => {
    const filter = CONFIG.filters?.find((candidate) => candidate.id === item.id) || {};
    return Object.assign({}, filter, {
      id: item.id,
      label: item.label || filter.label || item.id,
      summary: item.summary || "",
      description: item.description || ""
    });
  }));

  PAGE_BY_ID.clear();
  PAGES.forEach((page) => PAGE_BY_ID.set(page.id, page));

  FILTER_BY_ID.clear();
  FILTERS.forEach((filter) => FILTER_BY_ID.set(filter.id, filter));

  Object.keys(SITE_PANEL_OVERRIDES).forEach((key) => delete SITE_PANEL_OVERRIDES[key]);
  Object.keys(pageContent).forEach((pageId) => {
    SITE_PANEL_OVERRIDES[pageId] = String(pageContent[pageId] || "");
  });

  CONFIG.labels = labels;
  state.currentCriterionId = FILTERS[0]?.id || null;
  state.filters = createEmptyFilters();
}

function normalizeSiteNavigation(items, defaults) {
  const byId = new Map();

  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (!item?.id) return;
      byId.set(item.id, {
        id: item.id,
        label: String(item.label || "").trim() || item.id
      });
    });
  }

  return defaults
    .filter((item) => byId.has(item.id) || item.id)
    .map((item) => byId.get(item.id) || item);
}

function normalizeSiteFilters(items, defaults) {
  const byId = new Map();

  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (!item?.id) return;
      byId.set(item.id, {
        id: item.id,
        label: String(item.label || "").trim(),
        summary: String(item.summary || "").trim(),
        description: String(item.description || "").trim()
      });
    });
  }

  return defaults
    .filter((item) => byId.has(item.id) || item.id)
    .map((item) => Object.assign({}, item, byId.get(item.id) || {}));
}

function replaceArrayContents(target, nextItems) {
  target.length = 0;
  nextItems.forEach((item) => target.push(item));
}

async function initialize() {
  await loadSiteSettings();
  renderMenu();
  updateMenu();
  renderCollectionIntro();
  await Promise.all([loadProjects(), preloadStaticPanels()]);
  if (state.loadFailed) {
    renderCollectionIntro();
    return;
  }
  applyFilters();
  renderCollectionIntro();
  renderGrid();
  renderPanel();
}

function bindEvents() {
  elements.menuNav.addEventListener("click", handleMenuClick);
  elements.grid.addEventListener("click", handleGridClick);
  elements.panel.addEventListener("click", handlePanelClick);
  elements.collectionIntro.addEventListener("click", handlePanelClick);
  elements.viewerShell.addEventListener("click", handleViewerClick);
}

function handleMenuClick(event) {
  const button = event.target.closest("[data-page-id]");
  if (!button) return;

  openPage(button.dataset.pageId);
}

function handleGridClick(event) {
  const card = event.target.closest("[data-project-index]");
  if (!card) return;

  const index = Number(card.dataset.projectIndex);
  if (Number.isNaN(index)) return;
  openProject(index);
}

function handlePanelClick(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const { action } = actionElement.dataset;

  if (action === "enter-criterion") {
    enterCriterion(actionElement.dataset.criterionId);
    return;
  }

  if (action === "open-page") {
    openPage(actionElement.dataset.pageId);
    return;
  }

  if (action === "open-criterion-page") {
    openCriterionPage(actionElement.dataset.criterionId);
    return;
  }

  if (action === "criterion-previous") {
    cycleCriterion(-1);
    return;
  }

  if (action === "criterion-next") {
    cycleCriterion(1);
    return;
  }

  if (action === "toggle-filter") {
    toggleFilter(actionElement.dataset.criterionId, actionElement.dataset.value);
    return;
  }

  if (action === "remove-filter") {
    removeFilter(actionElement.dataset.criterionId, actionElement.dataset.value);
    return;
  }

  if (action === "clear-filters") {
    clearFilters();
    return;
  }

  if (action === "show-portfolio-intro") {
    state.portfolioMode = "intro";
    state.currentProject = null;
    renderPanel();
    return;
  }

  if (action === "close-viewer") {
    closeViewer();
    return;
  }

  if (action === "open-project-by-slug") {
    openProjectBySlug(actionElement.dataset.projectSlug);
  }
}

function handleViewerClick(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const { action } = actionElement.dataset;

  if (action === "close-viewer") {
    closeViewer();
    return;
  }

  if (action === "viewer-previous") {
    goToPreviousImage();
    return;
  }

  if (action === "viewer-next") {
    goToNextImage();
  }
}

async function loadProjects() {
  try {
    const payload = await loadProjectsFromSupabase();
    if (!Array.isArray(payload)) {
      throw new Error("A fonte de dados do portfólio não retornou uma lista de projetos.");
    }

    state.projects = payload.map(normalizeProject);
    state.shuffled = shuffle([...state.projects]);
  } catch (error) {
    console.error(error);
    state.loadFailed = true;
    state.projects = [];
    state.shuffled = [];
    renderGridState("Nenhum projeto carregado", "Não foi possível carregar o acervo no Supabase.", "error");
    renderPanelState("Erro ao carregar conteúdo", "O portfólio não conseguiu ler os dados publicados no Supabase.", "error");
  }
}

async function loadProjectsFromSupabase() {
  if (!BACKEND_CONFIG.enabled || !BACKEND_CONFIG.url || !BACKEND_CONFIG.anonKey) {
    throw new Error("Backend config ausente para carregar o portfólio do Supabase.");
  }

  const url = new URL("/rest/v1/published_project_feed", BACKEND_CONFIG.url);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "published_at.desc.nullslast,created_at.desc");

  const response = await fetch(url.toString(), {
    headers: {
      apikey: BACKEND_CONFIG.anonKey,
      Authorization: `Bearer ${BACKEND_CONFIG.anonKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar feed do Supabase (${response.status})`);
  }

  return response.json();
}

async function preloadStaticPanels() {
  const pagesWithContent = PAGES.filter((page) => page.content);

  await Promise.all(
    pagesWithContent.map(async (page) => {
      try {
        await loadPanelMarkup(page.content);
      } catch (error) {
        console.error(error);
      }
    })
  );
}

function normalizeProject(item) {
  const imageSource = item?.imagens ?? item?.images;
  const images = Array.isArray(imageSource)
    ? imageSource.map((image) => {
      if (typeof image === "string") return resolveProjectMediaUrl(cleanString(image));
      return resolveProjectMediaUrl(cleanString(image?.storage_path));
    }).filter(Boolean)
    : [];

  const thumb = resolveProjectMediaUrl(cleanString(item?.thumb ?? item?.thumb_path)) || images[0] || "";
  const pairSource = item?.pairs;
  const pairs = Array.isArray(pairSource)
    ? pairSource.map((pair) => ({
      slug: cleanString(pair?.slug),
      titulo: cleanString(pair?.title ?? pair?.titulo) || formatLabel(cleanString(pair?.slug)),
      subtitulo: cleanString(pair?.subtitle ?? pair?.subtitulo),
      label: cleanString(pair?.label ?? pair?.label_override),
      pairType: cleanString(pair?.pair_type),
      thumb: resolveProjectMediaUrl(cleanString(pair?.thumb_path)),
      cliente: cleanString(pair?.client ?? pair?.cliente),
      tipo: normalizeProjectType(pair?.project_type ?? pair?.tipo),
      ano: normalizeProjectYear(pair?.sort_year ?? pair?.ano)
    })).filter((pair) => pair.slug)
    : [];
  const tagSource = item?.tags ?? item?.tag_slugs;
  const tags = Array.isArray(tagSource)
    ? tagSource.map((tag) => typeof tag === "string" ? cleanString(tag) : cleanString(tag?.slug)).filter(Boolean)
    : [];

  return {
    slug: cleanString(item?.slug),
    titulo: cleanString(item?.titulo ?? item?.title) || formatLabel(cleanString(item?.slug)),
    subtitulo: cleanString(item?.subtitulo ?? item?.subtitle),
    descricao: cleanString(item?.descricao ?? item?.description),
    tipo: normalizeProjectType(item?.tipo ?? item?.project_type),
    cliente: cleanString(item?.cliente ?? item?.client),
    ano: normalizeProjectYear(item?.ano ?? item?.sort_year),
    destaque: item?.is_featured ? "destaque" : "",
    isFeatured: Boolean(item?.is_featured),
    tags,
    thumb,
    imagens: images,
    pares: pairs
  };
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProjectType(value) {
  const normalized = cleanString(value);
  const folded = normalized.toLowerCase();

  if (!folded) return "";
  if (folded === "hq") return "hq";
  if (folded === "livro" || folded === "livros") return "livro";
  if (folded === "revista" || folded === "revistas") return "revista";
  if (folded === "especial" || folded === "projeto especial" || folded === "projetos especiais") return "especial";
  if (folded === "outro" || folded === "outros") return "outros";

  return normalized;
}

function normalizeProjectYear(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1000) return "";
  return String(Math.trunc(numeric));
}

function resolveProjectMediaUrl(value) {
  const path = cleanString(value);
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (/^(assets|textos)\//i.test(path)) return path;
  if (path.startsWith("/")) return path;
  if (!BACKEND_CONFIG.url) return path;
  return `${BACKEND_CONFIG.url}/storage/v1/object/public/project-media/${encodeStoragePath(path)}`;
}

function encodeStoragePath(storagePath) {
  return String(storagePath || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }

  return array;
}

function getFeaturedProjects() {
  return state.shuffled.filter((project) => project.isFeatured);
}

function getVisibleProjects() {
  if (state.currentPage === CONFIG.portfolioPageId) {
    return state.filtered;
  }

  const featured = getFeaturedProjects();

  if (state.currentPage === "inicio") {
    return (featured.length ? featured : state.shuffled).slice(0, 9);
  }

  if (state.currentPage === "quem") {
    return (featured.length ? featured : state.shuffled).slice(0, 6);
  }

  if (state.currentPage === "contato") {
    return state.shuffled.slice(0, 4);
  }

  return state.shuffled.slice(0, 6);
}

function getDefaultCriterionId() {
  return FILTERS[0]?.id || "";
}

function getFeaturedCriterionId() {
  return FILTER_BY_ID.has("destaques") ? "destaques" : getDefaultCriterionId();
}

function getColorCriterionId() {
  const colorCriterion = FILTERS.find((criterion) => criterion.includeSet === "colorTags" || criterion.id === "cores");
  return colorCriterion?.id || getDefaultCriterionId();
}

function openPage(pageId) {
  if (!PAGE_BY_ID.has(pageId)) return;

  const leavingPortfolio = state.currentPage === CONFIG.portfolioPageId && pageId !== CONFIG.portfolioPageId;
  if (leavingPortfolio) {
    resetPortfolioNavigation();
  }

  state.currentPage = pageId;
  state.currentProject = null;
  state.currentImageIndex = 0;

  if (pageId === CONFIG.portfolioPageId) {
    state.portfolioMode = "intro";
  }

  updateMenu();
  renderViewer();
  applyFilters();
  renderGrid();
  renderPanel();
}

function resetPortfolioNavigation() {
  state.filters = createEmptyFilters();
  state.currentCriterionId = FILTERS[0]?.id || null;
  state.portfolioMode = "intro";
  state.currentProject = null;
  state.currentImageIndex = 0;
}

function hasActiveFilters() {
  return Object.values(state.filters).some((values) => values.length > 0);
}

function updateMenu() {
  const buttons = elements.menuNav.querySelectorAll("[data-page-id]");
  buttons.forEach((button) => {
    const isActive = button.dataset.pageId === state.currentPage;
    button.classList.toggle("ativo", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function renderMenu() {
  elements.menuNav.innerHTML = "";

  PAGES.forEach((page) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-item";
    button.dataset.pageId = page.id;
    button.textContent = page.label;
    elements.menuNav.appendChild(button);
  });
}

function renderCollectionIntro() {
  if (!elements.collectionIntro) return;

  const page = PAGE_BY_ID.get(state.currentPage);
  const visibleProjects = getVisibleProjects();
  const totalProjects = state.projects.length;
  const activeFilterCount = Object.values(state.filters).reduce((total, values) => total + values.length, 0);
  const currentCriterion = FILTER_BY_ID.get(state.currentCriterionId);
  const pageNumber = Math.max(1, PAGES.findIndex((item) => item.id === state.currentPage) + 1);
  let title = page?.label || "GIZ";
  let note = "Portfólio editorial em construção contínua.";
  let countLabel = totalProjects ? `${visibleProjects.length} em foco` : "Aguardando acervo";
  let chips = [];
  let actions = [];

  if (state.currentProject) {
    const project = state.currentProject;
    title = project.titulo;
    note = project.subtitulo || project.descricao || "Abra as imagens e use os pares para continuar navegando por afinidade.";
    countLabel = project.imagens.length === 1 ? "1 imagem" : `${project.imagens.length} imagens`;
    chips = [
      renderCollectionChip(project.cliente),
      renderCollectionChip(project.tipo ? formatLabel(project.tipo) : ""),
      renderCollectionChip(project.ano)
    ].filter(Boolean);
    actions = [
      '<button type="button" class="collection-button collection-button-secondary" data-action="close-viewer">Fechar projeto</button>',
      state.currentPage === CONFIG.portfolioPageId
        ? '<button type="button" class="collection-button collection-button-primary" data-action="show-portfolio-intro">Voltar às trilhas</button>'
        : `<button type="button" class="collection-button collection-button-primary" data-action="open-page" data-page-id="${escapeAttribute(CONFIG.portfolioPageId)}">Abrir no portfólio</button>`
    ];
  } else if (page?.id === CONFIG.portfolioPageId) {
    if (state.portfolioMode === "criterio" && currentCriterion) {
      title = currentCriterion.label;
      note = currentCriterion.description || "Combine filtros sem perder o contexto do acervo.";
      countLabel = totalProjects ? formatProjectCount(state.filtered.length, totalProjects) : "Aguardando acervo";
      chips = getActiveFilterChipMarkup();
      actions = [
        '<button type="button" class="collection-button collection-button-secondary" data-action="show-portfolio-intro">Trocar trilha</button>',
        '<button type="button" class="collection-button collection-button-primary" data-action="clear-filters">Limpar filtros</button>'
      ];
    } else {
      title = "Acervo por trilhas, cores e afinidades";
      note = "Entre pelo recorte mais intuitivo e depois combine filtros, pares e temas para aprofundar a leitura.";
      countLabel = totalProjects ? `${totalProjects} publicados` : "Aguardando acervo";
      chips = [
        renderCollectionChip(FILTERS.length === 1 ? "1 trilha ativa" : `${FILTERS.length} trilhas disponíveis`),
        renderCollectionChip(getFeaturedProjects().length ? `${getFeaturedProjects().length} destaques` : ""),
        activeFilterCount ? renderCollectionChip(activeFilterCount === 1 ? "1 filtro ativo" : `${activeFilterCount} filtros ativos`) : ""
      ].filter(Boolean);
      actions = [
        `<button type="button" class="collection-button collection-button-primary" data-action="enter-criterion" data-criterion-id="${escapeAttribute(getFeaturedCriterionId())}">Começar pelos destaques</button>`
      ];
    }
  } else if (page?.id === "inicio") {
    title = "Portfólio editorial com leitura de conjunto";
    note = "Uma entrada mais guiada para o acervo, com destaque para relações, ritmo e identidade visual.";
    countLabel = totalProjects ? `${visibleProjects.length} em vitrine` : "Aguardando acervo";
    chips = [
      renderCollectionChip(getFeaturedProjects().length ? `${getFeaturedProjects().length} projetos em destaque` : ""),
      renderCollectionChip("Navegação por pares"),
      renderCollectionChip("Critérios cromáticos")
    ].filter(Boolean);
    actions = [
      `<button type="button" class="collection-button collection-button-primary" data-action="open-page" data-page-id="${escapeAttribute(CONFIG.portfolioPageId)}">Entrar no acervo completo</button>`,
      `<button type="button" class="collection-button collection-button-secondary" data-action="open-criterion-page" data-criterion-id="${escapeAttribute(getColorCriterionId())}">Explorar por cores</button>`
    ];
  } else if (page?.id === "quem") {
    title = "Direção editorial, imagem e sistema";
    note = "Uma visão mais institucional do estúdio, acompanhada por uma amostra compacta do acervo publicado.";
    countLabel = totalProjects ? `${visibleProjects.length} projetos ao lado` : "Aguardando acervo";
    chips = [
      renderCollectionChip("Estratégia visual"),
      renderCollectionChip("Projetos autorais e comissionados")
    ];
    actions = [
      `<button type="button" class="collection-button collection-button-primary" data-action="open-page" data-page-id="${escapeAttribute(CONFIG.portfolioPageId)}">Ver portfólio</button>`
    ];
  } else if (page?.id === "contato") {
    title = "Conversas editoriais começam aqui";
    note = "O contato precisa parecer continuação do trabalho: direto, legível e sem ruído.";
    countLabel = totalProjects ? `${visibleProjects.length} projetos em amostra` : "Aguardando acervo";
    chips = [
      renderCollectionChip("Livros"),
      renderCollectionChip("Revistas"),
      renderCollectionChip("Projetos especiais")
    ];
    actions = [
      `<button type="button" class="collection-button collection-button-primary" data-action="open-page" data-page-id="${escapeAttribute(CONFIG.portfolioPageId)}">Consultar o acervo</button>`
    ];
  }

  elements.collectionIntro.innerHTML = `
    <div class="collection-context">
      <div class="collection-head">
        <div class="collection-title-block">
          <p class="collection-index">${String(pageNumber).padStart(2, "0")} ${escapeHtml(page?.label || "Página")}</p>
          <h2 class="collection-title">${escapeHtml(title)}</h2>
          <p class="collection-note">${escapeHtml(note)}</p>
        </div>
        <p class="collection-count">${escapeHtml(countLabel)}</p>
      </div>
      ${chips.length ? `<div class="collection-meta">${chips.join("")}</div>` : ""}
      ${actions.length ? `<div class="collection-actions">${actions.join("")}</div>` : ""}
    </div>
  `;
}

function renderCollectionChip(label, swatchValue = "") {
  if (!label) return "";

  return `
    <span class="collection-chip">
      ${renderColorSwatch(swatchValue, "collection-chip-swatch")}
      ${escapeHtml(label)}
    </span>
  `;
}

function getActiveFilterChipMarkup() {
  const chips = [];

  Object.entries(state.filters).forEach(([criterionId, values]) => {
    values.forEach((value) => {
      const criterion = FILTER_BY_ID.get(criterionId);
      const formattedValue = formatLabel(value);
      const label = criterion
        ? `${criterion.label}: ${formattedValue}`
        : formattedValue;
      chips.push(renderCollectionChip(label, value));
    });
  });

  return chips.length ? chips : [renderCollectionChip("Sem filtros ativos")];
}

function applyFilters() {
  const activeSelections = Object.values(state.filters).some((values) => values.length > 0);

  if (!activeSelections) {
    state.filtered = [...state.shuffled];
    return;
  }

  state.filtered = state.projects.filter((project) => {
    return FILTERS.every((criterion) => {
      const selectedValues = state.filters[criterion.id] || [];
      if (!selectedValues.length) return true;

      return selectedValues.every((selectedValue) => matchesCriterion(project, criterion, selectedValue));
    });
  });
}

function matchesCriterion(project, criterion, selectedValue) {
  const projectValue = project[criterion.source];

  if (criterion.mode === "list") {
    return Array.isArray(projectValue) && projectValue.includes(selectedValue);
  }

  return projectValue === selectedValue;
}

function renderGrid() {
  if (!state.projects.length) return;

  elements.grid.innerHTML = "";
  const visibleProjects = getVisibleProjects();

  if (!visibleProjects.length) {
    renderGridState("Nenhum projeto encontrado", "Os filtros atuais não retornaram resultados. Limpe os filtros para voltar ao acervo completo.");
    return;
  }

  visibleProjects.forEach((project, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "grid-card";
    card.dataset.projectIndex = String(index);
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `Abrir projeto ${project.titulo}`);
    const kicker = [project.cliente, project.ano].filter(Boolean).join(" • ");
    const subtitle = project.subtitulo || (project.tipo ? formatLabel(project.tipo) : "");
    const badge = project.isFeatured ? '<span class="grid-card-badge">Destaque</span>' : "";

    if (project.thumb) {
      card.innerHTML = `
        <span class="grid-card-frame">
          ${badge}
          <img
            class="grid-card-media"
            src="${escapeAttribute(project.thumb)}"
            alt="${escapeAttribute(project.titulo)}"
            loading="lazy"
          >
        </span>
        <span class="grid-card-caption">
          ${kicker ? `<span class="grid-card-kicker">${escapeHtml(kicker)}</span>` : ""}
          <strong class="grid-card-title">${escapeHtml(project.titulo)}</strong>
          ${subtitle ? `<span class="grid-card-subtitle">${escapeHtml(subtitle)}</span>` : ""}
        </span>
      `;
    } else {
      card.innerHTML = `
        <span class="grid-card-frame">
          ${badge}
          <span class="grid-thumb-placeholder">
            <span class="grid-thumb-title">${escapeHtml(project.titulo || "Projeto sem imagem")}</span>
          </span>
        </span>
        <span class="grid-card-caption">
          ${kicker ? `<span class="grid-card-kicker">${escapeHtml(kicker)}</span>` : ""}
          <strong class="grid-card-title">${escapeHtml(project.titulo)}</strong>
          ${subtitle ? `<span class="grid-card-subtitle">${escapeHtml(subtitle)}</span>` : ""}
        </span>
      `;
    }

    elements.grid.appendChild(card);
  });

  elements.gridView.hidden = false;
}

function renderGridState(title, message, tone = "neutral") {
  elements.grid.innerHTML = `
    <div class="panel-state" data-tone="${escapeHtml(tone)}">
      <h1>${escapeHtml(title)}</h1>
      <p class="small-note">${escapeHtml(message)}</p>
    </div>
  `;
  elements.gridView.hidden = false;
}

function openProject(index) {
  const project = getVisibleProjects()[index];
  if (!project) return;

  state.currentProject = project;
  state.currentImageIndex = 0;
  renderViewer();
  renderPanel();
}

function closeViewer() {
  state.currentProject = null;
  state.currentImageIndex = 0;
  renderViewer();
  renderPanel();
}

function openProjectBySlug(slug) {
  const visibleProjects = getVisibleProjects();
  const projectIndex = visibleProjects.findIndex((project) => project.slug === slug);

  if (projectIndex >= 0) {
    openProject(projectIndex);
    return;
  }

  const project = state.projects.find((item) => item.slug === slug);
  if (!project) return;

  state.currentProject = project;
  state.currentImageIndex = 0;
  renderViewer();
  renderPanel();
}

function renderViewer() {
  if (!state.currentProject) {
    elements.viewerShell.hidden = true;
    elements.viewerShell.innerHTML = "";
    elements.gridView.hidden = false;
    return;
  }

  elements.gridView.hidden = true;
  elements.viewerShell.hidden = false;

  const project = state.currentProject;
  const images = project.imagens;

  if (!images.length) {
    elements.viewerShell.innerHTML = `
      <div class="viewer-empty">
        <div class="viewer-empty-inner">
          <h1>${escapeHtml(project.titulo)}</h1>
          <p class="small-note">${escapeHtml(FALLBACK_PROJECT_MESSAGE)}</p>
          <button type="button" class="viewer-empty-button" data-action="close-viewer">Voltar ao grid</button>
        </div>
      </div>
    `;
    return;
  }

  const imageCount = images.length;
  const currentImage = images[state.currentImageIndex] || images[0];
  const disableZoomClass = ENABLE_HOVER_ZOOM ? "" : " viewer-no-zoom";

  elements.viewerShell.innerHTML = `
    <div class="viewer${disableZoomClass}">
      <div class="viewer-stage" id="viewer-stage">
        <img
          class="viewer-media"
          id="imgZoom"
          src="${escapeAttribute(currentImage)}"
          alt="${escapeAttribute(project.titulo)}"
        >
        <div class="zoom-lens" id="lens" aria-hidden="true"></div>
        ${renderViewerNavigation(imageCount)}
      </div>

      <button type="button" class="grid-button" data-action="close-viewer" aria-label="Voltar ao grid">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <rect x="5" y="5" width="40" height="40" fill="#444"></rect>
          <rect x="55" y="5" width="40" height="40" fill="#444"></rect>
          <rect x="5" y="55" width="40" height="40" fill="#444"></rect>
          <rect x="55" y="55" width="40" height="40" fill="#444"></rect>
        </svg>
      </button>
    </div>
  `;

  if (ENABLE_HOVER_ZOOM) {
    activateViewerZoom();
  }
}

function renderViewerNavigation(totalImages) {
  if (totalImages <= 1) return "";

  const previousDisabled = state.currentImageIndex === 0;
  const nextDisabled = state.currentImageIndex >= totalImages - 1;

  return `
    <div class="viewer-nav" aria-label="Navegação entre imagens">
      <button
        type="button"
        class="viewer-arrow${previousDisabled ? " inativo" : ""}"
        data-action="viewer-previous"
        aria-label="Imagem anterior"
      >◀</button>
      <div class="viewer-dots" aria-hidden="true">
        ${Array.from({ length: totalImages }, (_, index) => {
          return `<span class="viewer-dot${index === state.currentImageIndex ? " ativo" : ""}"></span>`;
        }).join("")}
      </div>
      <button
        type="button"
        class="viewer-arrow${nextDisabled ? " inativo" : ""}"
        data-action="viewer-next"
        aria-label="Próxima imagem"
      >▶</button>
    </div>
  `;
}

function goToPreviousImage() {
  if (!state.currentProject || state.currentImageIndex <= 0) {
    closeViewer();
    return;
  }

  state.currentImageIndex -= 1;
  renderViewer();
}

function goToNextImage() {
  if (!state.currentProject) return;
  if (state.currentImageIndex >= state.currentProject.imagens.length - 1) return;

  state.currentImageIndex += 1;
  renderViewer();
}

function activateViewerZoom() {
  const stage = document.getElementById("viewer-stage");
  const image = document.getElementById("imgZoom");

  if (!stage || !image) return;

  stage.addEventListener("mouseenter", zoomStart);
  stage.addEventListener("mousemove", zoomMove);
  stage.addEventListener("mouseleave", zoomEnd);
}

function zoomStart() {
  const image = document.getElementById("imgZoom");
  const lens = document.getElementById("lens");

  if (!image || !lens) return;

  lens.style.display = "block";

  const zoomFactor = 2.2;
  lens.style.backgroundImage = `url(${image.src})`;
  lens.style.backgroundSize = `${image.clientWidth * zoomFactor}px ${image.clientHeight * zoomFactor}px`;
}

function zoomEnd() {
  const lens = document.getElementById("lens");
  if (lens) lens.style.display = "none";
}

function zoomMove(event) {
  const image = document.getElementById("imgZoom");
  const lens = document.getElementById("lens");

  if (!image || !lens) return;

  const imageRect = image.getBoundingClientRect();
  const x = event.clientX - imageRect.left;
  const y = event.clientY - imageRect.top;

  if (x <= 0 || y <= 0 || x >= imageRect.width || y >= imageRect.height) {
    zoomEnd();
    return;
  }

  lens.style.display = "block";

  const lensWidth = lens.offsetWidth;
  const lensHeight = lens.offsetHeight;
  const zoomFactor = 2.2;

  const maxBackgroundX = image.clientWidth * zoomFactor - lensWidth;
  const maxBackgroundY = image.clientHeight * zoomFactor - lensHeight;
  const backgroundX = Math.max(0, Math.min(x * zoomFactor - lensWidth / 2, maxBackgroundX));
  const backgroundY = Math.max(0, Math.min(y * zoomFactor - lensHeight / 2, maxBackgroundY));

  lens.style.left = `${event.clientX}px`;
  lens.style.top = `${event.clientY}px`;
  lens.style.backgroundPosition = `-${backgroundX}px -${backgroundY}px`;
}

function renderPanel() {
  renderCollectionIntro();

  if (state.currentProject) {
    renderProjectPanel();
    return;
  }

  const page = PAGE_BY_ID.get(state.currentPage);
  if (!page) {
    renderPanelState("Página indisponível", "A navegação atual não está configurada corretamente.", "error");
    return;
  }

  if (page.id === CONFIG.portfolioPageId && state.portfolioMode === "criterio") {
    renderFilterPanel();
    return;
  }

  renderStaticPanel(page);
}

function renderStaticPanel(page) {
  const markup = SITE_PANEL_OVERRIDES[page.id] || PANEL_CACHE.get(page.content);

  if (!markup) {
    renderPanelState("Conteúdo indisponível", "Não foi possível carregar o conteúdo desta seção nem do Supabase nem dos arquivos locais.", "error");
    return;
  }

  elements.panel.innerHTML = `
    <div class="panel-page-shell">
      <p class="panel-page-index">${escapeHtml(page.label)}</p>
      ${markup}
    </div>
  `;

  if (page.id === CONFIG.portfolioPageId && state.portfolioMode === "intro") {
    injectPortfolioButtons();
  }
}

async function loadPanelMarkup(fileName) {
  if (PANEL_CACHE.has(fileName)) {
    return PANEL_CACHE.get(fileName);
  }

  const response = await fetch(`textos/${fileName}`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar textos/${fileName} (${response.status})`);
  }

  const markup = await response.text();
  PANEL_CACHE.set(fileName, markup);
  return markup;
}

function injectPortfolioButtons() {
  const container = elements.panel.querySelector("[data-portfolio-buttons]");
  const overview = elements.panel.querySelector("[data-portfolio-overview]");
  if (!container || !overview) return;

  container.innerHTML = "";
  overview.innerHTML = renderPortfolioOverview();

  FILTERS.forEach((criterion) => {
    const stats = getCriterionCardStats(criterion);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portfolio-botao";
    button.dataset.action = "enter-criterion";
    button.dataset.criterionId = criterion.id;
    button.innerHTML = `
      <span class="portfolio-botao-eyebrow">${escapeHtml(criterion.summary || "Exploração")}</span>
      <strong>${escapeHtml(criterion.label)}</strong>
      <span>${escapeHtml(criterion.description || "Abra esta trilha para navegar pelo acervo.")}</span>
      <small>${escapeHtml(stats)}</small>
    `;
    container.appendChild(button);
  });
}

function renderPortfolioOverview() {
  const activeFilters = hasActiveFilters();
  const selectedCount = Object.values(state.filters).reduce((total, values) => total + values.length, 0);

  return `
    <div class="portfolio-overview-card">
      <div>
        <span class="panel-summary-label">${activeFilters ? "Navegação em andamento" : "Acervo publicado"}</span>
        <strong>${escapeHtml(formatProjectCount(state.filtered.length, state.projects.length))}</strong>
      </div>
      <div class="portfolio-overview-actions">
        ${activeFilters ? `<span class="small-note">${escapeHtml(selectedCount === 1 ? "1 filtro ativo" : `${selectedCount} filtros ativos`)}</span>` : '<span class="small-note">Escolha uma trilha abaixo para começar.</span>'}
        ${activeFilters ? '<button type="button" class="panel-button panel-button-secondary" data-action="clear-filters">Zerar navegação</button>' : ""}
      </div>
    </div>
  `;
}

function getCriterionCardStats(criterion) {
  if (!criterion) return "";

  if (Array.isArray(criterion.fixedOptions) && criterion.fixedOptions.length === 1) {
    const [fixedValue] = criterion.fixedOptions;
    const count = state.projects.filter((project) => matchesCriterion(project, criterion, fixedValue)).length;
    return count === 1 ? "1 projeto publicado" : `${count} projetos publicados`;
  }

  const optionCount = getCriterionOptions(criterion)
    .filter((option) => !option.disabled)
    .length;

  if (criterion.mode === "list") {
    return optionCount === 1 ? "1 entrada disponível" : `${optionCount} entradas disponíveis`;
  }

  return optionCount === 1 ? "1 recorte disponível" : `${optionCount} recortes disponíveis`;
}

function renderProjectPanel() {
  const project = state.currentProject;
  const description = project.descricao || "Sem texto descritivo por enquanto.";
  const featuredBadge = project.isFeatured
    ? '<p class="project-badge">Destaque</p>'
    : "";
  const subtitle = project.subtitulo
    ? `<h2 class="titulo-secundario">${escapeHtml(project.subtitulo)}</h2>`
    : "";
  const meta = renderProjectMeta(project);
  const taxonomy = renderProjectTaxonomy(project);
  const pairs = renderProjectPairs(project.pares);
  const navigationActions = state.currentPage === CONFIG.portfolioPageId
    ? `
      <div class="panel-actions">
        <button type="button" class="panel-button panel-button-secondary" data-action="close-viewer">Fechar projeto</button>
        <button type="button" class="panel-button" data-action="show-portfolio-intro">Voltar às trilhas</button>
      </div>
    `
    : `
      <div class="panel-actions">
        <button type="button" class="panel-button panel-button-secondary" data-action="close-viewer">Fechar projeto</button>
        <button type="button" class="panel-button" data-action="open-page" data-page-id="${escapeAttribute(CONFIG.portfolioPageId)}">Abrir no portfólio</button>
      </div>
    `;

  elements.panel.innerHTML = `
    <div class="panel-inner panel-inner-project">
      <p class="panel-kicker">Projeto</p>
      ${featuredBadge}
      <h1 class="titulo-principal">${escapeHtml(project.titulo)}</h1>
      ${subtitle}
      ${meta}
      <p>${escapeHtml(description)}</p>
      ${taxonomy}
      ${pairs}
      ${navigationActions}
    </div>
  `;
}

function renderProjectMeta(project) {
  const items = [
    project.cliente,
    project.tipo ? formatLabel(project.tipo) : "",
    project.ano
  ].filter(Boolean);
  if (!items.length) {
    return "";
  }

  return `
    <div class="project-meta" aria-label="Metadados do projeto">
      ${items.map((item) => `<span class="project-meta-item">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function renderProjectTaxonomy(project) {
  const colorSet = getConfigSet("colorTags");
  const colorTags = project.tags.filter((tag) => colorSet?.has(tag));
  const themeTags = project.tags.filter((tag) => !colorSet?.has(tag));
  const sections = [];

  if (colorTags.length) {
    sections.push(`
      <div class="project-taxonomy-block">
        <p class="project-taxonomy-title">Cores</p>
        <div class="project-tag-list">
          ${colorTags.map((tag) => `
            <span class="project-tag project-tag-color">
              ${renderColorSwatch(tag, "project-tag-swatch")}
              ${escapeHtml(formatLabel(tag))}
            </span>
          `).join("")}
        </div>
      </div>
    `);
  }

  if (themeTags.length) {
    sections.push(`
      <div class="project-taxonomy-block">
        <p class="project-taxonomy-title">Temas</p>
        <div class="project-tag-list">
          ${themeTags.map((tag) => `<span class="project-tag">${escapeHtml(formatLabel(tag))}</span>`).join("")}
        </div>
      </div>
    `);
  }

  if (!sections.length) {
    return "";
  }

  return `
    <div class="project-taxonomy">
      ${sections.join("")}
    </div>
  `;
}

function renderProjectPairs(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) {
    return "";
  }

  return `
    <div class="project-pairs">
      <div class="project-pairs-head">
        <h3 class="project-pairs-title">${pairs.length === 1 ? "Projeto relacionado" : "Projetos relacionados"}</h3>
        <p class="small-note">Continue navegando por afinidade entre projetos.</p>
      </div>
      <div class="project-pairs-grid">
        ${pairs.map((pair) => `
          <button
            type="button"
            class="project-pair-card"
            data-action="open-project-by-slug"
            data-project-slug="${escapeAttribute(pair.slug)}"
          >
            ${pair.thumb ? `
              <img
                class="project-pair-thumb"
                src="${escapeAttribute(pair.thumb)}"
                alt="${escapeAttribute(pair.titulo)}"
                loading="lazy"
              >
            ` : `<span class="project-pair-placeholder" aria-hidden="true">${escapeHtml(pair.titulo.charAt(0) || "?")}</span>`}
            <span class="project-pair-body">
              <strong>${escapeHtml(pair.titulo)}</strong>
              ${pair.subtitulo ? `<span>${escapeHtml(pair.subtitulo)}</span>` : ""}
              <small>${escapeHtml([pair.cliente, pair.tipo ? formatLabel(pair.tipo) : "", pair.ano].filter(Boolean).join(" • "))}</small>
            </span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderFilterPanel() {
  const criterion = FILTER_BY_ID.get(state.currentCriterionId) || FILTERS[0];
  const options = criterion ? getCriterionOptions(criterion) : [];

  elements.panel.innerHTML = `
    <div class="panel-inner panel-inner-filter">
      <div class="panel-heading-stack">
        <p class="panel-kicker">Explorar</p>
        <div class="criterio-nav">
          <button type="button" class="criterio-arrow" data-action="criterion-previous" aria-label="Critério anterior">◀</button>
          <div class="criterio-titulo">${escapeHtml(criterion?.label || "Critério")}</div>
          <button type="button" class="criterio-arrow" data-action="criterion-next" aria-label="Próximo critério">▶</button>
        </div>
        <p class="small-note">${escapeHtml(criterion?.description || "Combine filtros sem perder o contexto do acervo.")}</p>
      </div>

      <div class="panel-summary-card">
        <div class="panel-summary-head">
          <span class="panel-summary-label">Recorte atual</span>
          <strong class="contador-resultados">${formatProjectCount(state.filtered.length, state.projects.length)}</strong>
        </div>
        <div class="filtros-ativos">
          ${renderActiveFilters()}
        </div>
      </div>

      <div class="lista-filtros panel-option-grid">
        ${options.map((option) => renderFilterOption(criterion.id, option)).join("")}
      </div>

      <div class="panel-actions panel-actions-spread">
        <button type="button" class="panel-button panel-button-secondary" data-action="show-portfolio-intro">Trocar de trilha</button>
        <button type="button" class="panel-button" data-action="clear-filters">Limpar filtros</button>
      </div>
    </div>
  `;
}

function renderActiveFilters() {
  const chips = [];

  Object.entries(state.filters).forEach(([criterionId, values]) => {
    values.forEach((value) => {
      const criterion = FILTER_BY_ID.get(criterionId);
      const formattedValue = formatLabel(value);
      const scopedLabel = criterion
        ? (
          Array.isArray(criterion.fixedOptions) &&
          criterion.fixedOptions.length === 1 &&
          formatLabel(criterion.fixedOptions[0]) === formattedValue
            ? criterion.label
            : `${criterion.label}: ${formattedValue}`
        )
        : formattedValue;
      chips.push(`
        <button
          type="button"
          class="filtro-ativo"
          data-action="remove-filter"
          data-criterion-id="${escapeAttribute(criterionId)}"
          data-value="${escapeAttribute(value)}"
        >
          ${renderColorSwatch(value, "filter-swatch")}
          ${escapeHtml(scopedLabel)} ×
        </button>
      `);
    });
  });

  if (!chips.length) {
    return '<span class="small-note">Sem filtros ativos. Você está vendo o acervo completo.</span>';
  }

  return chips.join("");
}

function renderFilterOption(criterionId, option) {
  const value = typeof option === "string" ? option : option?.value;
  const count = typeof option === "string" ? null : option?.count;
  const selected = state.filters[criterionId]?.includes(value);
  const isDisabled = !selected && Boolean(option?.disabled);
  const className = [
    "filtro-item",
    selected ? "is-selected" : "",
    isDisabled ? "is-disabled" : ""
  ].filter(Boolean).join(" ");
  const countMarkup = typeof count === "number"
    ? `<span class="filtro-item-count">${count}</span>`
    : "";

  return `
    <button
      type="button"
      class="${className}"
      data-action="toggle-filter"
      data-criterion-id="${escapeAttribute(criterionId)}"
      data-value="${escapeAttribute(value)}"
      ${isDisabled ? "disabled" : ""}
    >
      <span class="filtro-item-content">
        ${renderColorSwatch(isColorCriterion(criterionId, value) ? value : "", "filter-swatch")}
        <span class="filtro-item-label">${escapeHtml(formatLabel(value))}</span>
      </span>
      ${countMarkup}
    </button>
  `;
}

function getCriterionOptions(criterion) {
  const includeSet = getConfigSet(criterion.includeSet);
  const excludeSet = getConfigSet(criterion.excludeSet);
  const selectedValues = new Set(state.filters[criterion.id] || []);
  const counts = new Map();

  getProjectsMatchingOtherCriteria(criterion.id).forEach((project) => {
    collectCriterionValues(project, criterion, includeSet, excludeSet).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });

  const values = Array.isArray(criterion.fixedOptions) && criterion.fixedOptions.length
    ? criterion.fixedOptions.map((value) => cleanString(value)).filter(Boolean)
    : collectCriterionCatalog(criterion, includeSet, excludeSet);

  selectedValues.forEach((value) => {
    if (!values.includes(value)) {
      values.push(value);
    }
  });

  return values.map((value) => ({
    value,
    count: counts.get(value) || 0,
    disabled: (counts.get(value) || 0) === 0
  }));
}

function collectCriterionCatalog(criterion, includeSet, excludeSet) {
  const options = new Set();

  state.projects.forEach((project) => {
    collectCriterionValues(project, criterion, includeSet, excludeSet).forEach((value) => options.add(value));
  });

  return [...options].sort((a, b) => formatLabel(a).localeCompare(formatLabel(b), "pt-BR"));
}

function collectCriterionValues(project, criterion, includeSet, excludeSet) {
  const sourceValue = project[criterion.source];

  if (criterion.mode === "list") {
    if (!Array.isArray(sourceValue)) return [];

    return sourceValue.filter((value) => {
      if (includeSet && !includeSet.has(value)) return false;
      if (excludeSet && excludeSet.has(value)) return false;
      return Boolean(value);
    });
  }

  if (!sourceValue) {
    return [];
  }

  return [sourceValue];
}

function getProjectsMatchingOtherCriteria(criterionId) {
  return state.projects.filter((project) => {
    return FILTERS.every((criterion) => {
      if (criterion.id === criterionId) return true;

      const selectedValues = state.filters[criterion.id] || [];
      if (!selectedValues.length) return true;

      return selectedValues.every((selectedValue) => matchesCriterion(project, criterion, selectedValue));
    });
  });
}

function getConfigSet(setName) {
  if (!setName) return null;
  const values = CONFIG.tagSets?.[setName];
  return Array.isArray(values) ? new Set(values) : null;
}

function isColorCriterion(criterionId, value) {
  const criterion = FILTER_BY_ID.get(criterionId);
  const includeSet = criterion?.includeSet ? getConfigSet(criterion.includeSet) : null;
  if (includeSet?.has(value)) return true;
  return Boolean(COLOR_SWATCHES[value]);
}

function renderColorSwatch(value, className) {
  const swatch = COLOR_SWATCHES[cleanString(value)];
  if (!swatch) return "";
  return `<span class="${escapeAttribute(className)}" style="background:${escapeAttribute(swatch)}"></span>`;
}

function enterCriterion(criterionId) {
  if (!FILTER_BY_ID.has(criterionId)) return;

  state.currentCriterionId = criterionId;
  state.portfolioMode = "criterio";
  renderPanel();
}

function openCriterionPage(criterionId) {
  if (!FILTER_BY_ID.has(criterionId)) return;

  state.currentPage = CONFIG.portfolioPageId;
  state.currentCriterionId = criterionId;
  state.currentProject = null;
  state.currentImageIndex = 0;
  state.portfolioMode = "criterio";
  updateMenu();
  applyFilters();
  renderViewer();
  renderGrid();
  renderPanel();
}

function cycleCriterion(direction) {
  if (!FILTERS.length) return;

  const currentIndex = FILTERS.findIndex((criterion) => criterion.id === state.currentCriterionId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + FILTERS.length) % FILTERS.length;
  state.currentCriterionId = FILTERS[nextIndex].id;
  renderPanel();
}

function toggleFilter(criterionId, value) {
  if (!criterionId || !value) return;

  const values = state.filters[criterionId];
  if (!Array.isArray(values)) return;

  const currentIndex = values.indexOf(value);
  if (currentIndex >= 0) {
    values.splice(currentIndex, 1);
  } else {
    values.push(value);
  }

  applyFilters();
  renderGrid();
  renderPanel();
}

function removeFilter(criterionId, value) {
  if (!criterionId || !value) return;

  const values = state.filters[criterionId];
  if (!Array.isArray(values)) return;

  state.filters[criterionId] = values.filter((currentValue) => currentValue !== value);
  applyFilters();
  renderGrid();
  renderPanel();
}

function clearFilters() {
  state.filters = createEmptyFilters();
  applyFilters();
  renderGrid();
  renderPanel();
}

function formatProjectCount(filteredCount, totalCount) {
  if (filteredCount === totalCount) {
    return `${filteredCount} projetos publicados`;
  }

  return `${filteredCount} de ${totalCount} projetos`;
}

function renderPanelState(title, message, tone = "neutral") {
  elements.panel.innerHTML = `
    <div class="panel-state" data-tone="${escapeHtml(tone)}">
      <h1>${escapeHtml(title)}</h1>
      <p class="small-note">${escapeHtml(message)}</p>
    </div>
  `;
}

function formatLabel(value) {
  const normalized = cleanString(value);
  if (!normalized) return "";

  if (CONFIG.labels?.[normalized]) {
    return CONFIG.labels[normalized];
  }

  return normalized
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\p{L}/gu, (character) => character.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

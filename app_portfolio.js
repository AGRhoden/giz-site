const CONFIG = window.GIZ_PORTFOLIO_CONFIG || {};
const BACKEND_CONFIG = window.GIZ_BACKEND_CONFIG || {};
const PAGES = Array.isArray(CONFIG.pages) ? CONFIG.pages : [];
const FILTERS = Array.isArray(CONFIG.filters) ? CONFIG.filters : [];
const PAGE_BY_ID = new Map(PAGES.map((page) => [page.id, page]));
const FILTER_BY_ID = new Map(FILTERS.map((filter) => [filter.id, filter]));
const PANEL_CACHE = new Map();
const FALLBACK_PROJECT_MESSAGE = "Imagem do projeto indisponível no momento.";
const ENABLE_HOVER_ZOOM = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const elements = {
  grid: document.getElementById("grid"),
  gridView: document.getElementById("grid-view"),
  viewerShell: document.getElementById("viewer-shell"),
  panel: document.getElementById("panel"),
  menuNav: document.getElementById("menu-nav")
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
  currentImageIndex: 0,
  panelRequestId: 0
};

document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  bindEvents();
  initialize();
});

function createEmptyFilters() {
  return FILTERS.reduce((acc, filter) => {
    acc[filter.id] = [];
    return acc;
  }, {});
}

async function initialize() {
  updateMenu();
  await Promise.all([loadProjects(), preloadStaticPanels()]);
  if (state.loadFailed) return;
  applyFilters();
  renderGrid();
  renderPanel();
}

function bindEvents() {
  elements.menuNav.addEventListener("click", handleMenuClick);
  elements.grid.addEventListener("click", handleGridClick);
  elements.panel.addEventListener("click", handlePanelClick);
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

  if (action === "show-project-pairs") {
    togglePairList(actionElement);
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
      pairType: cleanString(pair?.pair_type)
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
    tipo: cleanString(item?.tipo ?? item?.project_type),
    cliente: cleanString(item?.cliente ?? item?.client),
    tags,
    thumb,
    imagens: images,
    pares: pairs
  };
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
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

function openPage(pageId) {
  if (!PAGE_BY_ID.has(pageId)) return;

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

  if (!state.filtered.length) {
    renderGridState("Nenhum projeto encontrado", "Os filtros atuais não retornaram resultados. Limpe os filtros para voltar ao acervo completo.");
    return;
  }

  state.filtered.forEach((project, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "grid-card";
    card.dataset.projectIndex = String(index);
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `Abrir projeto ${project.titulo}`);

    if (project.thumb) {
      const image = document.createElement("img");
      image.src = project.thumb;
      image.alt = project.titulo;
      image.loading = "lazy";
      card.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "grid-thumb-placeholder";

      const title = document.createElement("span");
      title.className = "grid-thumb-title";
      title.textContent = project.titulo || "Projeto sem imagem";
      placeholder.appendChild(title);
      card.appendChild(placeholder);
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
  const project = state.filtered[index];
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
  const projectIndex = state.filtered.findIndex((project) => project.slug === slug);

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

function togglePairList(button) {
  const wrapper = button.closest(".project-pairs");
  const list = wrapper?.querySelector(".project-pairs-list");
  if (!list) return;

  const nextHidden = !list.hidden;
  list.hidden = nextHidden;
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
  state.panelRequestId += 1;

  const markup = PANEL_CACHE.get(page.content);

  if (!markup) {
    renderPanelState("Conteúdo indisponível", "Não foi possível carregar o texto desta seção. Verifique a pasta textos/ e o servidor local.", "error");
    return;
  }

  elements.panel.innerHTML = markup;

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
  if (!container) return;

  container.innerHTML = "";

  FILTERS.forEach((criterion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portfolio-botao";
    button.dataset.action = "enter-criterion";
    button.dataset.criterionId = criterion.id;
    button.textContent = criterion.label;
    container.appendChild(button);
  });
}

function renderProjectPanel() {
  state.panelRequestId += 1;
  const project = state.currentProject;
  const description = project.descricao || "Sem texto descritivo por enquanto.";
  const subtitle = project.subtitulo
    ? `<h2 class="titulo-secundario">${escapeHtml(project.subtitulo)}</h2>`
    : "";
  const pairs = renderProjectPairs(project.pares);

  elements.panel.innerHTML = `
    <div class="panel-inner" style="display:block; min-height:auto;">
      <h1 class="titulo-principal">${escapeHtml(project.titulo)}</h1>
      ${subtitle}
      <p>${escapeHtml(description)}</p>
      ${pairs}
    </div>
  `;
}

function renderProjectPairs(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) {
    return "";
  }

  const label = pairs.length === 1 ? "Veja seu par" : "Veja seus pares";

  return `
    <div class="project-pairs">
      <button type="button" class="panel-button" data-action="show-project-pairs">${escapeHtml(label)}</button>
      <div class="project-pairs-list" hidden>
        ${pairs.map((pair) => `
          <button
            type="button"
            class="filtro-item"
            data-action="open-project-by-slug"
            data-project-slug="${escapeAttribute(pair.slug)}"
          >
            ${escapeHtml(pair.titulo)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderFilterPanel() {
  state.panelRequestId += 1;
  const criterion = FILTER_BY_ID.get(state.currentCriterionId) || FILTERS[0];
  const options = criterion ? getCriterionOptions(criterion) : [];

  elements.panel.innerHTML = `
    <div class="panel-inner">
      <div class="criterio">
        <div class="criterio-nav">
          <button type="button" class="criterio-arrow" data-action="criterion-previous" aria-label="Critério anterior">◀</button>
          <div class="criterio-titulo">${escapeHtml(criterion?.label || "Critério")}</div>
          <button type="button" class="criterio-arrow" data-action="criterion-next" aria-label="Próximo critério">▶</button>
        </div>
      </div>

      <div class="ativos">
        <div class="filtros-ativos">
          ${renderActiveFilters()}
        </div>
      </div>

      <div class="opcoes">
        <div class="lista-filtros">
          ${options.map((option) => renderFilterOption(criterion.id, option)).join("")}
        </div>
      </div>

      <div class="acoes">
        <div class="acoes-filtros">
          <button type="button" class="acao-icone limpar" data-action="clear-filters" aria-label="Limpar filtros">✖</button>
          <button type="button" class="acao-icone voltar" data-action="show-portfolio-intro" aria-label="Voltar à introdução do portfólio">❖</button>
        </div>
      </div>

      <div class="contador">
        <div class="contador-resultados">${state.filtered.length} projeto(s)</div>
      </div>
    </div>
  `;
}

function renderActiveFilters() {
  const chips = [];

  Object.entries(state.filters).forEach(([criterionId, values]) => {
    values.forEach((value) => {
      chips.push(`
        <button
          type="button"
          class="filtro-ativo"
          data-action="remove-filter"
          data-criterion-id="${escapeAttribute(criterionId)}"
          data-value="${escapeAttribute(value)}"
        >
          ${escapeHtml(formatLabel(value))} ×
        </button>
      `);
    });
  });

  if (!chips.length) {
    return '<span class="small-note">Nenhum filtro ativo.</span>';
  }

  return chips.join("");
}

function renderFilterOption(criterionId, value) {
  const selected = state.filters[criterionId]?.includes(value);
  const className = selected ? "filtro-item inativo" : "filtro-item";

  return `
    <button
      type="button"
      class="${className}"
      data-action="toggle-filter"
      data-criterion-id="${escapeAttribute(criterionId)}"
      data-value="${escapeAttribute(value)}"
    >
      ${escapeHtml(formatLabel(value))}
    </button>
  `;
}

function getCriterionOptions(criterion) {
  if (Array.isArray(criterion.fixedOptions) && criterion.fixedOptions.length) {
    return [...criterion.fixedOptions];
  }

  const options = new Set();
  const includeSet = getConfigSet(criterion.includeSet);
  const excludeSet = getConfigSet(criterion.excludeSet);

  state.projects.forEach((project) => {
    const sourceValue = project[criterion.source];

    if (criterion.mode === "list") {
      if (!Array.isArray(sourceValue)) return;

      sourceValue.forEach((value) => {
        if (includeSet && !includeSet.has(value)) return;
        if (excludeSet && excludeSet.has(value)) return;
        options.add(value);
      });
      return;
    }

    if (sourceValue) {
      options.add(sourceValue);
    }
  });

  return [...options].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function getConfigSet(setName) {
  if (!setName) return null;
  const values = CONFIG.tagSets?.[setName];
  return Array.isArray(values) ? new Set(values) : null;
}

function enterCriterion(criterionId) {
  if (!FILTER_BY_ID.has(criterionId)) return;

  state.currentCriterionId = criterionId;
  state.portfolioMode = "criterio";
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

function renderPanelState(title, message, tone = "neutral") {
  state.panelRequestId += 1;
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

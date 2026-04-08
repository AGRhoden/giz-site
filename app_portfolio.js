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
const LABEL_OVERRIDES = {
  permanencia: "Permanência",
  intrinseca: "Intrínseca"
};
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
  left: document.getElementById("left"),
  grid: document.getElementById("grid"),
  gridView: document.getElementById("grid-view"),
  viewerShell: document.getElementById("viewer-shell"),
  panel: document.getElementById("panel"),
  menuNav: document.getElementById("menu-nav"),
  dossieView: document.getElementById("dossie-view"),
  layout: document.querySelector(".layout")
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
  pairFocusSlugs: null,
  leftMode: "grid",
  currentDossie: null,
  dossieLang: "pt",
  dossieListPage: 0,
  albumDiscovered: false,
  albumMode: false,
  currentAlbumPhoto: null
};

let DOSSIES = [];
let ALBUM_PHOTOS = [];
let ALBUM_SECRET_CARD = null; // foto marcada como capa secreta
let _swipeTouchStartX = 0;
let _swipeTouchStartY = 0;

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
  await Promise.all([loadProjects(), preloadStaticPanels(), loadDossies(), loadAlbumPhotos()]);
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
  elements.left.addEventListener("click", handleLeftClick);

  elements.viewerShell.addEventListener("touchstart", (e) => {
    _swipeTouchStartX = e.touches[0].clientX;
    _swipeTouchStartY = e.touches[0].clientY;
  }, { passive: true });

  elements.viewerShell.addEventListener("touchend", (e) => {
    if (state.leftMode !== "viewer") return;
    const dx = e.changedTouches[0].clientX - _swipeTouchStartX;
    const dy = e.changedTouches[0].clientY - _swipeTouchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.9) return;
    if (dx < 0) goToNextImage();
    else goToPreviousImage();
  }, { passive: true });

  let _wheelAccum = 0;
  let _wheelLast = 0;
  let _wheelLocked = false;
  elements.viewerShell.addEventListener("wheel", (e) => {
    if (state.leftMode !== "viewer") return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.6) return;
    e.preventDefault();
    const now = Date.now();
    if (now - _wheelLast > 300) { _wheelAccum = 0; _wheelLocked = false; }
    _wheelLast = now;
    if (_wheelLocked) return;
    _wheelAccum += e.deltaX;
    if (Math.abs(_wheelAccum) > 50) {
      _wheelLocked = true;
      if (_wheelAccum > 0) goToNextImage("left");
      else goToPreviousImage("right");
      _wheelAccum = 0;
    }
  }, { passive: false });
}

function handleMenuClick(event) {
  const button = event.target.closest("[data-page-id]");
  if (!button) return;

  openPage(button.dataset.pageId);
}

function handleGridClick(event) {
  // Card secreto do álbum
  const secretCard = event.target.closest("[data-album-secret]");
  if (secretCard) {
    discoverAlbum();
    return;
  }

  // Card de foto do álbum (modo álbum ativo)
  const albumCard = event.target.closest("[data-album-photo-index]");
  if (albumCard) {
    const idx = Number(albumCard.dataset.albumPhotoIndex);
    if (!Number.isNaN(idx)) openAlbumPhoto(idx);
    return;
  }

  // Modo álbum: bloqueia abertura de projetos
  if (state.albumMode) return;

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

  if (action === "open-dossie") {
    const dossie = DOSSIES.find((d) => d.id === actionElement.dataset.dossieId);
    if (dossie) {
      state.currentDossie = dossie;
      renderDossieDetail(dossie);
    }
    return;
  }

  if (action === "dossie-back") {
    closeDossieView();
    return;
  }

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
    state.pairFocusSlugs = null;
    state.leftMode = "grid";
    renderGrid();
    renderViewer();
    renderPanel();
    return;
  }

  if (action === "close-viewer") {
    closeViewer();
    return;
  }

  if (action === "open-project-by-slug") {
    openProjectBySlug(actionElement.dataset.projectSlug);
    return;
  }

  if (action === "project-previous") {
    navigateProject(-1);
    return;
  }

  if (action === "project-next") {
    navigateProject(1);
    return;
  }

  if (action === "filter-by-tag") {
    filterByTag(actionElement.dataset.criterionId, actionElement.dataset.value);
    return;
  }

  if (action === "dossie-list-prev") {
    state.dossieListPage = Math.max(0, state.dossieListPage - 1);
    SITE_PANEL_OVERRIDES["dossie"] = buildDossieListHtml(DOSSIES);
    renderPanel();
    return;
  }

  if (action === "dossie-list-next") {
    const totalPages = Math.ceil(DOSSIES.length / DOSSIE_PAGE_SIZE);
    state.dossieListPage = Math.min(totalPages - 1, state.dossieListPage + 1);
    SITE_PANEL_OVERRIDES["dossie"] = buildDossieListHtml(DOSSIES);
    renderPanel();
    return;
  }

  if (action === "album-enter") {
    enterAlbumMode();
    return;
  }

  if (action === "album-exit") {
    exitAlbumMode();
    return;
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
    return;
  }

  if (action === "show-pair-grid") {
    showPairGrid();
    return;
  }

  if (action === "open-fullscreen") {
    if (window.matchMedia("(hover: none)").matches) openMobileFullscreen();
    return;
  }

  if (action === "close-fullscreen") {
    closeMobileFullscreen();
    return;
  }
}

function handleLeftClick(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const { action } = actionElement.dataset;

  if (action === "clear-pair-focus") {
    clearPairFocus();
    return;
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

async function loadDossies() {
  if (!BACKEND_CONFIG.enabled || !BACKEND_CONFIG.url || !BACKEND_CONFIG.anonKey) return;
  try {
    const response = await fetch(
      new URL("/rest/v1/dossies?select=id,titulo,conteudo,titulo_en,conteudo_en,titulo_es,conteudo_es,media,projeto_id,descricao,thumb_path&order=criado_em.asc", BACKEND_CONFIG.url).toString(),
      { headers: { apikey: BACKEND_CONFIG.anonKey, Authorization: `Bearer ${BACKEND_CONFIG.anonKey}` } }
    );
    if (!response.ok) return;
    const rows = await response.json();
    if (Array.isArray(rows)) {
      DOSSIES = rows;
      SITE_PANEL_OVERRIDES["dossie"] = buildDossieListHtml(rows);
    }
  } catch (error) {
    console.error("Erro ao carregar dossiês:", error);
  }
}

async function loadAlbumPhotos() {
  if (!BACKEND_CONFIG.enabled || !BACKEND_CONFIG.url || !BACKEND_CONFIG.anonKey) return;
  try {
    const response = await fetch(
      new URL("/rest/v1/album_photos?select=id,url,legenda,is_secret,created_at&order=created_at.asc", BACKEND_CONFIG.url).toString(),
      { headers: { apikey: BACKEND_CONFIG.anonKey, Authorization: `Bearer ${BACKEND_CONFIG.anonKey}` } }
    );
    if (!response.ok) return;
    const rows = await response.json();
    if (Array.isArray(rows)) {
      ALBUM_SECRET_CARD = rows.find((r) => r.is_secret) || null;
      replaceArrayContents(ALBUM_PHOTOS, rows.filter((r) => !r.is_secret));
    }
  } catch (error) {
    console.error("Erro ao carregar álbum:", error);
  }
}

const DOSSIE_PAGE_SIZE = 3;

function buildDossieListHtml(dossies) {
  if (!dossies.length) {
    return `<div class="panel-inner panel-inner-static panel-inner-static-shell">
  <h1 class="static-page-title">Dossiê</h1>
  <p class="small-note static-page-subtitle">Bastidores, processo e histórias por trás dos projetos.</p>
  <p class="small-note">Em breve.</p>
</div>`;
  }

  const totalPages = Math.ceil(dossies.length / DOSSIE_PAGE_SIZE);
  const page = Math.min(state.dossieListPage, totalPages - 1);
  const slice = dossies.slice(page * DOSSIE_PAGE_SIZE, (page + 1) * DOSSIE_PAGE_SIZE);

  const cards = slice.map((d) => {
    const thumbUrl = d.thumb_path ? resolveProjectMediaUrl(d.thumb_path) : "";
    const thumb = thumbUrl
      ? `<img class="dossie-card-thumb" src="${escapeAttribute(thumbUrl)}" alt="${escapeAttribute(d.titulo)}" loading="lazy" width="218" height="126">`
      : `<div class="dossie-card-thumb-placeholder"></div>`;
    const desc = d.descricao
      ? `<p class="dossie-card-desc">${escapeHtml(d.descricao)}</p>`
      : "";
    return `<button type="button" class="dossie-card" data-action="open-dossie" data-dossie-id="${escapeAttribute(d.id)}">
      ${thumb}
      <div class="dossie-card-body">
        <h3 class="dossie-card-title">${escapeHtml(d.titulo)}</h3>
        ${desc}
        <span class="dossie-card-read-more">Leia mais</span>
      </div>
    </button>`;
  }).join("\n");

  const prevDisabled = page === 0 ? " disabled" : "";
  const nextDisabled = page >= totalPages - 1 ? " disabled" : "";
  const nav = totalPages > 1 ? `
  <div class="dossie-cards-nav">
    <button type="button" class="dossie-cards-arrow" data-action="dossie-list-prev"${prevDisabled} aria-label="Anteriores">&#8592;</button>
    <button type="button" class="dossie-cards-arrow" data-action="dossie-list-next"${nextDisabled} aria-label="Próximos">&#8594;</button>
  </div>` : "";

  return `<div class="panel-inner panel-inner-static panel-inner-static-shell">
  <h1 class="static-page-title">Dossiê</h1>
  <p class="small-note static-page-subtitle">Bastidores, processo e histórias por trás dos projetos.</p>
  <div class="dossie-cards-wrap">
    ${totalPages > 1 ? `<button type="button" class="dossie-cards-arrow" data-action="dossie-list-prev"${prevDisabled} aria-label="Anteriores">&#8592;</button>` : ""}
    <div class="dossie-cards-grid">${cards}</div>
    ${totalPages > 1 ? `<button type="button" class="dossie-cards-arrow" data-action="dossie-list-next"${nextDisabled} aria-label="Próximos">&#8594;</button>` : ""}
  </div>
</div>`;
}

function getDossieLocalized(dossie, field) {
  const lang = state.dossieLang || "pt";
  if (lang === "pt") return dossie[field] || "";
  return dossie[field + "_" + lang] || dossie[field] || "";
}

function renderDossieDetail(dossie) {
  const slides = (Array.isArray(dossie.media) ? dossie.media : [])
    .filter((m) => /\.(png|jpe?g|gif|webp|svg)$/i.test(m.storage_path || ""));

  const carouselHtml = slides.length ? (() => {
    const slidesHtml = slides.map((m, i) => {
      const url = resolveProjectMediaUrl(m.storage_path);
      return `<div class="dc-slide${i === 0 ? " dc-slide--active" : ""}" aria-hidden="${i !== 0}">
        <img class="dc-img" src="${escapeHtml(url)}" alt="${escapeHtml(m.alt || dossie.titulo)}" loading="${i === 0 ? "eager" : "lazy"}">
      </div>`;
    }).join("");
    const dotsHtml = slides.length > 1 ? `<div class="dc-dots">${slides.map((_, i) =>
      `<button type="button" class="dc-dot${i === 0 ? " dc-dot--active" : ""}" data-dc-index="${i}" aria-label="Slide ${i + 1}"></button>`
    ).join("")}</div>` : "";
    const arrowsHtml = slides.length > 1 ? `
      <button type="button" class="dc-arrow dc-arrow--prev" aria-label="Anterior">&#9664;</button>
      <button type="button" class="dc-arrow dc-arrow--next" aria-label="Próximo">&#9654;</button>` : "";
    return `<div class="dossie-carousel" id="dossie-carousel">
      <div class="dc-track">${slidesHtml}</div>
      ${arrowsHtml}
      ${dotsHtml}
    </div>`;
  })() : "";

  const lang = state.dossieLang || "pt";
  const titulo = getDossieLocalized(dossie, "titulo");
  const conteudo = getDossieLocalized(dossie, "conteudo");


  const currentIndex = DOSSIES.findIndex((d) => d.id === dossie.id);
  const prevDossie = currentIndex > 0 ? DOSSIES[currentIndex - 1] : null;
  const nextDossie = currentIndex < DOSSIES.length - 1 ? DOSSIES[currentIndex + 1] : null;

  const prevBtn = prevDossie
    ? `<button type="button" class="dv-sibling dv-sibling--prev" data-action="dossie-prev">← ${escapeHtml(prevDossie.titulo)}</button>`
    : `<span class="dv-sibling dv-sibling--prev"></span>`;
  const nextBtn = nextDossie
    ? `<button type="button" class="dv-sibling dv-sibling--next" data-action="dossie-next">${escapeHtml(nextDossie.titulo)} →</button>`
    : `<span class="dv-sibling dv-sibling--next"></span>`;

  elements.dossieView.innerHTML = `
    <div class="dv-inner">
      <header class="dv-header">
        <div class="dv-menu-nav">${elements.menuNav.innerHTML}</div>
      </header>
      <div class="dv-body">
        <div class="dv-nav-row">
          ${prevBtn}
          ${nextBtn}
        </div>
        <div class="dv-title-row">
          <h1 class="dv-title">${escapeHtml(titulo)}</h1>
          <div class="dv-lang-switcher">
            <button type="button" class="dv-lang-btn${lang === "pt" ? " is-active" : ""}" data-lang="pt" aria-label="Português">P</button>
            <button type="button" class="dv-lang-btn${lang === "en" ? " is-active" : ""}" data-lang="en" aria-label="English">EN</button>
            <button type="button" class="dv-lang-btn${lang === "es" ? " is-active" : ""}" data-lang="es" aria-label="Español">ES</button>
          </div>
        </div>
        ${carouselHtml}
        ${conteudo ? `<div class="dv-conteudo">${conteudo}</div>` : ""}
      </div>
    </div>
  `;

  // Copy active menu state into dossie-view header
  elements.dossieView.querySelectorAll(".dv-menu-nav .menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeDossieView();
      const pageId = btn.dataset.pageId;
      if (pageId) openPage(pageId);
    });
  });

  elements.dossieView.querySelectorAll(".dv-lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newLang = btn.dataset.lang;
      if (!newLang || newLang === state.dossieLang) return;
      state.dossieLang = newLang;
      // Atualizar título e conteúdo sem re-renderizar o carrossel
      const newTitulo = getDossieLocalized(dossie, "titulo");
      const newConteudo = getDossieLocalized(dossie, "conteudo");
      const titleEl = elements.dossieView.querySelector(".dv-title");
      const conteudoEl = elements.dossieView.querySelector(".dv-conteudo");
      if (titleEl) titleEl.textContent = newTitulo;
      if (conteudoEl) conteudoEl.innerHTML = newConteudo || "";
      else if (newConteudo) {
        // Criar elemento se não existia (dossie sem conteúdo pt mas com conteúdo em outra língua)
        const body = elements.dossieView.querySelector(".dv-body");
        if (body) {
          const div = document.createElement("div");
          div.className = "dv-conteudo";
          div.innerHTML = newConteudo;
          body.appendChild(div);
        }
      }
      elements.dossieView.querySelectorAll(".dv-lang-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.lang === newLang);
      });
    });
  });

  elements.dossieView.hidden = false;
  elements.layout.hidden = true;
  document.body.classList.add("dossie-view-open");

  elements.dossieView.querySelector("[data-action='dossie-prev']")?.addEventListener("click", () => {
    if (prevDossie) { state.currentDossie = prevDossie; renderDossieDetail(prevDossie); }
  });
  elements.dossieView.querySelector("[data-action='dossie-next']")?.addEventListener("click", () => {
    if (nextDossie) { state.currentDossie = nextDossie; renderDossieDetail(nextDossie); }
  });

  if (slides.length > 1) initDossieCarousel();
}

function closeDossieView() {
  elements.dossieView.hidden = true;
  elements.layout.hidden = false;
  document.body.classList.remove("dossie-view-open");
  state.currentDossie = null;
  clearInterval(window._dossieCarouselTimer);
}

function initDossieCarousel() {
  const carousel = document.getElementById("dossie-carousel");
  if (!carousel) return;
  const slideEls = carousel.querySelectorAll(".dc-slide");
  const dots = carousel.querySelectorAll(".dc-dot");
  let current = 0;

  function goTo(index) {
    const next = (index + slideEls.length) % slideEls.length;
    if (next === current) return;

    dots[current]?.classList.remove("dc-dot--active");
    slideEls[current].classList.remove("dc-slide--active");
    slideEls[current].setAttribute("aria-hidden", "true");

    current = next;

    slideEls[current].classList.add("dc-slide--active");
    slideEls[current].setAttribute("aria-hidden", "false");
    dots[current]?.classList.add("dc-dot--active");
  }

  function resetTimer() {
    clearInterval(window._dossieCarouselTimer);
    window._dossieCarouselTimer = setInterval(() => goTo(current + 1), 5000);
  }

  carousel.querySelector(".dc-arrow--prev")?.addEventListener("click", () => { goTo(current - 1); resetTimer(); });
  carousel.querySelector(".dc-arrow--next")?.addEventListener("click", () => { goTo(current + 1); resetTimer(); });
  dots.forEach((dot) => dot.addEventListener("click", () => { goTo(Number(dot.dataset.dcIndex)); resetTimer(); }));

  resetTimer();
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
    servico: cleanString(item?.servico ?? item?.servico_principal ?? item?.service),
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

function openPage(pageId) {
  if (!PAGE_BY_ID.has(pageId)) return;

  const leavingPortfolio = state.currentPage === CONFIG.portfolioPageId && pageId !== CONFIG.portfolioPageId;
  if (leavingPortfolio) {
    resetPortfolioNavigation();
  }

  state.currentPage = pageId;
  state.currentProject = null;
  state.currentDossie = null;
  state.currentImageIndex = 0;
  state.pairFocusSlugs = null;
  state.leftMode = "grid";

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
  state.pairFocusSlugs = null;
  state.leftMode = "grid";
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

      return matchesSelectedValues(project, criterion, selectedValues);
    });
  });
}

function matchesCriterion(project, criterion, selectedValue) {
  const projectValue = project[criterion.source];

  if (criterion.mode === "list") {
    return Array.isArray(projectValue) && projectValue.includes(selectedValue);
  }

  if (criterion.mode === "csv") {
    if (!projectValue) return false;
    return projectValue.split(",").map((s) => s.trim()).includes(selectedValue);
  }

  return projectValue === selectedValue;
}

function matchesSelectedValues(project, criterion, selectedValues) {
  if (!Array.isArray(selectedValues) || !selectedValues.length) {
    return true;
  }

  if (criterion.selectionOperator === "or") {
    return selectedValues.some((selectedValue) => matchesCriterion(project, criterion, selectedValue));
  }

  return selectedValues.every((selectedValue) => matchesCriterion(project, criterion, selectedValue));
}

function renderGrid() {
  if (!state.projects.length) return;

  const visibleProjects = getVisibleProjects();
  renderGridFocusNote(visibleProjects);
  elements.grid.innerHTML = "";

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

    const inner = document.createElement("div");
    inner.className = "grid-card-inner";

    const front = document.createElement("div");
    front.className = "grid-card-front";

    if (project.thumb) {
      const image = document.createElement("img");
      image.src = project.thumb;
      image.alt = project.titulo;
      image.loading = "lazy";
      image.decoding = "async";
      front.classList.add("loading");
      image.addEventListener("load", () => front.classList.remove("loading"), { once: true });
      image.addEventListener("error", () => front.classList.remove("loading"), { once: true });
      front.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "grid-thumb-placeholder";
      const title = document.createElement("span");
      title.className = "grid-thumb-title";
      title.textContent = project.titulo || "Projeto sem imagem";
      placeholder.appendChild(title);
      front.appendChild(placeholder);
    }

    const back = document.createElement("div");
    back.className = "grid-card-back";

    if (project.imagens[1]) {
      const backBg = document.createElement("img");
      backBg.className = "grid-back-bg";
      backBg.src = project.imagens[1];
      backBg.alt = "";
      backBg.setAttribute("aria-hidden", "true");
      back.appendChild(backBg);
    }

    const backTitle = document.createElement("strong");
    backTitle.className = "grid-back-title";
    backTitle.textContent = project.titulo;

    back.appendChild(backTitle);

    if (project.servico) {
      const backService = document.createElement("span");
      backService.className = "grid-back-service";
      backService.textContent = formatLabel(project.servico);
      back.appendChild(backService);
    }

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    elements.grid.appendChild(card);
  });

  // Card secreto do álbum — só no grid inicial (sem filtros, sem critério, sem par em foco)
  if (ALBUM_SECRET_CARD && state.portfolioMode === "intro" && !state.pairFocusSlugs) {
    const secretCard = buildAlbumSecretCard(ALBUM_SECRET_CARD);
    const children = Array.from(elements.grid.children);
    if (children.length > 0) {
      const insertAt = Math.floor(Math.random() * (children.length + 1));
      if (insertAt >= children.length) {
        elements.grid.appendChild(secretCard);
      } else {
        elements.grid.insertBefore(secretCard, children[insertAt]);
      }
    } else {
      elements.grid.appendChild(secretCard);
    }
  }

  elements.gridView.hidden = false;
}

function buildAlbumSecretCard(photo) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "grid-card";
  card.dataset.albumSecret = "true";
  card.setAttribute("aria-label", photo.legenda || "Projeto");

  const inner = document.createElement("div");
  inner.className = "grid-card-inner";

  // Frente: thumb da capa fake — idêntica às outras capas
  const front = document.createElement("div");
  front.className = "grid-card-front";
  const img = document.createElement("img");
  img.src = photo.url;
  img.alt = photo.legenda || "";
  img.loading = "lazy";
  front.appendChild(img);

  // Verso: mesma imagem em 0.3 opacity + legenda como título (igual projeto sem segundo still)
  const back = document.createElement("div");
  back.className = "grid-card-back";

  const backBg = document.createElement("img");
  backBg.className = "grid-back-bg";
  backBg.src = photo.url;
  backBg.alt = "";
  backBg.setAttribute("aria-hidden", "true");
  back.appendChild(backBg);

  if (photo.legenda) {
    const backTitle = document.createElement("strong");
    backTitle.className = "grid-back-title";
    backTitle.textContent = photo.legenda;
    back.appendChild(backTitle);
  }

  inner.appendChild(front);
  inner.appendChild(back);
  card.appendChild(inner);
  return card;
}

function renderGridState(title, message, tone = "neutral") {
  renderGridFocusNote([]);
  elements.grid.innerHTML = `
    <div class="panel-state" data-tone="${escapeHtml(tone)}">
      <h1>${escapeHtml(title)}</h1>
      <p class="small-note">${escapeHtml(message)}</p>
    </div>
  `;
  elements.gridView.hidden = false;
}

function renderGridFocusNote(visibleProjects) {
  const existing = elements.gridView.querySelector(".grid-focus-note");
  if (existing) {
    existing.remove();
  }

  if (!Array.isArray(state.pairFocusSlugs) || !state.pairFocusSlugs.length || !state.currentProject) {
    return;
  }

  const note = document.createElement("div");
  note.className = "grid-focus-note";
  note.innerHTML = `
    <button type="button" class="grid-focus-button" data-action="clear-pair-focus" aria-label="Voltar ao portfólio">
      ${renderGridIcon()}
    </button>
  `;
  elements.gridView.insertBefore(note, elements.grid);
}

function openProject(index) {
  const project = getVisibleProjects()[index];
  if (!project) return;

  state.currentProject = project;
  state.currentImageIndex = 0;
  state.leftMode = "viewer";
  if (state.pairFocusSlugs) {
    state.pairFocusSlugs = createPairFocusSlugs(project);
  }
  renderViewer();
  renderPanel();
}

function closeViewer() {
  state.currentProject = null;
  state.currentImageIndex = 0;
  state.leftMode = "grid";
  renderViewer();
  renderPanel();
}

function openProjectBySlug(slug) {
  if (state.currentProject && hasPairWithSlug(state.currentProject, slug)) {
    const targetProject = state.projects.find((project) => project.slug === slug);
    if (!targetProject) return;

    state.currentProject = targetProject;
    state.currentImageIndex = 0;
    state.pairFocusSlugs = createPairFocusSlugs(targetProject);
    state.leftMode = "grid";
    renderViewer();
    renderGrid();
    renderPanel();
    return;
  }

  const projectIndex = getVisibleProjects().findIndex((project) => project.slug === slug);

  if (projectIndex >= 0) {
    openProject(projectIndex);
    return;
  }

  const project = state.projects.find((item) => item.slug === slug);
  if (!project) return;

  state.currentProject = project;
  state.currentImageIndex = 0;
  state.leftMode = "viewer";
  renderViewer();
  renderPanel();
}

function getVisibleProjects() {
  if (!Array.isArray(state.pairFocusSlugs) || !state.pairFocusSlugs.length) {
    return state.filtered;
  }

  return state.pairFocusSlugs
    .map((slug) => state.projects.find((project) => project.slug === slug))
    .filter(Boolean);
}

function hasPairWithSlug(project, slug) {
  return Array.isArray(project?.pares) && project.pares.some((pair) => pair.slug === slug);
}

function createPairFocusSlugs(project) {
  const relatedProjects = [...new Set([
    project.slug,
    ...(Array.isArray(project.pares) ? project.pares.map((pair) => pair.slug) : [])
  ].filter(Boolean))]
    .map((slug) => state.projects.find((item) => item.slug === slug) || (slug === project.slug ? project : null))
    .filter(Boolean)
    .sort((leftProject, rightProject) => leftProject.titulo.localeCompare(rightProject.titulo, "pt-BR"));

  return relatedProjects.map((item) => item.slug);
}

function renderViewer(slideDir) {
  if (!state.currentProject || state.leftMode === "grid") {
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
          draggable="false"
          data-action="open-fullscreen"
        >
        <div class="zoom-lens" id="lens" aria-hidden="true"></div>
        ${renderViewerNavigation(imageCount)}
      </div>

      <button
        type="button"
        class="grid-button${state.pairFocusSlugs ? " grid-button-reverse" : ""}"
        data-action="${state.pairFocusSlugs ? "show-pair-grid" : "close-viewer"}"
        aria-label="${state.pairFocusSlugs ? "Voltar ao agrupamento" : "Voltar ao grid"}"
      >
        ${renderGridIcon()}
      </button>
    </div>
  `;

  if (slideDir) {
    const img = document.getElementById("imgZoom");
    if (img) {
      img.classList.add("viewer-slide-" + slideDir);
      img.addEventListener("animationend", () => img.classList.remove("viewer-slide-" + slideDir), { once: true });
    }
  }

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

function getMobileFs() {
  let el = document.getElementById("mobile-fs");
  if (el) return el;

  el = document.createElement("div");
  el.id = "mobile-fs";
  el.className = "mobile-fs";
  el.hidden = true;
  el.innerHTML = `
    <button class="mobile-fs-close" data-action="close-fullscreen" aria-label="Fechar">✕</button>
    <img class="mobile-fs-img" src="" alt="" draggable="false">
    <div class="mobile-fs-dots"></div>
  `;
  document.body.appendChild(el);

  el.addEventListener("touchstart", (e) => {
    _swipeTouchStartX = e.touches[0].clientX;
    _swipeTouchStartY = e.touches[0].clientY;
  }, { passive: true });

  el.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - _swipeTouchStartX;
    const dy = e.changedTouches[0].clientY - _swipeTouchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.9) return;
    if (dx < 0) fsMobileNext();
    else fsMobilePrev();
  }, { passive: true });

  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-action='close-fullscreen']")) closeMobileFullscreen();
  });

  return el;
}

function renderMobileFs(el) {
  const images = state.currentProject.imagens;
  const img = el.querySelector(".mobile-fs-img");
  img.src = images[state.currentImageIndex];
  img.alt = state.currentProject.titulo;

  const dots = el.querySelector(".mobile-fs-dots");
  if (images.length > 1) {
    dots.innerHTML = Array.from({ length: images.length }, (_, i) =>
      `<span class="viewer-dot${i === state.currentImageIndex ? " ativo" : ""}"></span>`
    ).join("");
  } else {
    dots.innerHTML = "";
  }
}

function openMobileFullscreen() {
  if (!state.currentProject) return;
  const el = getMobileFs();
  renderMobileFs(el);
  el.hidden = false;
}

function closeMobileFullscreen() {
  const el = document.getElementById("mobile-fs");
  if (el) el.hidden = true;
}

function fsMobileNext() {
  if (!state.currentProject) return;
  if (state.currentImageIndex >= state.currentProject.imagens.length - 1) return;
  state.currentImageIndex++;
  renderMobileFs(getMobileFs());
}

function fsMobilePrev() {
  if (!state.currentProject) return;
  if (state.currentImageIndex <= 0) return;
  state.currentImageIndex--;
  renderMobileFs(getMobileFs());
}

function goToPreviousImage(slideDir) {
  if (!state.currentProject || state.currentImageIndex <= 0) {
    closeViewer();
    return;
  }
  state.currentImageIndex -= 1;
  renderViewer(slideDir || "right");
}

function goToNextImage(slideDir) {
  if (!state.currentProject) return;
  if (state.currentImageIndex >= state.currentProject.imagens.length - 1) return;
  state.currentImageIndex += 1;
  renderViewer(slideDir || "left");
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

  if (x < 0 || y < 0 || x > imageRect.width || y > imageRect.height) {
    zoomEnd();
    return;
  }

  lens.style.display = "block";

  const lensWidth = lens.offsetWidth;
  const lensHeight = lens.offsetHeight;
  const lensInnerWidth = lens.clientWidth;
  const lensInnerHeight = lens.clientHeight;
  const zoomFactor = 2.2;
  const backgroundX = x * zoomFactor - lensInnerWidth / 2;
  const backgroundY = y * zoomFactor - lensInnerHeight / 2;

  lens.style.left = `${event.clientX}px`;
  lens.style.top = `${event.clientY}px`;
  lens.style.backgroundPosition = `${-backgroundX}px ${-backgroundY}px`;
}

function renderPanel() {
  if (state.albumDiscovered || state.albumMode) {
    renderAlbumDiscoveryPanel();
    return;
  }

  if (state.currentProject) {
    renderProjectPanel();
    return;
  }

  if (state.currentDossie) {
    renderDossieDetail(state.currentDossie);
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

function setPanelMode(mode) {
  elements.panel.classList.remove("panel-content-static", "panel-content-project", "panel-content-filter", "panel-content-state");

  if (mode) {
    elements.panel.classList.add(`panel-content-${mode}`);
  }
}

function renderStaticPanel(page) {
  setPanelMode("static");
  const markup = SITE_PANEL_OVERRIDES[page.id] || PANEL_CACHE.get(page.content);

  if (!markup) {
    if (page.content) {
      renderPanelState("Carregando…", "", "neutral");
      loadPanelMarkup(page.content)
        .then(() => { if (state.currentPage === page.id && !state.currentProject) renderStaticPanel(page); })
        .catch(() => renderPanelState("Conteúdo indisponível", "Não foi possível carregar o conteúdo desta seção.", "error"));
      return;
    }
    renderPanelState("Conteúdo indisponível", "Não foi possível carregar o conteúdo desta seção nem do Supabase nem dos arquivos locais.", "error");
    return;
  }

  elements.panel.innerHTML = markup;

  if (page.id === CONFIG.portfolioPageId && state.portfolioMode === "intro") {
    injectPortfolioButtons();
    return;
  }

  normalizeSimpleStaticPanel(page.id);
}

async function loadPanelMarkup(fileName) {
  if (PANEL_CACHE.has(fileName)) {
    return PANEL_CACHE.get(fileName);
  }

  const response = await fetch(`textos/${fileName}?v=20260331`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar textos/${fileName} (${response.status})`);
  }

  const markup = await response.text();
  PANEL_CACHE.set(fileName, markup);
  return markup;
}

function injectPortfolioButtons() {
  normalizePortfolioIntroPanel();

  const container = elements.panel.querySelector("[data-portfolio-buttons]");
  const overview = elements.panel.querySelector("[data-portfolio-overview]");
  if (!container) return;

  container.innerHTML = "";

  if (overview) {
    overview.innerHTML = "";
  }

  FILTERS.forEach((criterion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portfolio-botao";
    button.dataset.action = "enter-criterion";
    button.dataset.criterionId = criterion.id;
    button.textContent = criterion.label;
    container.appendChild(button);
  });

  if (overview) {
    overview.innerHTML = renderPortfolioOverview();
  }
}

function normalizePortfolioIntroPanel() {
  const panelInner = elements.panel.querySelector(".panel-inner");
  if (!panelInner) return;

  panelInner.classList.add("panel-inner-static", "panel-inner-static-shell", "panel-inner-portfolio-intro");

  const legacyLabel = panelInner.querySelector(".portfolio-intro-label");
  const legacyKicker = panelInner.querySelector(".panel-kicker");
  let introTitle = panelInner.querySelector(".portfolio-intro-title");
  const overview = panelInner.querySelector("[data-portfolio-overview]");
  const buttons = panelInner.querySelector("[data-portfolio-buttons]");
  const mainHeading = panelInner.querySelector("h1");
  const notes = [...panelInner.querySelectorAll(":scope > .small-note")];

  if (!introTitle) {
    introTitle = document.createElement("h1");
    introTitle.className = "static-page-title portfolio-intro-title";
    introTitle.textContent = "Portfólio";
    panelInner.insertBefore(introTitle, panelInner.firstChild);
  } else {
    introTitle.classList.add("static-page-title", "portfolio-intro-title");
    introTitle.textContent = "Portfólio";
  }

  if (mainHeading && mainHeading !== introTitle) {
    mainHeading.remove();
  }

  [...panelInner.querySelectorAll(".portfolio-intro-subtitle")].forEach((subtitle) => {
    subtitle.remove();
  });

  if (notes[0]) {
    notes[0].classList.remove("small-note");
    notes[0].classList.add("static-page-subtitle");
    introTitle.insertAdjacentElement("afterend", notes[0]);
  }

  if (legacyLabel) {
    legacyLabel.remove();
  }

  if (legacyKicker) {
    legacyKicker.remove();
  }

  [...panelInner.querySelectorAll(":scope > p")].forEach((paragraph) => {
    if (paragraph.classList.contains("small-note")) return;
    if (cleanString(paragraph.textContent).toLowerCase() === "portfólio") {
      paragraph.remove();
    }
  });

  if (buttons && overview) {
    buttons.insertAdjacentElement("afterend", overview);
  }

  if (notes.length > 1) {
    notes.slice(1).forEach((note) => note.remove());
  }
}

function normalizeSimpleStaticPanel(pageId) {
  // If content came from Supabase with panel-inner wrapper, flatten it
  const legacyInner = elements.panel.querySelector(".panel-inner:not(.panel-inner-static-shell)");
  if (legacyInner) {
    while (legacyInner.firstChild) elements.panel.insertBefore(legacyInner.firstChild, legacyInner);
    legacyInner.remove();
  }

  // Wrap everything in shell div if not already present
  let shell = elements.panel.querySelector(".panel-inner-static-shell");
  if (!shell) {
    shell = document.createElement("div");
    shell.className = "panel-inner-static-shell";
    while (elements.panel.firstChild) shell.appendChild(elements.panel.firstChild);
    elements.panel.appendChild(shell);
  }

  // Title: first heading
  const title = shell.querySelector("h1, h2, h3");
  if (title) {
    title.className = "static-page-title";
  }

  // Subtitle: first p or heading after title
  const allEls = [...shell.children];
  const titleIdx = title ? allEls.indexOf(title) : -1;
  const subtitle = allEls.find((el, i) => i > titleIdx && /^(P|H[23456])$/.test(el.tagName));
  if (subtitle) {
    subtitle.className = "static-page-subtitle";
  }

  // Remaining paragraphs
  allEls.forEach((el, i) => {
    if (i > titleIdx && el !== subtitle && el.tagName === "P") {
      el.className = "static-page-body";
    }
  });
}

function renderPortfolioOverview() {
  const activeFilters = hasActiveFilters();
  const selectedCount = Object.values(state.filters).reduce((total, values) => total + values.length, 0);

  return `
    <div class="portfolio-overview-card">
      <p class="small-note">${escapeHtml(formatProjectCount(state.filtered.length, state.projects.length))}</p>
      ${activeFilters ? `<div class="portfolio-overview-actions"><span class="small-note">${escapeHtml(selectedCount === 1 ? "1 filtro ativo" : `${selectedCount} filtros ativos`)}</span><button type="button" class="panel-button" data-action="clear-filters">✖</button></div>` : ""}
    </div>
  `;
}

function renderProjectPanel() {
  setPanelMode("project");
  const project = state.currentProject;
  const rawDesc = project.descricao || "";
  const descText = rawDesc.replace(/<[^>]+>/g, "").trim();
  const description = descText === "Texto em construção" ? "" : rawDesc;
  const descriptionClass = "project-description";
  const featuredBadge = project.isFeatured ? '<p class="project-badge">Destaque</p>' : "";
  const subtitle = project.subtitulo
    ? `<p class="project-subtitle-display">${escapeHtml(project.subtitulo)}</p>`
    : "";
  const context = renderProjectContextLine(project);
  const tags = renderClickableTags(project);
  const pairs = renderProjectPairs(project.pares);

  elements.panel.innerHTML = `
    <div class="panel-inner panel-inner-project">
      ${featuredBadge}
      <h1 class="titulo-principal">${escapeHtml(project.titulo)}</h1>
      ${subtitle}
      ${context}
      ${description ? `<div class="${descriptionClass}">${description}</div>` : ""}
      ${pairs}
      ${tags}
    </div>
  `;
}

function renderProjectContextLine(project) {
  const items = [
    project.cliente ? formatLabel(project.cliente) : "",
    project.ano,
    project.servico ? formatLabel(project.servico) : "",
    project.tipo && project.tipo !== "livro" ? formatLabel(project.tipo) : "",
  ].filter(Boolean);

  if (!items.length) {
    return "";
  }

  return `<p class="project-context-line">${escapeHtml(items.join(" • "))}</p>`;
}

function renderProjectPairs(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) {
    return "";
  }

  return `
    <div class="project-pairs">
      <div class="project-pairs-head">
        <h3 class="project-pairs-title">Trabalhos relacionados</h3>
      </div>
      <div class="project-pairs-grid">
        ${pairs.map((pair) => `
          <button
            type="button"
            class="project-pair-card"
            data-action="open-project-by-slug"
            data-project-slug="${escapeAttribute(pair.slug)}"
          >
            ${pair.thumb
              ? `<img class="project-pair-thumb" src="${escapeAttribute(pair.thumb)}" alt="${escapeAttribute(pair.titulo)}" loading="lazy">`
              : `<span class="project-pair-placeholder">${escapeHtml(pair.titulo)}</span>`
            }
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRelatedProjects(project) {
  const pairSlugs = new Set((project.pares || []).map((p) => p.slug));

  const byCatalog = (() => {
    if (!project.cliente) return [];
    return state.projects
      .filter((p) => p.slug !== project.slug && p.cliente === project.cliente && !pairSlugs.has(p.slug))
      .slice(0, 4);
  })();

  if (!byCatalog.length) return "";

  const renderThumbGrid = (items) => `
    <div class="project-pairs-grid">
      ${items.map((p) => `
        <button type="button" class="project-pair-card" data-action="open-project-by-slug" data-project-slug="${escapeAttribute(p.slug)}">
          ${p.thumb
            ? `<img class="project-pair-thumb" src="${escapeAttribute(p.thumb)}" alt="${escapeAttribute(p.titulo)}" loading="lazy">`
            : `<span class="project-pair-placeholder">${escapeHtml(p.titulo)}</span>`
          }
        </button>
      `).join("")}
    </div>
  `;

  const sections = [];
  if (byCatalog.length) sections.push(`<div class="project-related-section"><h3 class="project-pairs-title">Do mesmo catálogo</h3>${renderThumbGrid(byCatalog)}</div>`);

  return `<div class="project-related">${sections.join("")}</div>`;
}

function renderFilterPanel() {
  setPanelMode("filter");
  const criterion = FILTER_BY_ID.get(state.currentCriterionId) || FILTERS[0];
  const options = criterion ? getCriterionOptions(criterion) : [];
  const optionsHtml = `<div class="lista-filtros">${options.map((option) => renderFilterOption(criterion.id, option)).join("")}</div>`;

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
        ${optionsHtml}
      </div>

      <div class="acoes">
        <div class="acoes-filtros">
          <button type="button" class="acao-icone limpar" data-action="clear-filters" aria-label="Limpar filtros">✖</button>
          <button type="button" class="acao-icone voltar" data-action="show-portfolio-intro" aria-label="Voltar à introdução do portfólio">❖</button>
        </div>
      </div>

      <div class="contador">
        <div class="contador-resultados">${escapeHtml(formatProjectCount(state.filtered.length, state.projects.length))}</div>
      </div>
    </div>
  `;
}

function renderActiveFilters() {
  const chips = [];

  Object.entries(state.filters).forEach(([criterionId, values]) => {
    values.forEach((value) => {
      const formattedValue = formatLabel(value);

      chips.push(`
        <button
          type="button"
          class="filtro-ativo"
          data-action="remove-filter"
          data-criterion-id="${escapeAttribute(criterionId)}"
          data-value="${escapeAttribute(value)}"
        >
          ${escapeHtml(formattedValue)} ×
        </button>
      `);
    });
  });

  if (!chips.length) {
    return '<span class="small-note">Nenhum filtro ativo.</span>';
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
    !isDisabled ? "is-available" : "",
    selected ? "is-selected" : "",
    isDisabled ? "is-disabled" : ""
  ].filter(Boolean).join(" ");
  const countMarkup = typeof count === "number"
    ? `<span class="filtro-item-count">${count}</span>`
    : "";
  const actionAttribute = selected ? "" : 'data-action="toggle-filter"';

  return `
    <button
      type="button"
      class="${className}"
      ${actionAttribute}
      data-criterion-id="${escapeAttribute(criterionId)}"
      data-value="${escapeAttribute(value)}"
      ${isDisabled ? "disabled" : ""}
    >
      ${escapeHtml(formatLabel(value))}
      ${countMarkup}
    </button>
  `;
}

function getCriterionOptions(criterion) {
  const includeSet = getConfigSet(criterion.includeSet);
  const excludeSet = getConfigSet(criterion.excludeSet);
  const selectedValues = new Set(state.filters[criterion.id] || []);
  const baseProjects = getProjectsMatchingOtherCriteria(criterion.id);

  const values = Array.isArray(criterion.fixedOptions) && criterion.fixedOptions.length
    ? criterion.fixedOptions.map((value) => cleanString(value)).filter(Boolean)
    : collectCriterionCatalog(criterion, includeSet, excludeSet);

  selectedValues.forEach((value) => {
    if (!values.includes(value)) {
      values.push(value);
    }
  });

  return values.map((value) => {
    const count = countProjectsForOption(baseProjects, criterion, selectedValues, value);

    return {
      value,
      count,
      disabled: count === 0
    };
  });
}

function countProjectsForOption(baseProjects, criterion, selectedValues, candidateValue) {
  if (criterion.selectionOperator === "or") {
    let count = 0;

    baseProjects.forEach((project) => {
      if (matchesCriterion(project, criterion, candidateValue)) {
        count += 1;
      }
    });

    return count;
  }

  const nextSelections = new Set(selectedValues);
  nextSelections.add(candidateValue);

  let count = 0;

  baseProjects.forEach((project) => {
    const matches = matchesSelectedValues(project, criterion, [...nextSelections]);
    if (matches) {
      count += 1;
    }
  });

  return count;
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

  if (criterion.mode === "csv") {
    if (!sourceValue) return [];
    return sourceValue.split(",").map((s) => s.trim()).filter(Boolean);
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

      return matchesSelectedValues(project, criterion, selectedValues);
    });
  });
}

function getConfigSet(setName) {
  if (!setName) return null;
  const values = CONFIG.tagSets?.[setName];
  return Array.isArray(values) ? new Set(values) : null;
}

function renderColorSwatch(value) {
  const swatch = COLOR_SWATCHES[cleanString(value)];
  if (!swatch) return "";
  return `<span class="project-tag-swatch" style="background:${escapeAttribute(swatch)}"></span>`;
}

function enterCriterion(criterionId) {
  if (!FILTER_BY_ID.has(criterionId)) return;

  state.pairFocusSlugs = null;
  state.leftMode = state.currentProject ? "viewer" : "grid";
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
  state.pairFocusSlugs = null;
  state.leftMode = "grid";
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

  state.pairFocusSlugs = null;
  state.leftMode = state.currentProject ? "viewer" : "grid";
  applyFilters();
  renderGrid();
  renderPanel();
}

function removeFilter(criterionId, value) {
  if (!criterionId || !value) return;

  const values = state.filters[criterionId];
  if (!Array.isArray(values)) return;

  state.filters[criterionId] = values.filter((currentValue) => currentValue !== value);
  state.pairFocusSlugs = null;
  state.leftMode = state.currentProject ? "viewer" : "grid";
  applyFilters();
  renderGrid();
  renderPanel();
}

function clearFilters() {
  state.filters = createEmptyFilters();
  state.pairFocusSlugs = null;
  state.leftMode = state.currentProject ? "viewer" : "grid";
  applyFilters();
  renderGrid();
  renderPanel();
}

function clearPairFocus() {
  state.currentPage = CONFIG.portfolioPageId;
  state.portfolioMode = "intro";
  state.currentProject = null;
  state.currentImageIndex = 0;
  state.pairFocusSlugs = null;
  state.leftMode = "grid";
  updateMenu();
  applyFilters();
  renderViewer();
  renderGrid();
  renderPanel();
}

function showPairGrid() {
  if (!state.pairFocusSlugs) return;

  state.leftMode = "grid";
  renderViewer();
  renderGrid();
  renderPanel();
}

function navigateProject(direction) {
  if (!state.currentProject) return;

  const visible = getVisibleProjects();
  const currentIndex = visible.findIndex((p) => p.slug === state.currentProject.slug);
  if (currentIndex < 0) return;

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= visible.length) return;

  state.currentProject = visible[nextIndex];
  state.currentImageIndex = 0;
  if (state.pairFocusSlugs) {
    state.pairFocusSlugs = createPairFocusSlugs(state.currentProject);
  }
  renderViewer();
  renderPanel();
}

function filterByTag(criterionId, value) {
  if (!criterionId || !value) return;
  if (!FILTER_BY_ID.has(criterionId)) return;

  state.currentPage = CONFIG.portfolioPageId;
  state.currentCriterionId = criterionId;
  state.currentProject = null;
  state.currentImageIndex = 0;
  state.pairFocusSlugs = null;
  state.leftMode = "grid";
  state.portfolioMode = "criterio";
  state.filters = createEmptyFilters();
  state.filters[criterionId] = [value];
  updateMenu();
  applyFilters();
  renderViewer();
  renderGrid();
  renderPanel();
}

function renderProjectNavigation(project) {
  const visible = getVisibleProjects();
  const currentIndex = visible.findIndex((p) => p.slug === project.slug);
  if (currentIndex < 0 || visible.length <= 1) return "";

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < visible.length - 1;

  return `
    <nav class="project-navigation" aria-label="Navegação entre projetos">
      <button
        type="button"
        class="project-nav-btn${hasPrevious ? "" : " inativo"}"
        data-action="project-previous"
        aria-label="Projeto anterior"
        ${hasPrevious ? "" : "disabled"}
      >← anterior</button>
      <span class="project-nav-count">${currentIndex + 1} / ${visible.length}</span>
      <button
        type="button"
        class="project-nav-btn${hasNext ? "" : " inativo"}"
        data-action="project-next"
        aria-label="Próximo projeto"
        ${hasNext ? "" : "disabled"}
      >próximo →</button>
    </nav>
  `;
}

function renderClickableTags(project) {
  if (!Array.isArray(project.tags) || !project.tags.length) return "";

  const colorTagSet = getConfigSet("colorTags");
  const colorTags = colorTagSet ? project.tags.filter((t) => colorTagSet.has(t)) : [];
  const themeTags = project.tags.filter((t) => !colorTagSet || !colorTagSet.has(t));

  if (!colorTags.length && !themeTags.length) return "";

  const tagButtons = [
    ...colorTags.map((tag) => {
      const swatchColor = COLOR_SWATCHES[tag];
      const swatch = swatchColor
        ? `<span class="project-tag-swatch" style="background:${escapeAttribute(swatchColor)}"></span>`
        : "";
      return `<button type="button" class="project-tag project-tag-link project-tag-color" data-action="filter-by-tag" data-criterion-id="cores" data-value="${escapeAttribute(tag)}">${swatch}${escapeHtml(formatLabel(tag))}</button>`;
    }),
    ...themeTags.map((tag) => `<button type="button" class="project-tag project-tag-link" data-action="filter-by-tag" data-criterion-id="temas" data-value="${escapeAttribute(tag)}">${escapeHtml(formatLabel(tag))}</button>`)
  ];

  return `
    <div class="project-taxonomy">
      <div class="project-tag-list">
        ${tagButtons.join("")}
      </div>
    </div>
  `;
}


function renderColorFilterOption(criterionId, option) {
  const value = typeof option === "string" ? option : option?.value;
  const count = typeof option === "string" ? null : option?.count;
  const selected = state.filters[criterionId]?.includes(value);
  const isDisabled = !selected && Boolean(option?.disabled);
  const swatchColor = COLOR_SWATCHES[cleanString(value)] || "#ccc";

  const className = [
    "filtro-swatch-btn",
    !isDisabled ? "is-available" : "",
    selected ? "is-selected" : "",
    isDisabled ? "is-disabled" : ""
  ].filter(Boolean).join(" ");

  const actionAttribute = selected ? "" : 'data-action="toggle-filter"';
  const ariaLabel = `${formatLabel(value)}${typeof count === "number" ? ` (${count})` : ""}`;

  return `
    <button
      type="button"
      class="${className}"
      ${actionAttribute}
      data-criterion-id="${escapeAttribute(criterionId)}"
      data-value="${escapeAttribute(value)}"
      aria-label="${escapeAttribute(ariaLabel)}"
      ${isDisabled ? "disabled" : ""}
    >
      <span class="filtro-swatch-circle" style="background:${escapeAttribute(swatchColor)}"></span>
      <span class="filtro-swatch-label">${escapeHtml(formatLabel(value))}</span>
    </button>
  `;
}

function renderGridIcon() {
  return `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="5" y="5" width="40" height="40" fill="#444"></rect>
      <rect x="55" y="5" width="40" height="40" fill="#444"></rect>
      <rect x="5" y="55" width="40" height="40" fill="#444"></rect>
      <rect x="55" y="55" width="40" height="40" fill="#444"></rect>
    </svg>
  `;
}

function formatProjectCount(filteredCount, totalCount) {
  if (filteredCount === totalCount) {
    return `${filteredCount} projetos publicados`;
  }

  return `${filteredCount} de ${totalCount} projetos`;
}

function renderPanelState(title, message, tone = "neutral") {
  setPanelMode("state");
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

  if (LABEL_OVERRIDES[normalized]) {
    return LABEL_OVERRIDES[normalized];
  }

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

// ── Álbum secreto ────────────────────────────────────────────────────────────

function discoverAlbum() {
  state.albumDiscovered = true;
  renderAlbumDiscoveryPanel();
}

function enterAlbumMode() {
  state.albumMode = true;
  document.body.classList.add("album-mode-active");
  renderAlbumGrid();
  renderAlbumDiscoveryPanel();
}

function exitAlbumMode() {
  state.albumMode = false;
  state.albumDiscovered = false;
  state.currentAlbumPhoto = null;
  document.body.classList.remove("album-mode-active");
  closeAlbumFullscreen();
  renderGrid();
  renderPanel();
}

function renderAlbumDiscoveryPanel() {
  setPanelMode("static");
  elements.panel.innerHTML = `
    <div class="panel-inner panel-inner-static panel-album-discovery">
      <p class="album-discovery-text">Você descobriu a capa que não existe.</p>
      <div class="album-chips">
        <button type="button" class="album-chip album-chip-enter" data-action="album-enter">Entrar</button>
        <button type="button" class="album-chip album-chip-exit" data-action="album-exit">Sair</button>
      </div>
    </div>
  `;
}

function renderAlbumGrid() {
  const shuffledPhotos = shuffle([...ALBUM_PHOTOS]);
  elements.grid.innerHTML = "";

  shuffledPhotos.forEach((photo, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "grid-card";
    card.dataset.albumPhotoIndex = String(index);
    card.setAttribute("aria-label", photo.legenda || "Foto do álbum");
    card.dataset._albumId = photo.id;

    const inner = document.createElement("div");
    inner.className = "grid-card-inner";

    // Frente: foto
    const front = document.createElement("div");
    front.className = "grid-card-front";
    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = photo.legenda || "";
    img.loading = "lazy";
    front.appendChild(img);

    // Verso: mesma foto desfocada + legenda
    const back = document.createElement("div");
    back.className = "grid-card-back album-photo-back";

    const backBg = document.createElement("img");
    backBg.className = "grid-back-bg album-back-blur";
    backBg.src = photo.url;
    backBg.alt = "";
    backBg.setAttribute("aria-hidden", "true");
    back.appendChild(backBg);

    if (photo.legenda) {
      const legend = document.createElement("span");
      legend.className = "grid-back-title album-back-legend";
      legend.textContent = photo.legenda;
      back.appendChild(legend);
    }

    // Armazena índice real no array shuffled para o fullscreen
    card.dataset.albumPhotoIndex = String(index);
    card._albumPhoto = photo;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    elements.grid.appendChild(card);
  });

  // Guarda cópia embaralhada para o fullscreen navegar
  elements.grid._albumPhotos = shuffledPhotos;
  elements.gridView.hidden = false;
}

function openAlbumPhoto(index) {
  const photos = elements.grid._albumPhotos || ALBUM_PHOTOS;
  const photo = photos[index];
  if (!photo) return;
  state.currentAlbumPhoto = { photo, index, photos };

  // Overlay fullscreen
  let overlay = document.getElementById("album-fullscreen");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "album-fullscreen";
    overlay.className = "album-fullscreen";
    overlay.innerHTML = `
      <button type="button" class="album-fullscreen-close" aria-label="Fechar">✕</button>
      <img class="album-fullscreen-img" src="" alt="">
    `;
    overlay.querySelector(".album-fullscreen-close").addEventListener("click", closeAlbumFullscreen);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeAlbumFullscreen();
    });
    document.body.appendChild(overlay);
  }

  const imgEl = overlay.querySelector(".album-fullscreen-img");
  imgEl.src = photo.url;
  imgEl.alt = photo.legenda || "";
  overlay.hidden = false;
  document.body.classList.add("album-fullscreen-open");
}

function closeAlbumFullscreen() {
  const overlay = document.getElementById("album-fullscreen");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("album-fullscreen-open");
}

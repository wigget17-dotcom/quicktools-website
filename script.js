const allowedStatuses = new Set([
  "Available",
  "Coming Soon",
  "Beta",
  "Maintenance",
  "Unavailable"
]);

const statusClassMap = {
  Available: "status-available",
  "Coming Soon": "status-coming-soon",
  Beta: "status-beta",
  Maintenance: "status-maintenance",
  Unavailable: "status-unavailable"
};

const githubRepo = {
  owner: "wigget17-dotcom",
  repo: "quicktools-website",
  branch: "main"
};

const githubApiBase = `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}`;

let repoTreePromise = null;

const pageType = document.body.dataset.page || "home";

const fetchJson = async (path) => {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
};

const toTitleCase = (value) => value
  .replace(/[-_]/g, " ")
  .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeCategory = (value) => String(value || "uncategorized")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "-");

const normalizeStatus = (status) => (allowedStatuses.has(status) ? status : "Coming Soon");

const parseDate = (value) => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const unique = (items) => Array.from(new Set(items));

const isExternalUrl = (value) => /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("mailto:") || value.startsWith("tel:");

const resolveRelativePath = (folderPath, value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return "";
  }

  const trimmed = value.trim();

  if (isExternalUrl(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }

  if (trimmed.startsWith("./")) {
    return `${folderPath}/${trimmed.slice(2)}`;
  }

  if (trimmed.startsWith("../")) {
    return trimmed;
  }

  if (trimmed.includes("/")) {
    return trimmed;
  }

  return `${folderPath}/${trimmed}`;
};

const requiredConfigFields = [
  "name",
  "description",
  "category",
  "status",
  "featured",
  "version",
  "icon",
  "thumbnail",
  "author",
  "created",
  "updated",
  "tags",
  "download",
  "url",
  "folder"
];

const validateConfig = (item) => {
  const hasRequiredKeys = requiredConfigFields.every((field) => Object.hasOwn(item, field));

  if (!hasRequiredKeys) {
    return false;
  }

  const stringFields = [
    "name",
    "description",
    "category",
    "status",
    "version",
    "icon",
    "thumbnail",
    "author",
    "created",
    "updated",
    "download",
    "url",
    "folder"
  ];

  const stringsValid = stringFields.every((field) => typeof item[field] === "string");
  const booleanValid = typeof item.featured === "boolean";
  const tagsValid = Array.isArray(item.tags);

  return stringsValid && booleanValid && tagsValid;
};

const discoverFoldersFromManifest = async (indexFile, indexKey) => {
  try {
    const data = await fetchJson(indexFile);
    return Array.isArray(data[indexKey]) ? data[indexKey] : [];
  } catch {
    return [];
  }
};

const loadRepoTree = async () => {
  if (!repoTreePromise) {
    repoTreePromise = (async () => {
      try {
        const ref = await fetchJson(`${githubApiBase}/git/ref/heads/${githubRepo.branch}`);
        const commit = await fetchJson(ref.object.url);
        const treeSha = commit?.tree?.sha;

        if (!treeSha) {
          return [];
        }

        const tree = await fetchJson(`${githubApiBase}/git/trees/${treeSha}?recursive=1`);
        return Array.isArray(tree.tree) ? tree.tree : [];
      } catch {
        return [];
      }
    })();
  }

  return repoTreePromise;
};

const loadCollectionFromRepo = async ({ rootPath, type }) => {
  const tree = await loadRepoTree();
  const configPaths = tree
    .filter((entry) => entry.type === "blob" && entry.path.startsWith(`${rootPath}/`) && entry.path.endsWith("/config.json"))
    .map((entry) => entry.path)
    .sort((a, b) => a.localeCompare(b));

  const results = await Promise.allSettled(
    configPaths.map(async (configPath) => {
      const config = await fetchJson(`https://raw.githubusercontent.com/${githubRepo.owner}/${githubRepo.repo}/${githubRepo.branch}/${configPath}`);
      const folderPath = configPath.replace(/\/config\.json$/, "");
      const folder = typeof config.folder === "string" && config.folder.trim() !== ""
        ? config.folder.trim()
        : folderPath.split("/").pop();

      return {
        ...config,
        type,
        status: normalizeStatus(config.status),
        category: normalizeCategory(config.category),
        folder,
        url: resolveRelativePath(folderPath, config.url),
        download: resolveRelativePath(folderPath, config.download),
        thumbnail: resolveRelativePath(folderPath, config.thumbnail),
        icon: typeof config.icon === "string" ? config.icon.trim() : config.icon,
        screenshot: resolveRelativePath(folderPath, config.screenshot)
      };
    })
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter(validateConfig);
};

const loadCollectionFromManifest = async ({ basePath, indexFile, indexKey, type }) => {
  const folders = await discoverFoldersFromManifest(indexFile, indexKey);

  const results = await Promise.allSettled(
    folders.map(async (folder) => {
      const config = await fetchJson(`${basePath}/${folder}/config.json`);
      const folderPath = `${basePath}/${folder}`;

      return {
        ...config,
        type,
        status: normalizeStatus(config.status),
        category: normalizeCategory(config.category),
        folder: typeof config.folder === "string" && config.folder.trim() !== "" ? config.folder.trim() : folder,
        url: resolveRelativePath(folderPath, config.url),
        download: resolveRelativePath(folderPath, config.download),
        thumbnail: resolveRelativePath(folderPath, config.thumbnail),
        icon: typeof config.icon === "string" ? config.icon.trim() : config.icon,
        screenshot: resolveRelativePath(folderPath, config.screenshot)
      };
    })
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter(validateConfig);
};

const loadCollection = async ({
  basePath,
  indexFile,
  indexKey,
  type
}) => {
  if (window.location.protocol !== "file:") {
    const repoResults = await loadCollectionFromRepo({ rootPath: basePath, type });

    if (repoResults.length > 0) {
      return repoResults;
    }
  }

  return loadCollectionFromManifest({ basePath, indexFile, indexKey, type });
};

const compareBySortMode = (sortMode) => {
  if (sortMode === "name") {
    return (a, b) => a.name.localeCompare(b.name);
  }

  if (sortMode === "updated") {
    return (a, b) => parseDate(b.updated) - parseDate(a.updated);
  }

  return (a, b) => parseDate(b.created) - parseDate(a.created);
};

const applyFilters = (items, {
  query = "",
  type = "all",
  category = "all",
  status = "all",
  featuredOnly = false,
  sort = "newest"
} = {}) => {
  const normalizedQuery = query.trim().toLowerCase();

  return [...items]
    .filter((item) => {
      if (type !== "all" && item.type !== type) {
        return false;
      }

      if (category !== "all" && item.category !== category) {
        return false;
      }

      if (status !== "all" && item.status !== status) {
        return false;
      }

      if (featuredOnly && !item.featured) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const blob = [
        item.name,
        item.description,
        item.category,
        item.status,
        item.author,
        ...item.tags
      ].join(" ").toLowerCase();

      return blob.includes(normalizedQuery);
    })
    .sort(compareBySortMode(sort));
};

const cardIconSvg = (item) => {
  const key = `${item.icon} ${item.folder} ${item.category}`.toLowerCase();

  if (/qr|barcode|code/.test(key)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="6" height="6"></rect><rect x="15" y="3" width="6" height="6"></rect><rect x="3" y="15" width="6" height="6"></rect><path d="M15 15h2v2h-2zm4 0h2v2h-2zm-2 4h2v2h-2"></path></svg>';
  }

  if (/invoice|vat|business/.test(key)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 4v14H3V3h4z"></path><path d="M14 3v5h5"></path><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="14" y2="16"></line></svg>';
  }

  if (/pdf|text|guide|ebook/.test(key)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 4v14H7z"></path><path d="M17 3v4h4"></path><line x1="10" y1="12" x2="18" y2="12"></line><line x1="10" y1="16" x2="18" y2="16"></line></svg>';
  }

  if (/password|secure|lock/.test(key)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><circle cx="12" cy="15" r="1.5"></circle></svg>';
  }

  if (/unit|convert|calculator/.test(key)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"></rect><line x1="8" y1="7" x2="16" y2="7"></line><path d="M8 12h3v3H8zm5 0h3v3h-3zm-5 5h3v2H8zm5 0h3v2h-3"></path></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>';
};

const createItemCard = (item, index = 0) => {
  const card = document.createElement("article");
  card.className = "item-card";
  card.style.setProperty("--delay", `${index * 35}ms`);
  card.id = item.folder;

  const head = document.createElement("div");
  head.className = "item-head";

  const icon = document.createElement("span");
  icon.className = "item-icon";
  icon.innerHTML = cardIconSvg(item);
  icon.setAttribute("aria-hidden", "true");

  const status = document.createElement("span");
  status.className = `status ${statusClassMap[item.status]}`;
  status.textContent = item.status;

  head.append(icon, status);

  if (item.thumbnail) {
    const image = document.createElement("img");
    image.src = item.thumbnail;
    image.alt = `${item.name} thumbnail`;
    image.className = "item-thumb";
    image.loading = "lazy";
    image.decoding = "async";
    card.append(head, image);
  } else {
    card.append(head);
  }

  const title = document.createElement("h3");
  title.textContent = item.name;

  const description = document.createElement("p");
  description.textContent = item.description;

  const meta = document.createElement("div");
  meta.className = "item-meta";

  const link = document.createElement("a");
  link.className = "item-link";
  link.href = item.url || (item.type === "tool" ? "tools.html" : "products.html");
  link.textContent = item.type === "tool" ? "Launch" : "Open";

  const categoryPill = document.createElement("span");
  categoryPill.className = "category-pill";
  categoryPill.textContent = toTitleCase(normalizeCategory(item.category));

  meta.append(link, categoryPill);
  card.append(title, description, meta);

  return card;
};

const initRevealAnimations = () => {
  const elements = Array.from(document.querySelectorAll(".reveal-up"));

  if (elements.length === 0 || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  elements.forEach((element) => observer.observe(element));
};

const initFaqAccordion = () => {
  const triggers = Array.from(document.querySelectorAll("[data-faq-toggle]"));

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const item = trigger.closest(".faq-item");
      const panel = item ? item.querySelector(".faq-content") : null;

      if (!panel) {
        return;
      }

      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isOpen));
      panel.hidden = isOpen;
    });
  });
};

const initTestimonialCarousel = () => {
  const track = document.querySelector("[data-testimonial-track]");

  if (!track) {
    return;
  }

  const cards = Array.from(track.children);

  if (cards.length <= 1) {
    return;
  }

  const prevButton = document.querySelector("[data-testimonial-prev]");
  const nextButton = document.querySelector("[data-testimonial-next]");
  let index = 0;

  const goTo = (nextIndex) => {
    index = (nextIndex + cards.length) % cards.length;
    const offset = index * track.clientWidth;
    track.scrollTo({ left: offset, behavior: "smooth" });
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => goTo(index - 1));
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => goTo(index + 1));
  }

  window.setInterval(() => {
    goTo(index + 1);
  }, 7000);
};

const renderIntoGrid = (grid, items) => {
  if (!grid) {
    return;
  }

  grid.replaceChildren(...items.map((item, index) => createItemCard(item, index)));
  grid.setAttribute("aria-busy", "false");
};

const fillCategoryOptions = (select, categories) => {
  if (!select) {
    return;
  }

  const existing = Array.from(select.querySelectorAll("option"))
    .map((option) => option.value);

  categories.forEach((category) => {
    if (existing.includes(category)) {
      return;
    }

    const option = document.createElement("option");
    option.value = category;
    option.textContent = toTitleCase(category);
    select.append(option);
  });
};

const bindFilterPipeline = ({
  items,
  grid,
  empty,
  searchInput,
  clearButton,
  typeSelect,
  categorySelect,
  statusSelect,
  sortSelect,
  featuredCheckbox
}) => {
  const render = () => {
    const filtered = applyFilters(items, {
      query: searchInput ? searchInput.value : "",
      type: typeSelect ? typeSelect.value : "all",
      category: categorySelect ? categorySelect.value : "all",
      status: statusSelect ? statusSelect.value : "all",
      featuredOnly: featuredCheckbox ? featuredCheckbox.checked : false,
      sort: sortSelect ? sortSelect.value : "newest"
    });

    renderIntoGrid(grid, filtered);

    if (empty) {
      empty.hidden = filtered.length > 0;
    }
  };

  [searchInput, typeSelect, categorySelect, statusSelect, sortSelect, featuredCheckbox]
    .filter(Boolean)
    .forEach((element) => {
      element.addEventListener("input", render);
      element.addEventListener("change", render);
    });

  if (clearButton && searchInput) {
    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      render();
      searchInput.focus();
    });
  }

  render();
};

const updateStatistics = (tools, products) => {
  const statTotalTools = document.getElementById("statTotalTools");

  if (!statTotalTools) {
    return;
  }

  const statAvailableTools = document.getElementById("statAvailableTools");
  const statComingSoon = document.getElementById("statComingSoon");
  const statDigitalProducts = document.getElementById("statDigitalProducts");
  const statFeaturedItems = document.getElementById("statFeaturedItems");

  statTotalTools.textContent = String(tools.length);
  statAvailableTools.textContent = String(tools.filter((item) => item.status === "Available").length);
  statComingSoon.textContent = String(tools.filter((item) => item.status === "Coming Soon").length);
  statDigitalProducts.textContent = String(products.length);
  statFeaturedItems.textContent = String([...tools, ...products].filter((item) => item.featured).length);
};

const renderCategoryPills = async (tools, products) => {
  const categoryPills = document.getElementById("categoryPills");

  if (!categoryPills) {
    return;
  }

  const categoryNames = [];

  try {
    const categoryIndex = await fetchJson("categories/index.json");
    const slugs = Array.isArray(categoryIndex.categories) ? categoryIndex.categories : [];

    const categoryFiles = await Promise.allSettled(
      slugs.map((slug) => fetchJson(`categories/${slug}.json`))
    );

    categoryFiles
      .filter((result) => result.status === "fulfilled")
      .forEach((result) => {
        if (typeof result.value.slug === "string" && result.value.slug.trim() !== "") {
          categoryNames.push(toTitleCase(normalizeCategory(result.value.slug)));
        } else if (typeof result.value.name === "string" && result.value.name.trim() !== "") {
          categoryNames.push(toTitleCase(normalizeCategory(result.value.name)));
        }
      });
  } catch {
    // Fallback to item-derived categories below.
  }

  const fallback = [...tools, ...products].map((item) => toTitleCase(normalizeCategory(item.category)));
  const names = unique([...categoryNames, ...fallback]).sort((a, b) => a.localeCompare(b));

  categoryPills.replaceChildren(
    ...names.map((name) => {
      const pill = document.createElement("span");
      pill.className = "category-pill";
      pill.textContent = name;
      return pill;
    })
  );
};

const initHeaderState = () => {
  const header = document.querySelector(".site-header");

  if (!header) {
    return;
  }

  const update = () => {
    header.classList.toggle("scrolled", window.scrollY > 14);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
};

const initMobileMenu = () => {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  });
};

const initHome = async () => {
  const [tools, products] = await Promise.all([
    loadCollection({ basePath: "tools", indexFile: "tools/index.json", indexKey: "tools", type: "tool" }),
    loadCollection({ basePath: "products", indexFile: "products/index.json", indexKey: "products", type: "product" })
  ]);

  const allItems = [...tools, ...products];
  const categories = unique(allItems.map((item) => item.category)).sort((a, b) => a.localeCompare(b));

  renderIntoGrid(document.getElementById("featuredToolsGrid"), applyFilters(tools, { featuredOnly: true, sort: "updated" }).slice(0, 4));
  renderIntoGrid(document.getElementById("featuredProductsGrid"), applyFilters(products, { featuredOnly: true, sort: "updated" }).slice(0, 4));
  renderIntoGrid(document.getElementById("newestToolsGrid"), applyFilters(tools, { sort: "newest" }).slice(0, 4));
  renderIntoGrid(document.getElementById("newestProductsGrid"), applyFilters(products, { sort: "newest" }).slice(0, 4));
  renderIntoGrid(document.getElementById("latestReleasesGrid"), applyFilters(allItems, { sort: "updated" }).slice(0, 8));

  updateStatistics(tools, products);
  await renderCategoryPills(tools, products);

  const categorySelect = document.getElementById("homeCategoryFilter");
  fillCategoryOptions(categorySelect, categories);

  bindFilterPipeline({
    items: allItems,
    grid: document.getElementById("searchResultsGrid"),
    empty: document.getElementById("searchResultsEmpty"),
    searchInput: document.getElementById("globalSearch"),
    clearButton: document.getElementById("clearGlobalSearch"),
    typeSelect: document.getElementById("homeTypeFilter"),
    categorySelect,
    statusSelect: document.getElementById("homeStatusFilter"),
    sortSelect: document.getElementById("homeSortFilter"),
    featuredCheckbox: document.getElementById("homeFeaturedFilter")
  });
};

const initToolsPage = async () => {
  const tools = await loadCollection({
    basePath: "tools",
    indexFile: "tools/index.json",
    indexKey: "tools",
    type: "tool"
  });

  fillCategoryOptions(
    document.getElementById("toolsCategoryFilter"),
    unique(tools.map((item) => item.category)).sort((a, b) => a.localeCompare(b))
  );

  bindFilterPipeline({
    items: tools,
    grid: document.getElementById("toolsGrid"),
    empty: document.getElementById("toolsEmpty"),
    searchInput: document.getElementById("toolsSearch"),
    clearButton: document.getElementById("clearToolsSearch"),
    categorySelect: document.getElementById("toolsCategoryFilter"),
    statusSelect: document.getElementById("toolsStatusFilter"),
    sortSelect: document.getElementById("toolsSortFilter"),
    featuredCheckbox: document.getElementById("toolsFeaturedFilter")
  });
};

const initProductsPage = async () => {
  const products = await loadCollection({
    basePath: "products",
    indexFile: "products/index.json",
    indexKey: "products",
    type: "product"
  });

  fillCategoryOptions(
    document.getElementById("productsCategoryFilter"),
    unique(products.map((item) => item.category)).sort((a, b) => a.localeCompare(b))
  );

  bindFilterPipeline({
    items: products,
    grid: document.getElementById("productsGrid"),
    empty: document.getElementById("productsEmpty"),
    searchInput: document.getElementById("productsSearch"),
    clearButton: document.getElementById("clearProductsSearch"),
    categorySelect: document.getElementById("productsCategoryFilter"),
    statusSelect: document.getElementById("productsStatusFilter"),
    sortSelect: document.getElementById("productsSortFilter"),
    featuredCheckbox: document.getElementById("productsFeaturedFilter")
  });
};

const initCategoriesPage = async () => {
  const [tools, products] = await Promise.all([
    loadCollection({ basePath: "tools", indexFile: "tools/index.json", indexKey: "tools", type: "tool" }),
    loadCollection({ basePath: "products", indexFile: "products/index.json", indexKey: "products", type: "product" })
  ]);

  await renderCategoryPills(tools, products);
};

const init = async () => {
  initHeaderState();
  initMobileMenu();
  initRevealAnimations();
  initFaqAccordion();
  initTestimonialCarousel();

  if (pageType === "home") {
    await initHome();
  }

  if (pageType === "tools") {
    await initToolsPage();
  }

  if (pageType === "products") {
    await initProductsPage();
  }

  if (pageType === "categories") {
    await initCategoriesPage();
  }
};

init().catch((error) => {
  console.error(error);
});

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

const loadCollection = async ({
  basePath,
  indexFile,
  indexKey,
  type
}) => {
  const folders = await discoverFoldersFromManifest(indexFile, indexKey);

  const results = await Promise.allSettled(
    folders.map(async (folder) => {
      const config = await fetchJson(`${basePath}/${folder}/config.json`);
      return {
        ...config,
        type,
        status: normalizeStatus(config.status),
        category: normalizeCategory(config.category)
      };
    })
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter(validateConfig);
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

const createItemCard = (item, index = 0) => {
  const card = document.createElement("article");
  card.className = "item-card";
  card.style.setProperty("--delay", `${index * 35}ms`);
  card.id = item.folder;

  const head = document.createElement("div");
  head.className = "item-head";

  const icon = document.createElement("span");
  icon.className = "item-icon";
  icon.textContent = (item.icon || "it").slice(0, 2).toUpperCase();
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
  link.textContent = item.type === "tool" ? "Open tool" : "View product";

  const categoryPill = document.createElement("span");
  categoryPill.className = "category-pill";
  categoryPill.textContent = toTitleCase(normalizeCategory(item.category));

  meta.append(link, categoryPill);
  card.append(title, description, meta);

  return card;
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

const updateThemeToggleLabel = (theme) => {
  const toggle = document.getElementById("themeToggle");

  if (toggle) {
    toggle.textContent = theme === "dark" ? "Light" : "Dark";
  }
};

const applyTheme = (theme) => {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  localStorage.setItem("qt-theme", normalized);
  updateThemeToggleLabel(normalized);
};

const initTheme = () => {
  const stored = localStorage.getItem("qt-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored || (prefersDark ? "dark" : "light"));

  const toggle = document.getElementById("themeToggle");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme;
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
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
  initTheme();
  initMobileMenu();

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

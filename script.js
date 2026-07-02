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

const cardTypeLabels = {
  tool: "Open Tool",
  product: "View Product"
};

const unavailableStatuses = new Set([
  "Coming Soon",
  "Unavailable",
  "Maintenance"
]);

const toolIconSet = {
  "invoice-generator": '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 8h24l12 12v36H16z"></path><path d="M40 8v12h12"></path><path d="M24 28h16"></path><path d="M24 36h20"></path><path d="M24 44h12"></path></svg>'
};

const productIconSet = {
  business: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 10h28l8 8v36H14z"></path><path d="M42 10v8h8"></path><path d="M22 28h20"></path><path d="M22 36h20"></path><path d="M22 44h12"></path></svg>',
  planners: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="12" width="36" height="40" rx="8"></rect><path d="M14 24h36"></path><path d="M24 8v8"></path><path d="M40 8v8"></path><path d="M22 32h6"></path><path d="M34 32h6"></path><path d="M22 40h18"></path></svg>',
  diaries: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16" y="10" width="28" height="44" rx="8"></rect><path d="M24 10v44"></path><path d="M22 22h14"></path><path d="M22 30h14"></path><path d="M22 38h14"></path></svg>',
  templates: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="14" width="24" height="18" rx="5"></rect><rect x="28" y="24" width="24" height="18" rx="5"></rect><rect x="20" y="36" width="24" height="18" rx="5"></rect></svg>',
  ebooks: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 10h22l10 8v36H18z"></path><path d="M40 10v8h10"></path><path d="M24 24h16"></path><path d="M24 32h12"></path><path d="M24 40h16"></path></svg>',
  journals: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16" y="10" width="32" height="44" rx="8"></rect><path d="M22 18h20"></path><path d="M22 26h20"></path><path d="M22 34h20"></path><path d="M22 42h14"></path><path d="M46 22l6-2"></path></svg>',
  checklists: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16" y="12" width="32" height="40" rx="8"></rect><path d="M24 24l3 3 5-6"></path><path d="M24 34l3 3 5-6"></path><path d="M24 44l3 3 5-6"></path><path d="M34 24h10"></path><path d="M34 34h10"></path><path d="M34 44h10"></path></svg>',
  worksheets: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="10" width="36" height="44" rx="8"></rect><path d="M22 22h20"></path><path d="M22 30h20"></path><path d="M22 38h12"></path><path d="M22 46h16"></path><path d="M42 20l6 6-6 6"></path></svg>',
  "coloring-books": '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 14h20l8 6v30H18z"></path><path d="M38 14v6h8"></path><circle cx="26" cy="30" r="4"></circle><path d="M22 42l8-8 6 6 4-4 4 6"></path></svg>'
};

const toolBadgeMap = {
  privacy: "Privacy First",
  browser: "Runs in Browser",
  free: "Free"
};

const officialToolIconImages = {
  "qr-code-generator": "assets/images/tools/qr-code-generator-v2.png",
  "invoice-generator": "assets/images/tools/invoice-generator-official.png"
};

const officialUnavailableImage = "assets/images/tools/coming-soon.png";

const isUnavailableItem = (item) => unavailableStatuses.has(String(item.status || "").trim());

const getOfficialToolImage = (item) => {
  const folderKey = String(item.folder || "").toLowerCase();

  if (officialToolIconImages[folderKey]) {
    return officialToolIconImages[folderKey];
  }

  const nameKey = String(item.name || "").trim().toLowerCase();

  if (item.type === "tool" && nameKey === "qr code generator") {
    return officialToolIconImages["qr-code-generator"];
  }

  if (item.type === "tool" && nameKey === "invoice generator") {
    return officialToolIconImages["invoice-generator"];
  }

  return "";
};

const getItemIconSvg = (item) => {
  const folder = String(item.folder || "").toLowerCase();
  const category = String(item.category || "").toLowerCase();

  if (item.type === "tool") {
    if (toolIconSet[folder]) {
      return toolIconSet[folder];
    }

    if (/qr|code/.test(folder)) {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="7" y="7" width="16" height="16" rx="4"></rect><rect x="41" y="7" width="16" height="16" rx="4"></rect><rect x="7" y="41" width="16" height="16" rx="4"></rect><rect x="27" y="27" width="10" height="10" rx="2"></rect><rect x="41" y="27" width="6" height="6" rx="2"></rect><rect x="51" y="27" width="6" height="6" rx="2"></rect><rect x="41" y="37" width="6" height="6" rx="2"></rect><rect x="51" y="37" width="6" height="6" rx="2"></rect><rect x="27" y="41" width="6" height="6" rx="2"></rect><rect x="37" y="41" width="6" height="6" rx="2"></rect></svg>';
    }

    if (/invoice|business/.test(folder)) {
      return toolIconSet["invoice-generator"];
    }
  }

  if (productIconSet[folder]) {
    return productIconSet[folder];
  }

  if (/planner/.test(category)) {
    return productIconSet.planners;
  }

  if (/diary/.test(category)) {
    return productIconSet.diaries;
  }

  if (/template/.test(category)) {
    return productIconSet.templates;
  }

  if (/ebook/.test(category)) {
    return productIconSet.ebooks;
  }

  if (/journal/.test(category)) {
    return productIconSet.journals;
  }

  if (/checklist/.test(category)) {
    return productIconSet.checklists;
  }

  if (/worksheet/.test(category)) {
    return productIconSet.worksheets;
  }

  if (/coloring/.test(category)) {
    return productIconSet["coloring-books"];
  }

  return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22"></circle><path d="M22 32h20"></path><path d="M32 22v20"></path></svg>';
};

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

const loadCollectionFromRepo = async ({ rootPath, type, indexFile, indexKey }) => {
  const tree = await loadRepoTree();
  const allowedFolders = await discoverFoldersFromManifest(indexFile, indexKey);
  const allowedSet = new Set(allowedFolders.map((folder) => String(folder || "").trim()).filter(Boolean));
  const configPaths = tree
    .filter((entry) => {
      if (entry.type !== "blob" || !entry.path.startsWith(`${rootPath}/`) || !entry.path.endsWith("/config.json")) {
        return false;
      }

      if (allowedSet.size === 0) {
        return false;
      }

      const folder = entry.path.replace(`${rootPath}/`, "").replace(/\/config\.json$/, "");
      return allowedSet.has(folder);
    })
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
    const repoResults = await loadCollectionFromRepo({
      rootPath: basePath,
      type,
      indexFile,
      indexKey
    });

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

const cardIconSvg = (item) => getItemIconSvg(item);

const createCardIconElement = (item) => {
  const icon = document.createElement("span");
  icon.className = "item-icon";
  icon.setAttribute("aria-hidden", "true");

  const imageSrc = isUnavailableItem(item) ? officialUnavailableImage : getOfficialToolImage(item);

  if (imageSrc) {
    icon.classList.add("item-icon-image");
    const image = document.createElement("img");
    image.className = "item-icon-media";
    if (isUnavailableItem(item)) {
      image.classList.add("item-icon-media-coming-soon");
    }
    image.src = imageSrc;
    image.width = 96;
    image.height = 96;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    icon.append(image);
    return icon;
  }

  icon.innerHTML = cardIconSvg(item);
  return icon;
};

const buildCardBadges = (item) => {
  if (item.type === "tool") {
    return [toolBadgeMap.free, toolBadgeMap.privacy, toolBadgeMap.browser];
  }

  return ["Digital Product", "Curated Asset", `v${item.version || "1.0.0"}`];
};

const createItemCard = (item, index = 0) => {
  const card = document.createElement("article");
  card.className = `item-card item-card--${item.type}`;
  if (isUnavailableItem(item)) {
    card.classList.add("item-card-unavailable");
  }
  card.style.setProperty("--delay", `${index * 35}ms`);
  card.id = item.folder;

  if (isUnavailableItem(item)) {
    const comingSoonBadge = document.createElement("span");
    comingSoonBadge.className = "item-coming-soon-badge";
    comingSoonBadge.textContent = "Coming Soon";
    card.append(comingSoonBadge);
  }

  const visual = document.createElement("div");
  visual.className = "item-visual";

  const icon = createCardIconElement(item);

  const visualText = document.createElement("div");
  visualText.className = "item-visual-text";

  const typePill = document.createElement("span");
  typePill.className = "item-type-pill";
  typePill.textContent = item.type === "tool" ? "Browser Tool" : "Digital Product";

  const versionPill = document.createElement("span");
  versionPill.className = "item-version-pill";
  versionPill.textContent = `v${item.version || "1.0.0"}`;

  visualText.append(typePill, versionPill);
  visual.append(icon, visualText);

  const head = document.createElement("div");
  head.className = "item-head";

  const status = document.createElement("span");
  status.className = `status ${statusClassMap[item.status]}`;
  status.textContent = item.status;

  const version = document.createElement("span");
  version.className = "item-version-badge";
  version.textContent = `Version ${item.version || "1.0.0"}`;

  head.append(status, version);

  card.append(visual, head);

  const title = document.createElement("h3");
  title.textContent = item.name;

  const description = document.createElement("p");
  description.textContent = item.description;

  const meta = document.createElement("div");
  meta.className = "item-meta";

  const link = document.createElement("a");
  link.className = "item-link";
  link.href = item.url || (item.type === "tool" ? "tools.html" : "products.html");
  link.textContent = cardTypeLabels[item.type] || "Open";

  const categoryPill = document.createElement("span");
  categoryPill.className = "category-pill";
  categoryPill.textContent = toTitleCase(normalizeCategory(item.category));

  const badgeRow = document.createElement("div");
  badgeRow.className = "item-badge-row";

  buildCardBadges(item).forEach((badgeText) => {
    const badge = document.createElement("span");
    badge.className = "item-badge";
    badge.textContent = badgeText;
    badgeRow.append(badge);
  });

  meta.append(categoryPill, link);
  card.append(title, description, badgeRow, meta);

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

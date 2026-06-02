const state = {
  activeTab: "gamecards",
  items: [],
  filteredItems: [],
  editingItem: null,
  deletingItem: null,
};

const tabConfig = {
  gamecards: {
    label: "Game Cards",
    endpoint: "/api/gamecards",
    idField: "id",
    titleField: "content",
    searchFields: [
      "id",
      "type",
      "content",
      "category",
      "estimatedTime",
      "safetyNotes",
    ],
    filters: {
      type: "type",
      intensity: "intensity",
      category: "category",
    },
    fields: [
      {
        name: "id",
        label: "ID",
        type: "text",
        placeholder: "Auto-generated when blank",
      },
      {
        name: "_source",
        label: "Deck Source",
        type: "select",
        options: ["main", "level1", "level2", "level3", "level4", "level5"],
      },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: ["truth", "dare", "challenge", "fantasy", "roleplay"],
        required: true,
      },
      { name: "content", label: "Content", type: "textarea", required: true },
      {
        name: "intensity",
        label: "Intensity",
        type: "select",
        options: [1, 2, 3, 4, 5],
        parser: Number,
        required: true,
      },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          "communication",
          "physical",
          "emotional",
          "playful",
          "intimate",
        ],
        required: true,
      },
      { name: "isPremium", label: "Premium", type: "checkbox" },
      {
        name: "estimatedTime",
        label: "Timer / Estimated Time",
        type: "text",
        placeholder: "N/A, 30 sec, 5 min",
      },
      {
        name: "requires",
        label: "Required Props",
        type: "array",
        placeholder: "ice, scarf, candles",
      },
      { name: "safetyNotes", label: "Safety Notes", type: "textarea" },
    ],
  },
  kinks: {
    label: "Kinks",
    endpoint: "/api/kinks",
    idField: "id",
    titleField: "title",
    searchFields: [
      "id",
      "slug",
      "title",
      "titleEs",
      "description",
      "descriptionEs",
      "category",
      "tier",
      "tags",
      "pairKey",
      "pairRole",
    ],
    filters: {
      type: "tier",
      intensity: "intensityScale",
      category: "category",
    },
    fields: [
      {
        name: "id",
        label: "ID",
        type: "text",
        placeholder: "Auto-generated when blank",
      },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "titleEs", label: "Spanish Title", type: "text" },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
      },
      { name: "descriptionEs", label: "Spanish Description", type: "textarea" },
      {
        name: "tags",
        label: "Tags",
        type: "array",
        placeholder: "touch, intimacy, playful",
      },
      { name: "category", label: "Category", type: "text", required: true },
      {
        name: "intensityScale",
        label: "Intensity",
        type: "select",
        options: [1, 2, 3],
        parser: Number,
        required: true,
      },
      {
        name: "tier",
        label: "Tier",
        type: "select",
        options: ["soft", "naughty", "xxx"],
        required: true,
      },
      {
        name: "pairMode",
        label: "Use Give / Receive / Both Card",
        type: "checkbox",
      },
      {
        name: "pairKey",
        label: "Pair Key",
        type: "text",
        placeholder: "oral-pleasure",
      },
      {
        name: "pairRole",
        label: "Pair Role",
        type: "select",
        options: ["give", "receive"],
      },
    ],
  },
  "conversation-starters": {
    label: "Conversation Starters",
    endpoint: "/api/conversation-starters",
    idField: "id",
    titleField: "question",
    searchFields: [
      "id",
      "category",
      "question",
      "context",
      "followUps",
      "tags",
    ],
    filters: {
      type: "_source",
      intensity: "intensity",
      category: "category",
    },
    fields: [
      {
        name: "id",
        label: "ID",
        type: "text",
        placeholder: "Auto-generated when blank",
      },
      {
        name: "_source",
        label: "Prompt Pack",
        type: "select",
        options: [
          "dateNight",
          "gettingToKnow",
          "loveLanguages",
          "relationship",
          "spicy",
        ],
      },
      { name: "category", label: "Category", type: "text", required: true },
      {
        name: "intensity",
        label: "Intensity",
        type: "select",
        options: [1, 2, 3, 4, 5],
        parser: Number,
        required: true,
      },
      { name: "question", label: "Question", type: "textarea", required: true },
      {
        name: "followUps",
        label: "Follow-Ups",
        type: "array",
        placeholder: "One follow-up per line or comma-separated",
      },
      { name: "context", label: "Context", type: "textarea" },
      {
        name: "tags",
        label: "Tags",
        type: "array",
        placeholder: "flirty, playful, intimacy",
      },
    ],
  },
};

const sourceArrayNames = {
  main: null,
  level1: "LEVEL1_CARDS",
  level2: "LEVEL2_CARDS",
  level3: "LEVEL3_CARDS",
  level4: "LEVEL4_CARDS",
  level5: "LEVEL5_CARDS",
  dateNight: "dateNightStarters",
  gettingToKnow: "gettingToKnowStarters",
  loveLanguages: "loveLanguageStarters",
  relationship: "relationshipStarters",
  spicy: "spicyStarters",
};

const elements = {
  navButtons: document.querySelectorAll(".nav-btn"),
  refreshButton: document.getElementById("refresh-btn"),
  createButton: document.getElementById("create-btn"),
  searchInput: document.getElementById("search-input"),
  filterType: document.getElementById("filter-type"),
  filterIntensity: document.getElementById("filter-intensity"),
  filterCategory: document.getElementById("filter-category"),
  contentList: document.getElementById("content-list"),
  statusBar: document.getElementById("status-bar"),
  statusMessage: document.getElementById("status-message"),
  statusClose: document.getElementById("status-close"),
  editModal: document.getElementById("edit-modal"),
  editForm: document.getElementById("edit-form"),
  modalTitle: document.getElementById("modal-title"),
  modalClose: document.querySelector(".modal-close"),
  cancelButton: document.getElementById("cancel-btn"),
  saveButton: document.getElementById("save-btn"),
  deleteModal: document.getElementById("delete-modal"),
  deleteCancel: document.getElementById("delete-cancel"),
  deleteConfirm: document.getElementById("delete-confirm"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showStatus(message, type = "success") {
  elements.statusMessage.textContent = message;
  elements.statusBar.className = `status-bar ${type === "error" ? "error" : type === "warning" ? "warning" : ""}`;
  elements.statusBar.classList.remove("hidden");
}

function hideStatus() {
  elements.statusBar.classList.add("hidden");
}

function getConfig() {
  return tabConfig[state.activeTab];
}

function getItemId(item) {
  return String(item[getConfig().idField]);
}

async function requestJson(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }

  return payload;
}

function restoreScrollPosition(scrollY) {
  requestAnimationFrame(() => {
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const top = Math.min(scrollY, maxScroll);

    if (typeof window.scrollTo === "function") {
      window.scrollTo(0, top);
      return;
    }

    const scrollElement =
      document.scrollingElement || document.documentElement || document.body;
    if (scrollElement) {
      scrollElement.scrollTop = top;
    }
  });
}

async function loadItems(options = {}) {
  const config = getConfig();
  const { preserveScroll = false, scrollY = window.scrollY } = options;

  if (!preserveScroll) {
    elements.contentList.innerHTML = '<div class="loading">Loading...</div>';
    hideStatus();
  }

  try {
    const payload = await requestJson(config.endpoint);
    state.items = payload.data || [];
    updateFilterOptions();
    applyFilters();

    if (preserveScroll) {
      restoreScrollPosition(scrollY);
    }
  } catch (error) {
    state.items = [];
    state.filteredItems = [];
    elements.contentList.innerHTML = `<div class="empty-state">Could not load ${escapeHtml(config.label)}: ${escapeHtml(error.message)}</div>`;
    showStatus(error.message, "error");
  }
}

function updateFilterOptions() {
  const config = getConfig();
  updateSelect(elements.filterType, config.filters.type, "All Types");
  updateSelect(
    elements.filterCategory,
    config.filters.category,
    "All Categories",
  );

  const intensities = uniqueValues(config.filters.intensity);
  elements.filterIntensity.innerHTML =
    '<option value="">All Intensities</option>';
  intensities.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    elements.filterIntensity.appendChild(option);
  });
}

function uniqueValues(fieldName) {
  if (!fieldName) return [];
  return Array.from(
    new Set(
      state.items
        .map((item) => item[fieldName])
        .filter((value) => value !== undefined && value !== ""),
    ),
  ).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true }),
  );
}

function updateSelect(select, fieldName, label) {
  const currentValue = select.value;
  select.innerHTML = `<option value="">${label}</option>`;
  uniqueValues(fieldName).forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  select.value = Array.from(select.options).some(
    (option) => option.value === currentValue,
  )
    ? currentValue
    : "";
}

function applyFilters() {
  const config = getConfig();
  const query = elements.searchInput.value.trim().toLowerCase();
  const type = elements.filterType.value;
  const intensity = elements.filterIntensity.value;
  const category = elements.filterCategory.value;

  state.filteredItems = state.items.filter((item) => {
    const matchesSearch =
      !query ||
      config.searchFields.some((field) => {
        const value = item[field];
        return Array.isArray(value)
          ? value.join(" ").toLowerCase().includes(query)
          : String(value ?? "")
              .toLowerCase()
              .includes(query);
      });

    const matchesType = !type || String(item[config.filters.type]) === type;
    const matchesIntensity =
      !intensity || String(item[config.filters.intensity]) === intensity;
    const matchesCategory =
      !category || String(item[config.filters.category]) === category;

    return matchesSearch && matchesType && matchesIntensity && matchesCategory;
  });

  renderList();
}

function renderList() {
  if (state.filteredItems.length === 0) {
    elements.contentList.innerHTML =
      '<div class="empty-state">No matching content found.</div>';
    return;
  }

  elements.contentList.innerHTML = state.filteredItems.map(renderCard).join("");

  elements.contentList
    .querySelectorAll('[data-action="edit"]')
    .forEach((button) => {
      button.addEventListener("click", () =>
        openEditModal(findItem(button.dataset.id)),
      );
    });

  elements.contentList
    .querySelectorAll('[data-action="delete"]')
    .forEach((button) => {
      button.addEventListener("click", () =>
        openDeleteModal(findItem(button.dataset.id)),
      );
    });
}

function renderCard(item) {
  const config = getConfig();
  const id = getItemId(item);
  const title =
    item[config.titleField] ||
    item.title ||
    item.question ||
    item.content ||
    id;
  const body = item.description || item.context || item.safetyNotes || "";

  return `
    <article class="card">
      <div class="card-header">
        <span class="card-id">${escapeHtml(id)}</span>
        <div class="card-badges">${renderBadges(item)}</div>
      </div>
      <div class="card-content">
        <p>${escapeHtml(title)}</p>
        ${body ? `<p class="card-secondary">${escapeHtml(body)}</p>` : ""}
      </div>
      <div class="card-meta">${renderMeta(item)}</div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-small" data-action="edit" data-id="${escapeHtml(id)}">Edit</button>
        <button class="btn btn-danger btn-small" data-action="delete" data-id="${escapeHtml(id)}">Delete</button>
      </div>
    </article>
  `;
}

function renderBadges(item) {
  const badges = [];
  if (item.type) badges.push(["badge-type", item.type]);
  if (item.tier) badges.push(["badge-type", item.tier]);
  if (item._source) badges.push(["badge-category", item._source]);
  if (item.intensity || item.intensityScale)
    badges.push([
      "badge-intensity",
      `Intensity ${item.intensity || item.intensityScale}`,
    ]);
  if (item.category) badges.push(["badge-category", item.category]);
  if (item.pairMode) badges.push(["badge-premium", "Paired Card"]);
  if (item.pairRole) badges.push(["badge-type", item.pairRole]);
  if (typeof item.isPremium === "boolean")
    badges.push([
      item.isPremium ? "badge-premium" : "badge-free",
      item.isPremium ? "Premium" : "Free",
    ]);

  return badges
    .map(
      ([className, label]) =>
        `<span class="badge ${className}">${escapeHtml(label)}</span>`,
    )
    .join("");
}

function renderMeta(item) {
  const meta = [];
  if (item.estimatedTime) meta.push(`Timer: ${item.estimatedTime}`);
  if (Array.isArray(item.requires) && item.requires.length)
    meta.push(`Requires: ${item.requires.join(", ")}`);
  if (Array.isArray(item.tags) && item.tags.length)
    meta.push(`Tags: ${item.tags.join(", ")}`);
  if (item.pairKey) meta.push(`Pair: ${item.pairKey}`);
  if (item.pairMode && item.pairRole)
    meta.push(`Role selector source: ${item.pairRole}`);
  if (Array.isArray(item.followUps) && item.followUps.length)
    meta.push(`${item.followUps.length} follow-ups`);
  if (item.safetyNotes) meta.push("Safety notes");
  return meta.map(escapeHtml).join('<span aria-hidden="true">|</span>');
}

function findItem(id) {
  return state.items.find((item) => getItemId(item) === id);
}

function openEditModal(item = null) {
  state.editingItem = item;
  elements.modalTitle.textContent = item
    ? `Edit ${getConfig().label}`
    : `Create ${getConfig().label}`;
  elements.saveButton.textContent = item ? "Save Changes" : "Create";
  elements.editForm.innerHTML = renderForm(item || {});
  elements.editModal.classList.remove("hidden");
}

function closeEditModal() {
  state.editingItem = null;
  elements.editModal.classList.add("hidden");
  elements.editForm.innerHTML = "";
}

function renderForm(item) {
  return getConfig()
    .fields.map((field) => renderField(field, item[field.name]))
    .join("");
}

function renderField(field, value) {
  const id = `field-${field.name}`;
  const required = field.required ? "required" : "";
  const placeholder = field.placeholder
    ? `placeholder="${escapeHtml(field.placeholder)}"`
    : "";

  if (field.type === "textarea") {
    return `
      <div class="form-group">
        <label for="${id}">${escapeHtml(field.label)}</label>
        <textarea id="${id}" name="${field.name}" ${required} ${placeholder}>${escapeHtml(value || "")}</textarea>
      </div>
    `;
  }

  if (field.type === "select") {
    const options = field.options
      .map((option) => {
        const selected =
          String(value ?? "") === String(option) ? "selected" : "";
        return `<option value="${escapeHtml(option)}" ${selected}>${escapeHtml(option)}</option>`;
      })
      .join("");

    return `
      <div class="form-group">
        <label for="${id}">${escapeHtml(field.label)}</label>
        <select id="${id}" name="${field.name}" ${required}>
          <option value="">Select...</option>
          ${options}
        </select>
      </div>
    `;
  }

  if (field.type === "checkbox") {
    return `
      <div class="form-group form-checkbox">
        <input id="${id}" name="${field.name}" type="checkbox" ${value ? "checked" : ""}>
        <label for="${id}">${escapeHtml(field.label)}</label>
      </div>
    `;
  }

  if (field.type === "array") {
    return `
      <div class="form-group">
        <label for="${id}">${escapeHtml(field.label)}</label>
        <textarea id="${id}" name="${field.name}" ${placeholder}>${escapeHtml(Array.isArray(value) ? value.join("\n") : value || "")}</textarea>
      </div>
    `;
  }

  return `
    <div class="form-group">
      <label for="${id}">${escapeHtml(field.label)}</label>
      <input id="${id}" name="${field.name}" type="text" value="${escapeHtml(value || "")}" ${required} ${placeholder}>
    </div>
  `;
}

function collectFormData() {
  const config = getConfig();
  const data = {};

  config.fields.forEach((field) => {
    const input = elements.editForm.elements[field.name];
    if (!input) return;

    if (field.type === "checkbox") {
      data[field.name] = input.checked;
      return;
    }

    if (field.type === "array") {
      data[field.name] = input.value
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean);
      return;
    }

    const rawValue = input.value.trim();
    data[field.name] =
      field.parser && rawValue !== "" ? field.parser(rawValue) : rawValue;
  });

  if (state.activeTab === "gamecards") {
    data._arrayName =
      data._source === "main"
        ? data.isPremium
          ? "PREMIUM_CARDS"
          : "FREE_CARDS"
        : sourceArrayNames[data._source];
  }

  if (state.activeTab === "conversation-starters") {
    data._arrayName = sourceArrayNames[data._source];
  }

  return data;
}

async function saveItem(event) {
  event.preventDefault();

  const config = getConfig();
  const data = collectFormData();
  const scrollY = window.scrollY;
  const isEditing = Boolean(state.editingItem);
  const url = isEditing
    ? `${config.endpoint}/${encodeURIComponent(getItemId(state.editingItem))}`
    : config.endpoint;

  try {
    await requestJson(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(data),
    });
    closeEditModal();
    await loadItems({ preserveScroll: true, scrollY });
    showStatus(`${config.label} ${isEditing ? "updated" : "created"}.`);
    restoreScrollPosition(scrollY);
  } catch (error) {
    showStatus(error.message, "error");
  }
}

function openDeleteModal(item) {
  state.deletingItem = item;
  elements.deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  state.deletingItem = null;
  elements.deleteModal.classList.add("hidden");
}

async function deleteItem() {
  if (!state.deletingItem) return;

  const config = getConfig();
  const id = getItemId(state.deletingItem);

  try {
    const scrollY = window.scrollY;
    await requestJson(`${config.endpoint}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    closeDeleteModal();
    await loadItems({ preserveScroll: true, scrollY });
    showStatus(`${config.label} deleted.`);
    restoreScrollPosition(scrollY);
  } catch (error) {
    showStatus(error.message, "error");
  }
}

function switchTab(tab) {
  state.activeTab = tab;
  elements.searchInput.value = "";
  elements.filterType.value = "";
  elements.filterIntensity.value = "";
  elements.filterCategory.value = "";

  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  loadItems();
}

function bindEvents() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  elements.refreshButton.addEventListener("click", loadItems);
  elements.createButton.addEventListener("click", () => openEditModal());
  elements.searchInput.addEventListener("input", applyFilters);
  elements.filterType.addEventListener("change", applyFilters);
  elements.filterIntensity.addEventListener("change", applyFilters);
  elements.filterCategory.addEventListener("change", applyFilters);
  elements.statusClose.addEventListener("click", hideStatus);
  elements.editForm.addEventListener("submit", saveItem);
  elements.saveButton.addEventListener("click", () =>
    elements.editForm.requestSubmit(),
  );
  elements.modalClose.addEventListener("click", closeEditModal);
  elements.cancelButton.addEventListener("click", closeEditModal);
  elements.deleteCancel.addEventListener("click", closeDeleteModal);
  elements.deleteConfirm.addEventListener("click", deleteItem);

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", () => {
      closeEditModal();
      closeDeleteModal();
    });
  });
}

bindEvents();
loadItems();

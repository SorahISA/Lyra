(function setupProfiles() {
  const REGISTRY_KEY = "bdon-calc-profiles-v1";
  const LEGACY_STATE_KEY = "bdon-calc-teams-v1";
  const LEGACY_OPTIMIZER_KEY = "bdon-calc-optimizer-v1";
  const DEFAULT_PROFILE = { id: "default", name: "預設" };

  const stateKey = (id) => `bdon-calc-profile:${id}:calculator`;
  const optimizerKey = (id) => `bdon-calc-profile:${id}:optimizer`;

  function cleanName(value, fallback = "未命名") {
    const name = String(value ?? "").trim().slice(0, 40);
    return name || fallback;
  }

  function readRegistry() {
    try {
      const saved = JSON.parse(localStorage.getItem(REGISTRY_KEY));
      const profiles = Array.isArray(saved?.profiles)
        ? saved.profiles
          .filter((profile) => typeof profile?.id === "string" && /^[a-zA-Z0-9_-]+$/.test(profile.id))
          .map((profile, index) => ({ id: profile.id, name: cleanName(profile.name, `設定檔 ${index + 1}`) }))
        : [];
      if (!profiles.length) return { activeId: DEFAULT_PROFILE.id, profiles: [DEFAULT_PROFILE] };
      const activeId = profiles.some((profile) => profile.id === saved?.activeId)
        ? saved.activeId
        : profiles[0].id;
      return { activeId, profiles };
    } catch {
      return { activeId: DEFAULT_PROFILE.id, profiles: [DEFAULT_PROFILE] };
    }
  }

  function writeRegistry(registry) {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  }

  function migrateLegacyData(registry) {
    const defaultStateKey = stateKey(DEFAULT_PROFILE.id);
    const defaultOptimizerKey = optimizerKey(DEFAULT_PROFILE.id);
    if (!localStorage.getItem(defaultStateKey)) {
      const legacyState = localStorage.getItem(LEGACY_STATE_KEY);
      if (legacyState) localStorage.setItem(defaultStateKey, legacyState);
    }
    if (!localStorage.getItem(defaultOptimizerKey)) {
      const legacyOptimizer = localStorage.getItem(LEGACY_OPTIMIZER_KEY);
      if (legacyOptimizer) localStorage.setItem(defaultOptimizerKey, legacyOptimizer);
    }
    writeRegistry(registry);
  }

  let registry = readRegistry();
  try {
    migrateLegacyData(registry);
  } catch {
    // Pages still work with in-memory defaults if browser storage is unavailable.
  }

  function activeProfile() {
    return registry.profiles.find((profile) => profile.id === registry.activeId) ?? registry.profiles[0];
  }

  function defaultState() {
    return {
      normalOptions: [{ id: 1, name: "一般隊伍 1", rank: "A", pt: 0, item: 0 }],
      eventOptions: [{ id: 1, name: "活動隊伍 1", rank: "A", pt: 0, item: 0 }],
      targetPt: 1000,
      targetItem: 1000,
      ownedPt: 0,
      ownedItem: 0,
      ownedCp: 0,
      shopSelections: {},
      shopQuantityDefaultsVersion: 2,
    };
  }

  function createProfile() {
    const suggested = `設定檔 ${registry.profiles.length + 1}`;
    const entered = window.prompt("新 profile 名稱", suggested);
    if (entered === null) return;
    const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const profile = { id, name: cleanName(entered, suggested) };
    registry.profiles.push(profile);
    registry.activeId = id;
    try {
      localStorage.setItem(stateKey(id), JSON.stringify(defaultState()));
      localStorage.setItem(optimizerKey(id), JSON.stringify({ maxFire: 5 }));
      writeRegistry(registry);
    } finally {
      window.location.reload();
    }
  }

  function renameProfile() {
    const profile = activeProfile();
    const entered = window.prompt("重新命名 profile", profile.name);
    if (entered === null) return;
    profile.name = cleanName(entered, profile.name);
    writeRegistry(registry);
    renderControls();
  }

  function deleteProfile() {
    if (registry.profiles.length <= 1) {
      window.alert("至少需要保留一個 profile。");
      return;
    }
    const profile = activeProfile();
    if (!window.confirm(`確定刪除「${profile.name}」？此 profile 的資料將無法復原。`)) return;
    localStorage.removeItem(stateKey(profile.id));
    localStorage.removeItem(optimizerKey(profile.id));
    registry.profiles = registry.profiles.filter((candidate) => candidate.id !== profile.id);
    registry.activeId = registry.profiles[0].id;
    writeRegistry(registry);
    window.location.reload();
  }

  function switchProfile(id) {
    if (id === registry.activeId || !registry.profiles.some((profile) => profile.id === id)) return;
    registry.activeId = id;
    writeRegistry(registry);
    window.location.reload();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderControls() {
    document.querySelectorAll("[data-profile-controls]").forEach((container) => {
      container.innerHTML = `<label class="profile-select-label">
        <span>PROFILE</span>
        <select data-profile-select aria-label="選擇 profile">
          ${registry.profiles.map((profile) => `<option value="${profile.id}" ${profile.id === registry.activeId ? "selected" : ""}>${escapeHtml(profile.name)}</option>`).join("")}
        </select>
      </label>
      <button type="button" data-profile-action="create">新增</button>
      <button type="button" data-profile-action="rename">改名</button>
      <button type="button" class="profile-delete" data-profile-action="delete" ${registry.profiles.length <= 1 ? "disabled" : ""}>刪除</button>`;
    });
  }

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-profile-select]");
    if (select) switchProfile(select.value);
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-action]");
    if (!button) return;
    if (button.dataset.profileAction === "create") createProfile();
    if (button.dataset.profileAction === "rename") renameProfile();
    if (button.dataset.profileAction === "delete") deleteProfile();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== REGISTRY_KEY) return;
    const next = readRegistry();
    if (next.activeId !== registry.activeId) window.location.reload();
    registry = next;
    renderControls();
  });

  window.BdonProfiles = {
    registryKey: REGISTRY_KEY,
    stateKey: () => stateKey(activeProfile().id),
    optimizerKey: () => optimizerKey(activeProfile().id),
    active: () => ({ ...activeProfile() }),
    renderControls,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderControls);
  else renderControls();
})();

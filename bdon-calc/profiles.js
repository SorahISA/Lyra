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

  let modalResolve = null;
  let modalReturnFocus = null;

  function ensureProfileModal() {
    let modal = document.querySelector("#profileModal");
    if (modal) return modal;

    const style = document.createElement("style");
    style.textContent = `
      body.profile-modal-open { overflow: hidden; }
      .profile-modal[hidden] { display: none; }
      .profile-modal { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; }
      .profile-modal-backdrop { position: absolute; inset: 0; background: rgb(2 8 15 / 76%); backdrop-filter: blur(5px); }
      .profile-modal-card { position: relative; width: min(100%, 430px); padding: 22px; border: 1px solid #35506a; border-radius: 16px; background: #0c1b2c; color: #f4f8ff; box-shadow: 0 26px 80px rgb(0 0 0 / 55%); }
      .profile-modal-card h2 { margin: 0; font-size: 1.05rem; }
      .profile-modal-message { margin: 9px 0 0; color: #94a6bd; font-size: .8rem; line-height: 1.55; }
      .profile-modal-label { display: grid; gap: 7px; margin-top: 17px; color: #94a6bd; font-size: .7rem; font-weight: 800; }
      .profile-modal-input { width: 100%; height: 42px; padding: 0 11px; border: 1px solid #35506a; border-radius: 9px; outline: 0; background: #071320; color: #f4f8ff; font: inherit; font-weight: 800; }
      .profile-modal-input:focus { border-color: #ff6ba7; outline: 2px solid #ff6ba7; outline-offset: 2px; }
      .profile-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
      .profile-modal-actions button { min-width: 82px; height: 38px; padding: 0 13px; border: 1px solid #35506a; border-radius: 9px; background: #102238; color: #c6d6e8; cursor: pointer; font: inherit; font-size: .74rem; font-weight: 800; }
      .profile-modal-actions button:hover, .profile-modal-actions button:focus-visible { border-color: #ff6ba7; color: #ff6ba7; }
      .profile-modal-confirm { background: #46182f !important; color: #ff6ba7 !important; }
      .profile-modal-confirm.danger { border-color: #8a4b40; background: #321c1b !important; color: #ff9b79 !important; }
    `;
    document.head.append(style);

    modal = document.createElement("div");
    modal.id = "profileModal";
    modal.className = "profile-modal";
    modal.hidden = true;
    modal.innerHTML = `<div class="profile-modal-backdrop" data-profile-modal-cancel></div>
      <form class="profile-modal-card" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle" aria-describedby="profileModalMessage">
        <h2 id="profileModalTitle"></h2>
        <p class="profile-modal-message" id="profileModalMessage"></p>
        <label class="profile-modal-label">
          <span>名稱</span>
          <input class="profile-modal-input" id="profileModalInput" maxlength="40" autocomplete="off" />
        </label>
        <div class="profile-modal-actions">
          <button type="button" data-profile-modal-cancel>取消</button>
          <button type="submit" class="profile-modal-confirm">確定</button>
        </div>
      </form>`;
    document.body.append(modal);

    const close = (value) => {
      modal.hidden = true;
      document.body.classList.remove("profile-modal-open");
      const resolve = modalResolve;
      modalResolve = null;
      resolve?.(value);
      modalReturnFocus?.focus();
      modalReturnFocus = null;
    };
    modal.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = modal.querySelector("#profileModalInput");
      close(input.hidden ? true : input.value);
    });
    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-profile-modal-cancel]")) close(null);
    });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
      }
    });
    return modal;
  }

  function openProfileModal({ title, message = "", value = null, confirmText = "確定", danger = false, cancel = true }) {
    const modal = ensureProfileModal();
    const input = modal.querySelector("#profileModalInput");
    const label = input.closest("label");
    const cancelButton = modal.querySelector(".profile-modal-actions [type='button']");
    const confirmButton = modal.querySelector(".profile-modal-confirm");
    modal.querySelector("#profileModalTitle").textContent = title;
    const messageElement = modal.querySelector("#profileModalMessage");
    messageElement.textContent = message;
    messageElement.hidden = !message;
    label.hidden = value === null;
    input.hidden = value === null;
    input.value = value ?? "";
    cancelButton.hidden = !cancel;
    confirmButton.textContent = confirmText;
    confirmButton.classList.toggle("danger", danger);
    modalReturnFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("profile-modal-open");
    requestAnimationFrame(() => (value === null ? confirmButton : input).focus());
    return new Promise((resolve) => { modalResolve = resolve; });
  }

  async function createProfile() {
    const suggested = `設定檔 ${registry.profiles.length + 1}`;
    const entered = await openProfileModal({
      title: "新增 profile",
      message: "每個 profile 的隊伍、目標與精算設定彼此獨立。",
      value: suggested,
      confirmText: "新增",
    });
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

  async function renameProfile() {
    const profile = activeProfile();
    const entered = await openProfileModal({
      title: "重新命名 profile",
      value: profile.name,
      confirmText: "儲存",
    });
    if (entered === null) return;
    profile.name = cleanName(entered, profile.name);
    writeRegistry(registry);
    renderControls();
  }

  async function deleteProfile() {
    if (registry.profiles.length <= 1) {
      await openProfileModal({
        title: "無法刪除 profile",
        message: "至少需要保留一個 profile。",
        confirmText: "知道了",
        cancel: false,
      });
      return;
    }
    const profile = activeProfile();
    const confirmed = await openProfileModal({
      title: `刪除「${profile.name}」？`,
      message: "此 profile 的隊伍、目標與精算設定將無法復原。",
      confirmText: "刪除",
      danger: true,
    });
    if (!confirmed) return;
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

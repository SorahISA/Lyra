const rates = {
  normal: {
    SS: { pt: 100, item: 120, cp: 10 },
    S: { pt: 75, item: 90, cp: 8 },
    A: { pt: 50, item: 60, cp: 6 },
    B: { pt: 35, item: 42, cp: 5 },
    C: { pt: 25, item: 30, cp: 4 },
    D: { pt: 15, item: 18, cp: 3 },
  },
  event: {
    SS: { pt: 25, item: 24.75 },
    S: { pt: 19.5, item: 22.25 },
    A: { pt: 16.25, item: 18.75 },
    B: { pt: 12.75, item: 17 },
    C: { pt: 10, item: 13.25 },
    D: { pt: 7.5, item: 7.25, approximate: true },
  },
};

const availableRanks = {
  normal: ["SS", "S", "A", "B", "C", "D"],
  event: ["SS", "S", "A", "B", "C", "D"],
};

const rewardIcons = {
  "星鑽": "https://assets.bdon.moe/zh-Hant/Item/common/item_icon_star/item_icon_star.webp",
  "硬幣": "https://assets.bdon.moe/zh-Hant/Item/common/item_icon_coin/item_icon_coin.webp",
  "快照EXP": "https://assets.bdon.moe/zh-Hant/Item/exp/item_icon_exp_005/item_icon_exp_005.webp",
  "團員EXP": "https://assets.bdon.moe/zh-Hant/Item/exp/item_icon_exp_004/item_icon_exp_004.webp",
  "夢限大MewType 稜晶": "https://assets.bdon.moe/zh-Hant/Item/prism/item_icon_prism_003/item_icon_prism_003.webp",
  "演出技能強化券": "https://assets.bdon.moe/zh-Hant/Item/ticket/item_icon_ticket_skill_001/item_icon_ticket_skill_001.webp",
  "激奏技能強化券": "https://assets.bdon.moe/zh-Hant/Item/ticket/item_icon_ticket_skill_002/item_icon_ticket_skill_002.webp",
  "技能強化券": "https://assets.bdon.moe/zh-Hant/Item/ticket/item_icon_ticket_skill_003/item_icon_ticket_skill_003.webp",
  "SP技能強化券": "https://assets.bdon.moe/zh-Hant/Item/ticket/item_icon_ticket_skill_004/item_icon_ticket_skill_004.webp",
  "愛的奔流 AtoZ 報酬貼圖": "https://assets.bdon.moe/zh-Hant/Stamp/illust/stamp_illust_yuno_003/stamp_illust_yuno_003.webp",
  "奇蹟水晶": "https://assets.bdon.moe/zh-Hant/Item/crystal/item_icon_crystal_002/item_icon_crystal_002.webp",
  "希望稜晶": "https://assets.bdon.moe/zh-Hant/Item/prism/item_icon_prism_006/item_icon_prism_006.webp",
  "峰月律 · Night・Flight": "https://assets.bdon.moe/zh-Hans/MemberCard/63/member_thumbnail/member_thumbnail.webp",
  "幸運水晶": "https://assets.bdon.moe/zh-Hant/Item/crystal/item_icon_crystal_001/item_icon_crystal_001.webp",
  "活動獎章（紺碧）": "https://assets.bdon.moe/zh-Hant/Item/event/item_icon_event_badge_002/item_icon_event_badge_002.webp",
};

const pointRewards = [
  [500,40,"星鑽"], [1000,15000,"硬幣"], [2000,15000,"快照EXP"], [3000,15000,"團員EXP"], [4000,5,"夢限大MewType 稜晶"], [5000,5,"演出技能強化券"],
  [6000,5,"激奏技能強化券"], [7000,5,"技能強化券"], [8000,5,"夢限大MewType 稜晶"], [9000,40,"星鑽"], [10000,5,"夢限大MewType 稜晶"], [12000,15000,"硬幣"],
  [14000,45000,"快照EXP"], [15000,45000,"團員EXP"], [16000,10,"夢限大MewType 稜晶"], [18000,5,"演出技能強化券"], [20000,5,"激奏技能強化券"], [22000,5,"技能強化券"],
  [24000,5,"SP技能強化券"], [27000,40,"星鑽"], [30000,1,"愛的奔流 AtoZ 報酬貼圖"], [35000,5,"奇蹟水晶"], [40000,45000,"硬幣"], [45000,10,"夢限大MewType 稜晶"],
  [50000,5,"奇蹟水晶"], [55000,25,"演出技能強化券"], [60000,25,"激奏技能強化券"], [65000,20,"技能強化券"], [70000,5,"奇蹟水晶"], [75000,40,"星鑽"],
  [80000,5,"奇蹟水晶"], [85000,5,"希望稜晶"], [90000,25,"演出技能強化券"], [95000,10,"夢限大MewType 稜晶"], [100000,1,"峰月律 · Night・Flight"], [105000,10,"幸運水晶"],
  [110000,10,"幸運水晶"], [115000,5,"奇蹟水晶"], [120000,25,"激奏技能強化券"], [125000,40,"星鑽"], [130000,5,"SP技能強化券"], [135000,10,"奇蹟水晶"],
  [140000,10,"夢限大MewType 稜晶"], [145000,90000,"團員EXP"], [150000,1,"峰月律 · Night・Flight"], [155000,40,"星鑽"], [160000,10,"幸運水晶"], [165000,10,"幸運水晶"],
  [170000,25,"演出技能強化券"], [175000,10,"奇蹟水晶"], [180000,10,"夢限大MewType 稜晶"], [185000,25,"激奏技能強化券"], [190000,10,"SP技能強化券"], [200000,1,"峰月律 · Night・Flight"],
  [210000,90000,"硬幣"], [220000,40,"星鑽"], [230000,25,"夢限大MewType 稜晶"], [240000,10,"奇蹟水晶"], [250000,90000,"快照EXP"], [260000,5,"希望稜晶"],
  [270000,55,"演出技能強化券"], [280000,90000,"硬幣"], [300000,1,"峰月律 · Night・Flight"], [330000,55,"激奏技能強化券"], [375000,15,"奇蹟水晶"], [450000,40,"星鑽"],
  [525000,55,"夢限大MewType 稜晶"], [600000,20,"SP技能強化券"], [675000,1,"峰月律 · Night・Flight"], [750000,20,"希望稜晶"], [825000,20,"奇蹟水晶"], [900000,40,"星鑽"],
  [1000000,100000,"活動獎章（紺碧）"], [1250000,100000,"活動獎章（紺碧）"], [1500000,100000,"活動獎章（紺碧）"], [2000000,100000,"活動獎章（紺碧）"], [2500000,100000,"活動獎章（紺碧）"], [3000000,100000,"活動獎章（紺碧）"],
].map(([point, count, name]) => ({ point, count, name, icon: rewardIcons[name] }));

const itemAssetRoot = "https://assets.bdon.moe/zh-Hant/Item";
const shopItems = [
  { id: "rest", name: "圓滾滾的休息時刻", quantity: 1, price: 100000, limit: 5, icon: "https://assets.bdon.moe/zh-Hans/SupportCard/64/snap_thumbnail/snap_thumbnail.webp" },
  { id: "gacha", name: "交織的樂章轉蛋券", quantity: 1, price: 100000, limit: 3, icon: `${itemAssetRoot}/ticket/item_icon_ticket_gacha_001/item_icon_ticket_gacha_001.webp` },
  { id: "coin-limited", name: "硬幣", quantity: 60000, price: 3500, limit: 20, icon: `${itemAssetRoot}/common/item_icon_coin/item_icon_coin.webp` },
  { id: "member-exp-limited", name: "團員 EXP", quantity: 30000, price: 1750, limit: 10, icon: `${itemAssetRoot}/exp/item_icon_exp_004/item_icon_exp_004.webp` },
  { id: "snapshot-exp-limited", name: "快照 EXP", quantity: 30000, price: 1750, limit: 10, icon: `${itemAssetRoot}/exp/item_icon_exp_005/item_icon_exp_005.webp` },
  { id: "miracle", name: "奇蹟水晶", quantity: 5, price: 26250, limit: 5, icon: `${itemAssetRoot}/crystal/item_icon_crystal_002/item_icon_crystal_002.webp` },
  { id: "fortune", name: "幸運水晶", quantity: 5, price: 8750, limit: 2, icon: `${itemAssetRoot}/crystal/item_icon_crystal_001/item_icon_crystal_001.webp` },
  { id: "azure-l-limited", name: "紺碧碎片（大）", quantity: 120, price: 7000, limit: 50, icon: `${itemAssetRoot}/fragment/item_icon_fragment_006/item_icon_fragment_006.webp` },
  { id: "azure-m-limited", name: "紺碧碎片（中）", quantity: 240, price: 7000, limit: 50, icon: `${itemAssetRoot}/fragment/item_icon_fragment_005/item_icon_fragment_005.webp` },
  { id: "azure-s-limited", name: "紺碧碎片（小）", quantity: 400, price: 7000, limit: 50, icon: `${itemAssetRoot}/fragment/item_icon_fragment_004/item_icon_fragment_004.webp` },
  { id: "sp-skill", name: "SP 技能強化券", quantity: 5, price: 26250, limit: 20, icon: `${itemAssetRoot}/ticket/item_icon_ticket_skill_004/item_icon_ticket_skill_004.webp` },
  { id: "skill", name: "技能強化券", quantity: 5, price: 8750, limit: 18, icon: `${itemAssetRoot}/ticket/item_icon_ticket_skill_003/item_icon_ticket_skill_003.webp` },
  { id: "live-skill", name: "演出技能強化券", quantity: 5, price: 3500, limit: 40, icon: `${itemAssetRoot}/ticket/item_icon_ticket_skill_001/item_icon_ticket_skill_001.webp` },
  { id: "gekiso-skill", name: "激奏技能強化券", quantity: 5, price: 3500, limit: 40, icon: `${itemAssetRoot}/ticket/item_icon_ticket_skill_002/item_icon_ticket_skill_002.webp` },
  { id: "hope-prism", name: "希望稜晶", quantity: 5, price: 26250, limit: 15, icon: `${itemAssetRoot}/prism/item_icon_prism_006/item_icon_prism_006.webp` },
  { id: "mewtype-prism", name: "夢限大 MewType 稜晶", quantity: 5, price: 8750, limit: 50, icon: `${itemAssetRoot}/prism/item_icon_prism_003/item_icon_prism_003.webp` },
  { id: "coin-open", name: "硬幣", quantity: 1, price: 1, limit: null, icon: `${itemAssetRoot}/common/item_icon_coin/item_icon_coin.webp` },
  { id: "member-exp-open", name: "團員 EXP", quantity: 1, price: 1, limit: null, icon: `${itemAssetRoot}/exp/item_icon_exp_004/item_icon_exp_004.webp` },
  { id: "snapshot-exp-open", name: "快照 EXP", quantity: 1, price: 1, limit: null, icon: `${itemAssetRoot}/exp/item_icon_exp_005/item_icon_exp_005.webp` },
  { id: "azure-l-open", name: "紺碧碎片（大）", quantity: 3, price: 1800, limit: null, icon: `${itemAssetRoot}/fragment/item_icon_fragment_006/item_icon_fragment_006.webp` },
  { id: "azure-m-open", name: "紺碧碎片（中）", quantity: 6, price: 1800, limit: null, icon: `${itemAssetRoot}/fragment/item_icon_fragment_005/item_icon_fragment_005.webp` },
  { id: "azure-s-open", name: "紺碧碎片（小）", quantity: 10, price: 1800, limit: null, icon: `${itemAssetRoot}/fragment/item_icon_fragment_004/item_icon_fragment_004.webp` },
];

const STORAGE_KEY = "bdon-calc-teams-v1";
const defaultOptions = {
  normal: [{ id: 1, name: "一般隊伍 1", rank: "A", pt: 0, item: 0 }],
  event: [{ id: 1, name: "活動隊伍 1", rank: "A", pt: 0, item: 0 }],
};

function sanitizeOptions(options, mode) {
  if (!Array.isArray(options)) return defaultOptions[mode];
  return options.map((option, index) => ({
    id: index + 1,
    name: typeof option?.name === "string" && option.name.trim()
      ? option.name.trim()
      : `${mode === "normal" ? "一般隊伍" : "活動隊伍"} ${index + 1}`,
    rank: availableRanks[mode].includes(option?.rank) ? option.rank : (mode === "event" ? "C" : "A"),
    pt: Math.max(0, Number.parseFloat(option?.pt) || 0),
    item: Math.max(0, Number.parseFloat(option?.item) || 0),
  }));
}

function sanitizeShopSelections(saved) {
  const selections = {};
  const useSavedCounts = saved?.shopQuantityDefaultsVersion === 2;
  shopItems.forEach((item) => {
    const selection = saved?.shopSelections?.[item.id];
    const defaultCount = item.limit ?? 1;
    let count = useSavedCounts
      ? Math.max(1, Math.floor(Number.parseFloat(selection?.count) || defaultCount))
      : defaultCount;
    if (item.limit !== null) count = Math.min(count, item.limit);
    selections[item.id] = { checked: Boolean(selection?.checked), count };
  });

  if (saved?.shopItemId && selections[saved.shopItemId] && !Object.values(selections).some((item) => item.checked)) {
    const legacyItem = shopItems.find((item) => item.id === saved.shopItemId);
    selections[saved.shopItemId] = {
      checked: true,
      count: legacyItem?.limit ?? Math.max(1, Math.floor(Number.parseFloat(saved.shopExchangeCount) || 1)),
    };
  }
  return selections;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const normal = sanitizeOptions(saved?.normalOptions, "normal");
    const event = sanitizeOptions(saved?.eventOptions, "event");
    return {
      nextNormalId: normal.length + 1,
      nextEventId: event.length + 1,
      normalOptions: normal,
      eventOptions: event,
      targetPt: Number.isFinite(Number.parseFloat(saved?.targetPt)) ? Math.max(0, Number.parseFloat(saved.targetPt)) : 1000,
      targetItem: Number.isFinite(Number.parseFloat(saved?.targetItem)) ? Math.max(0, Number.parseFloat(saved.targetItem)) : 1000,
      ownedPt: Math.max(0, Number.parseFloat(saved?.ownedPt) || 0),
      ownedItem: Math.max(0, Number.parseFloat(saved?.ownedItem) || 0),
      shopSelections: sanitizeShopSelections(saved),
    };
  } catch {
    return {
      nextNormalId: 2,
      nextEventId: 2,
      normalOptions: defaultOptions.normal,
      eventOptions: defaultOptions.event,
      targetPt: 1000,
      targetItem: 1000,
      ownedPt: 0,
      ownedItem: 0,
      shopSelections: sanitizeShopSelections(null),
    };
  }
}

const state = loadState();

const normalOptions = document.querySelector("#normalOptions");
const eventOptions = document.querySelector("#eventOptions");
const comparisonList = document.querySelector("#comparisonList");
const targetPt = document.querySelector("#targetPt");
const targetItem = document.querySelector("#targetItem");
const ownedPt = document.querySelector("#ownedPt");
const ownedItem = document.querySelector("#ownedItem");
const rewardList = document.querySelector("#rewardList");
const rewardTargetSummary = document.querySelector("#rewardTargetSummary");
const shopGrid = document.querySelector("#shopGrid");
const shopTargetSummary = document.querySelector("#shopTargetSummary");
const dataTransferDialog = document.querySelector("#dataTransferDialog");
const exportData = document.querySelector("#exportData");
const importData = document.querySelector("#importData");
const importDataFile = document.querySelector("#importDataFile");
const transferStatus = document.querySelector("#transferStatus");

const format = (value, digits = 2) =>
  new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);

const safeNumber = (value) => Math.max(0, Number.parseFloat(value) || 0);
const percent = (value) => safeNumber(value) / 100;
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
let draggedOption = null;

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      normalOptions: state.normalOptions,
      eventOptions: state.eventOptions,
      targetPt: safeNumber(targetPt.value),
      targetItem: safeNumber(targetItem.value),
      ownedPt: safeNumber(ownedPt.value),
      ownedItem: safeNumber(ownedItem.value),
      shopSelections: state.shopSelections,
      shopQuantityDefaultsVersion: 2,
    }));
  } catch {
    // The calculator still works if local browser storage is unavailable.
  }
}

function portableState() {
  return {
    format: "bdon-calc",
    version: 1,
    state: {
      normalOptions: state.normalOptions,
      eventOptions: state.eventOptions,
      targetPt: safeNumber(targetPt.value),
      targetItem: safeNumber(targetItem.value),
      ownedPt: safeNumber(ownedPt.value),
      ownedItem: safeNumber(ownedItem.value),
      shopSelections: state.shopSelections,
      shopQuantityDefaultsVersion: 2,
    },
  };
}

function encodeBase64Json(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeBase64Json(value) {
  const binary = atob(value.replaceAll(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function refreshExportData() {
  exportData.value = encodeBase64Json(portableState());
}

function transferNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function applyPortableState(payload) {
  if (payload?.format !== "bdon-calc" || payload?.version !== 1 || !payload.state) {
    throw new Error("這不是有效的 BDON 計算器資料。");
  }
  const imported = payload.state;
  if (!Array.isArray(imported.normalOptions) || !Array.isArray(imported.eventOptions)) {
    throw new Error("資料缺少一般或活動隊伍。");
  }

  state.normalOptions = sanitizeOptions(imported.normalOptions, "normal");
  state.eventOptions = sanitizeOptions(imported.eventOptions, "event");
  state.nextNormalId = state.normalOptions.length + 1;
  state.nextEventId = state.eventOptions.length + 1;
  state.shopSelections = sanitizeShopSelections({
    shopSelections: imported.shopSelections,
    shopQuantityDefaultsVersion: 2,
  });

  targetPt.value = transferNumber(imported.targetPt, 1000);
  targetItem.value = transferNumber(imported.targetItem, 1000);
  ownedPt.value = transferNumber(imported.ownedPt);
  ownedItem.value = transferNumber(imported.ownedItem);
  renderOptions();
  renderRewardList();
  renderShopGrid();
  if (Object.values(state.shopSelections).some((selection) => selection.checked)) {
    updateShopTarget();
  } else {
    shopTargetSummary.textContent = "尚未選擇";
    persistState();
    calculate();
  }
  refreshExportData();
}

function importPortableText(raw) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("請先貼上 Base64 或 JSON。");
  const payload = trimmed.startsWith("{") ? JSON.parse(trimmed) : decodeBase64Json(trimmed);
  applyPortableState(payload);
}

function rateNumberMarkup(value, alignDecimals) {
  const [whole, fraction] = String(value).split(".");
  if (!alignDecimals) return `<b>${whole}</b>`;
  return `<b>${whole}</b><em class="${fraction ? "" : "phantom"}">.${fraction || "00"}</em>`;
}

function rankButtons(option, mode) {
  return ["SS", "S", "A", "B", "C", "D"].map((rank) => {
    const disabled = !availableRanks[mode].includes(rank);
    const active = option.rank === rank;
    return `<button type="button" class="rank${active ? " active" : ""}" data-rank="${rank}" ${disabled ? "disabled" : `aria-pressed="${active}"`}>
      ${disabled ? `<span>${rank}</span><small>未開放</small>` : rank}
    </button>`;
  }).join("");
}

function optionMarkup(option, mode, index) {
  const isNormal = mode === "normal";
  const label = isNormal ? "一般" : "活動";
  const rate = rates[mode][option.rank];
  const summary = isNormal
    ? [[rate.pt, "pt"], [rate.item, "獎章"], [rate.cp, "cp"]]
    : [[rate.pt, "pt"], [rate.item, "獎章"]];
  const summaryMarkup = summary.map(([value, unit]) =>
    `<span>${rateNumberMarkup(value, !isNormal)}<i>${unit}${rate.approximate && unit === "獎章" ? '<small class="approx-inline">不準確</small>' : ""}</i></span>`
  ).join("");
  return `<article class="option-card" data-option-type="${mode}" data-option-id="${option.id}">
    <div class="option-main">
      <div class="option-head">
        <div class="option-title">
          <span class="option-index">${index + 1}</span>
          <span class="option-name" contenteditable="true" spellcheck="false" data-option-name aria-label="重新命名${label}隊伍">${escapeHtml(option.name)}</span>
          <span class="winner-marks"></span>
        </div>
        <div class="option-actions">
          <span class="rate-summary ${isNormal ? "whole-only" : "decimal-aligned"}" aria-label="${summary.map(([value, unit]) => `${value} ${unit}`).join("、")}">${summaryMarkup}</span>
          <button type="button" class="copy-option" data-copy-option="${option.id}">複製</button>
          <button type="button" class="remove-plan" data-remove-option="${option.id}">移除</button>
          <span class="drag-handle" draggable="true" data-drag-option="${option.id}" role="button" aria-label="拖曳${label}隊伍 ${index + 1}" title="拖曳至另一區">⠿</span>
        </div>
      </div>
      <div class="rank-options" aria-label="${label}選項 ${index + 1} 評級">
        ${rankButtons(option, mode)}
      </div>
    </div>
    <div class="option-bonuses">
      <label>
        <span>pt 加成</span>
        <span class="number-input"><input type="number" min="0" step="1" value="${option.pt}" inputmode="decimal" data-option-field="pt" aria-label="${label}選項 ${index + 1} pt 加成" /><b>%</b></span>
      </label>
      <label>
        <span>獎章加成</span>
        <span class="number-input"><input type="number" min="0" step="1" value="${option.item}" inputmode="decimal" data-option-field="item" aria-label="${label}選項 ${index + 1} 獎章加成" /><b>%</b></span>
      </label>
    </div>
  </article>`;
}

function renderOptions(focusMode = null) {
  normalOptions.innerHTML = state.normalOptions.map((option, index) => optionMarkup(option, "normal", index)).join("");
  eventOptions.innerHTML = state.eventOptions.map((option, index) => optionMarkup(option, "event", index)).join("");
  persistState();
  if (focusMode) document.querySelector(`#${focusMode}Options`)?.lastElementChild?.querySelector(".rank:not(:disabled)")?.focus();
}

function evaluateCombination(normalOption, eventOption, normalIndex, eventIndex) {
  const normal = rates.normal[normalOption.rank];
  const event = rates.event[eventOption.rank];
  const ptPerFire = 5 * (
    normal.pt * (1 + percent(normalOption.pt)) +
    normal.cp * event.pt * (1 + percent(eventOption.pt))
  );
  const itemPerFire = 5 * (
    normal.item * (1 + percent(normalOption.item)) +
    normal.cp * event.item * (1 + percent(eventOption.item))
  );

  return {
    normalOption,
    eventOption,
    normalIndex,
    eventIndex,
    ptPerFire,
    itemPerFire,
    ptFire: Math.max(safeNumber(targetPt.value) - safeNumber(ownedPt.value), 0) / ptPerFire,
    itemFire: Math.max(safeNumber(targetItem.value) - safeNumber(ownedItem.value), 0) / itemPerFire,
  };
}

function renderRewardList() {
  const memberRewardPoints = new Set([30000, 100000, 150000, 200000, 300000, 675000]);
  rewardList.innerHTML = pointRewards.map((reward) => `<button type="button" class="reward-row${memberRewardPoints.has(reward.point) ? " member-reward" : ""}" data-reward-point="${reward.point}" style="--reward-progress:0%" aria-pressed="false">
    <span class="reward-progress" aria-hidden="true"></span>
    <img src="${reward.icon}" alt="" loading="lazy" />
    <span class="reward-copy"><b>${escapeHtml(reward.name)}</b><small>${format(reward.count, 0)} 個</small></span>
    <span class="reward-point"><b>${format(reward.point, 0)}</b><small>pt · 0%</small></span>
    <span class="reward-stamp" hidden>已獲得</span>
  </button>`).join("");
  updateRewardProgress();
}

function updateRewardProgress() {
  const target = safeNumber(targetPt.value);
  const owned = safeNumber(ownedPt.value);
  rewardTargetSummary.textContent = `目前目標 ${format(target, 0)} pt`;
  pointRewards.forEach((reward) => {
    const progress = Math.min(target / reward.point * 100, 100);
    const obtained = owned >= reward.point;
    const selected = target === reward.point;
    const row = rewardList.querySelector(`[data-reward-point="${reward.point}"]`);
    row.style.setProperty("--reward-progress", `${progress}%`);
    row.classList.toggle("selected", selected);
    row.classList.toggle("obtained", obtained);
    row.setAttribute("aria-pressed", String(selected));
    row.querySelector(".reward-point small").textContent = `pt · ${format(progress, 0)}%`;
    row.querySelector(".reward-stamp").hidden = !obtained;
  });
}

function renderShopGrid() {
  shopGrid.innerHTML = shopItems.map((item) => {
    const selection = state.shopSelections[item.id];
    return `<article class="shop-card${selection.checked ? " selected" : ""}" data-shop-item="${item.id}">
      <label class="shop-check" title="計入目標獎章">
        <input type="checkbox" data-shop-check ${selection.checked ? "checked" : ""} />
        <span aria-hidden="true">✓</span>
      </label>
      <img src="${item.icon}" alt="" loading="lazy" />
      <h4>${escapeHtml(item.name)}</h4>
      <p>每次 ${format(item.quantity, 0)} 個</p>
      <strong>${format(item.price, 0)} 獎章</strong>
      <small>${item.limit === null ? "無兌換限制" : `最多 ${item.limit} 次`}</small>
      <label class="shop-quantity">
        <span>兌換</span>
        <input type="number" min="1" ${item.limit === null ? "" : `max="${item.limit}"`} step="1" value="${selection.count}" inputmode="numeric" data-shop-count aria-label="${escapeHtml(item.name)}兌換次數" />
        <span>次</span>
      </label>
    </article>`;
  }).join("");
}

function updateShopTarget() {
  let total = 0;
  let selectedCount = 0;
  shopItems.forEach((item) => {
    const selection = state.shopSelections[item.id];
    if (!selection.checked) return;
    selectedCount += 1;
    total += item.price * selection.count;
  });
  targetItem.value = total;
  shopTargetSummary.textContent = selectedCount
    ? `${selectedCount} 項 · ${format(total, 0)} 獎章`
    : "尚未選擇";
  persistState();
  calculate();
}

function setupAnimatedDetails(details) {
  const summary = details.querySelector("summary");
  let animation = null;
  summary.addEventListener("click", (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    const opening = !details.open;
    const startHeight = details.offsetHeight;
    animation?.cancel();
    if (opening) details.open = true;
    const endHeight = opening ? details.scrollHeight : summary.offsetHeight;
    details.style.overflow = "hidden";
    animation = details.animate(
      { height: [`${startHeight}px`, `${endHeight}px`] },
      { duration: 280, easing: "cubic-bezier(.2,.75,.25,1)" },
    );
    animation.onfinish = () => {
      details.open = opening;
      details.style.removeProperty("height");
      details.style.removeProperty("overflow");
      animation = null;
    };
  });
}

function renderBest(kind, result, unit) {
  const fire = result[`${kind}Fire`];
  const perFire = result[`${kind}PerFire`];
  const remaining = kind === "pt"
    ? Math.max(safeNumber(targetPt.value) - safeNumber(ownedPt.value), 0)
    : Math.max(safeNumber(targetItem.value) - safeNumber(ownedItem.value), 0);
  document.querySelector(`#${kind}Winner`).textContent = `${result.normalOption.name} × ${result.eventOption.name}`;
  document.querySelector(`#${kind}Result`).textContent = format(fire);
  document.querySelector(`#${kind}Rounded`).textContent = remaining === 0
    ? "已達目標，不需消耗火"
    : `尚缺 ${format(remaining, 0)} ${unit} · 至少需要 ${Math.ceil(fire)} 火`;
  document.querySelector(`#${kind}PerFire`).textContent = `${format(perFire)} ${unit}`;
}

function updateWinnerHighlights(bestPt, bestItem) {
  document.querySelectorAll(".option-card").forEach((card) => {
    const mode = card.dataset.optionType;
    const id = Number(card.dataset.optionId);
    const isPt = bestPt[`${mode}Option`].id === id;
    const isItem = bestItem[`${mode}Option`].id === id;
    card.classList.toggle("best-pt", isPt && !isItem);
    card.classList.toggle("best-item", isItem && !isPt);
    card.classList.toggle("best-both", isPt && isItem);
    card.querySelector(".winner-marks").innerHTML = [
      isPt ? '<span class="winner-mark">pt 最佳</span>' : "",
      isItem ? '<span class="winner-mark item">獎章最佳</span>' : "",
    ].join("");
  });
}

function calculate() {
  if (state.normalOptions.length === 0 || state.eventOptions.length === 0) {
    document.querySelectorAll(".option-card").forEach((card) => {
      card.classList.remove("best-pt", "best-item", "best-both");
      card.querySelector(".winner-marks").innerHTML = "";
    });
    ["pt", "item"].forEach((kind) => {
      document.querySelector(`#${kind}Winner`).textContent = "等待隊伍";
      document.querySelector(`#${kind}Result`).textContent = "—";
      document.querySelector(`#${kind}Rounded`).textContent = "至少需要一般與活動各一隊";
      document.querySelector(`#${kind}PerFire`).textContent = "—";
    });
    document.querySelector("#combinationCount").textContent = "0 種組合";
    comparisonList.innerHTML = '<div class="empty-notice">至少需要一般與活動各一隊</div>';
    return;
  }

  const results = state.normalOptions.flatMap((normalOption, normalIndex) =>
    state.eventOptions.map((eventOption, eventIndex) =>
      evaluateCombination(normalOption, eventOption, normalIndex, eventIndex)
    )
  );
  const bestPt = results.reduce((best, item) => item.ptFire < best.ptFire ? item : best);
  const bestItem = results.reduce((best, item) => item.itemFire < best.itemFire ? item : best);

  renderBest("pt", bestPt, "pt");
  renderBest("item", bestItem, "獎章");
  updateWinnerHighlights(bestPt, bestItem);
  document.querySelector("#combinationCount").textContent = `${results.length} 種組合`;

  comparisonList.innerHTML = results.map((result) => `<div class="comparison-row">
    <div class="comparison-name">
      ${escapeHtml(result.normalOption.name)} × ${escapeHtml(result.eventOption.name)}
      ${result === bestPt ? '<span class="best-badge">pt 最佳</span>' : ""}
      ${result === bestItem ? '<span class="best-badge item">獎章最佳</span>' : ""}
      <span class="comparison-ranks">${result.normalOption.rank} 級 × ${result.eventOption.rank} 級</span>
    </div>
    <div class="comparison-value"><span>尚缺 pt</span><b>${format(result.ptFire)} 火</b></div>
    <div class="comparison-value"><span>尚缺獎章</span><b>${format(result.itemFire)} 火</b></div>
  </div>`).join("");
}

function addOption(mode) {
  const counterName = `next${mode[0].toUpperCase()}${mode.slice(1)}Id`;
  const id = state[counterName]++;
  const label = mode === "normal" ? "一般隊伍" : "活動隊伍";
  state[`${mode}Options`].push({ id, name: `${label} ${id}`, rank: "A", pt: 0, item: 0 });
  renderOptions(mode);
  calculate();
}

function handleOptionInput(event) {
  const name = event.target.closest("[data-option-name]");
  const card = event.target.closest("[data-option-id]");
  if (name && card) {
    const list = state[`${card.dataset.optionType}Options`];
    const option = list.find((item) => item.id === Number(card.dataset.optionId));
    option.name = name.textContent.trim();
    persistState();
    calculate();
    return;
  }

  const input = event.target.closest("[data-option-field]");
  if (!input || !card) return;
  const list = state[`${card.dataset.optionType}Options`];
  const option = list.find((item) => item.id === Number(card.dataset.optionId));
  option[input.dataset.optionField] = safeNumber(input.value);
  persistState();
  calculate();
}

function handleOptionClick(event) {
  const card = event.target.closest("[data-option-id]");
  if (!card) return;
  const mode = card.dataset.optionType;
  const list = state[`${mode}Options`];
  const option = list.find((item) => item.id === Number(card.dataset.optionId));
  const rankButton = event.target.closest("[data-rank]:not(:disabled)");
  const copyButton = event.target.closest("[data-copy-option]");
  const removeButton = event.target.closest("[data-remove-option]");

  if (rankButton) {
    option.rank = rankButton.dataset.rank;
    renderOptions();
    calculate();
  }

  if (copyButton) {
    const counterName = `next${mode[0].toUpperCase()}${mode.slice(1)}Id`;
    list.push({ ...option, id: state[counterName]++, name: `${option.name} 副本` });
    renderOptions(mode);
    calculate();
  }

  if (removeButton) {
    state[`${mode}Options`] = list.filter((item) => item.id !== option.id);
    renderOptions();
    calculate();
  }
}

function handleDragStart(event) {
  const handle = event.target.closest("[data-drag-option]");
  const card = event.target.closest("[data-option-id]");
  if (!handle || !card) {
    event.preventDefault();
    return;
  }
  draggedOption = {
    mode: card.dataset.optionType,
    id: Number(card.dataset.optionId),
  };
  card.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", `${draggedOption.mode}:${draggedOption.id}`);
}

function handleDragEnd() {
  draggedOption = null;
  document.querySelectorAll(".option-card.dragging, .option-list.drag-over").forEach((element) => {
    element.classList.remove("dragging", "drag-over");
  });
}

function handleDrop(event) {
  event.preventDefault();
  const targetMode = event.currentTarget.dataset.optionList;
  event.currentTarget.classList.remove("drag-over");
  if (!draggedOption) {
    const [mode, rawId] = event.dataTransfer.getData("text/plain").split(":");
    if (!mode || !rawId) return;
    draggedOption = { mode, id: Number(rawId) };
  }

  const sourceMode = draggedOption.mode;
  const sourceList = state[`${sourceMode}Options`];
  const targetList = state[`${targetMode}Options`];
  const sourceIndex = sourceList.findIndex((item) => item.id === draggedOption.id);
  if (sourceIndex < 0) return;

  if (sourceMode === targetMode) {
    const [option] = sourceList.splice(sourceIndex, 1);
    sourceList.push(option);
  } else {
    const [option] = sourceList.splice(sourceIndex, 1);
    const counterName = `next${targetMode[0].toUpperCase()}${targetMode.slice(1)}Id`;
    targetList.push({
      ...option,
      id: state[counterName]++,
      rank: availableRanks[targetMode].includes(option.rank) ? option.rank : "C",
    });
  }

  draggedOption = null;
  renderOptions();
  calculate();
}

document.querySelector("#addNormal").addEventListener("click", () => addOption("normal"));
document.querySelector("#addEvent").addEventListener("click", () => addOption("event"));
[normalOptions, eventOptions].forEach((list) => {
  list.addEventListener("input", handleOptionInput);
  list.addEventListener("click", handleOptionClick);
  list.addEventListener("keydown", (event) => {
    if (event.target.matches("[data-option-name]") && event.key === "Enter") {
      event.preventDefault();
      event.target.blur();
    }
  });
  list.addEventListener("focusout", (event) => {
    const name = event.target.closest("[data-option-name]");
    if (!name || name.textContent.trim()) return;
    const card = name.closest("[data-option-id]");
    const mode = card.dataset.optionType;
    const listState = state[`${mode}Options`];
    const index = listState.findIndex((item) => item.id === Number(card.dataset.optionId));
    const fallback = `${mode === "normal" ? "一般隊伍" : "活動隊伍"} ${index + 1}`;
    listState[index].name = fallback;
    name.textContent = fallback;
    persistState();
    calculate();
  });
  list.addEventListener("dragstart", handleDragStart);
  list.addEventListener("dragend", handleDragEnd);
  list.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    list.classList.add("drag-over");
  });
  list.addEventListener("dragleave", (event) => {
    if (!list.contains(event.relatedTarget)) list.classList.remove("drag-over");
  });
  list.addEventListener("drop", handleDrop);
});
targetPt.value = state.targetPt;
targetItem.value = state.targetItem;
ownedPt.value = state.ownedPt;
ownedItem.value = state.ownedItem;

[targetPt, targetItem, ownedPt, ownedItem].forEach((field) => field.addEventListener("input", () => {
  if (field === targetItem) {
    Object.values(state.shopSelections).forEach((selection) => { selection.checked = false; });
    renderShopGrid();
    shopTargetSummary.textContent = "手動輸入";
  }
  if (field === targetPt || field === ownedPt) updateRewardProgress();
  persistState();
  calculate();
}));

rewardList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-reward-point]");
  if (!row) return;
  targetPt.value = row.dataset.rewardPoint;
  updateRewardProgress();
  persistState();
  calculate();
});

shopGrid.addEventListener("input", (event) => {
  const card = event.target.closest("[data-shop-item]");
  if (!card) return;
  const item = shopItems.find((candidate) => candidate.id === card.dataset.shopItem);
  const selection = state.shopSelections[item.id];
  if (event.target.matches("[data-shop-check]")) {
    selection.checked = event.target.checked;
    card.classList.toggle("selected", selection.checked);
  }
  if (event.target.matches("[data-shop-count]")) {
    let count = Math.max(1, Math.floor(safeNumber(event.target.value) || 1));
    if (item.limit !== null) count = Math.min(count, item.limit);
    selection.count = count;
    event.target.value = count;
  }
  updateShopTarget();
});

shopGrid.addEventListener("click", (event) => {
  if (event.target.closest(".shop-check, .shop-quantity")) return;
  const card = event.target.closest("[data-shop-item]");
  if (!card) return;
  card.querySelector("[data-shop-check]").click();
});

document.querySelector(".shop-bulk-actions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-shop-action]");
  if (!button) return;
  const action = button.dataset.shopAction;
  shopItems.forEach((item) => {
    const selection = state.shopSelections[item.id];
    if (action === "select-all") selection.checked = true;
    if (action === "clear-all") selection.checked = false;
    if (action === "empty-shop") {
      selection.checked = item.limit !== null;
      if (item.limit !== null) selection.count = item.limit;
    }
  });
  renderShopGrid();
  updateShopTarget();
});

document.querySelector("#openDataTransfer").addEventListener("click", () => {
  refreshExportData();
  transferStatus.textContent = "";
  transferStatus.className = "transfer-status";
  if (typeof dataTransferDialog.showModal === "function") dataTransferDialog.showModal();
  else dataTransferDialog.setAttribute("open", "");
});

document.querySelector("#closeDataTransfer").addEventListener("click", () => dataTransferDialog.close());
dataTransferDialog.addEventListener("click", (event) => {
  if (event.target === dataTransferDialog) dataTransferDialog.close();
});

document.querySelector("#copyExportData").addEventListener("click", async () => {
  refreshExportData();
  try {
    await navigator.clipboard.writeText(exportData.value);
  } catch {
    exportData.select();
    document.execCommand("copy");
  }
  transferStatus.textContent = "Base64 已複製。";
  transferStatus.className = "transfer-status success";
});

document.querySelector("#downloadExportJson").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(portableState(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bdon-calc-data.json";
  link.click();
  URL.revokeObjectURL(url);
  transferStatus.textContent = "JSON 已下載。";
  transferStatus.className = "transfer-status success";
});

document.querySelector("#applyImportData").addEventListener("click", () => {
  try {
    importPortableText(importData.value);
    transferStatus.textContent = "匯入成功，所有設定已更新。";
    transferStatus.className = "transfer-status success";
  } catch (error) {
    transferStatus.textContent = error instanceof Error ? error.message : "無法讀取這份資料。";
    transferStatus.className = "transfer-status error";
  }
});

importDataFile.addEventListener("change", async () => {
  const [file] = importDataFile.files;
  if (!file) return;
  try {
    const raw = await file.text();
    importData.value = raw;
    importPortableText(raw);
    transferStatus.textContent = `已匯入 ${file.name}。`;
    transferStatus.className = "transfer-status success";
  } catch (error) {
    transferStatus.textContent = error instanceof Error ? error.message : "無法讀取這份資料。";
    transferStatus.className = "transfer-status error";
  } finally {
    importDataFile.value = "";
  }
});

renderRewardList();
renderShopGrid();
if (Object.values(state.shopSelections).some((selection) => selection.checked)) updateShopTarget();
document.querySelectorAll(".target-picker").forEach(setupAnimatedDetails);

renderOptions();
calculate();

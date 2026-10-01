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
    D: { pt: 1, item: 1 },
  },
};

const availableRanks = {
  normal: ["SS", "S", "A", "B", "C", "D"],
  event: ["SS", "S", "A", "B", "C"],
};

const pointRewardTargets = [
  500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000,
  10000, 12000, 14000, 15000, 16000, 18000, 20000, 22000, 24000, 27000,
  30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000,
  80000, 85000, 90000, 95000, 100000, 105000, 110000, 115000, 120000, 125000,
  130000, 135000, 140000, 145000, 150000, 155000, 160000, 165000, 170000, 175000,
  180000, 185000, 190000, 200000, 210000, 220000, 230000, 240000, 250000, 260000,
  270000, 280000, 300000, 330000, 375000, 450000, 525000, 600000, 675000, 750000,
  825000, 900000, 1000000, 1250000, 1500000, 2000000, 2500000, 3000000,
];

const itemAssetRoot = "https://assets.bdon.moe/en/en/Item";
const shopItems = [
  { id: "rest", name: "圓滾滾的休息時刻", quantity: 1, price: 100000, limit: 5 },
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
      shopItemId: shopItems.some((item) => item.id === saved?.shopItemId) ? saved.shopItemId : "",
      shopExchangeCount: Math.max(1, Math.floor(Number.parseFloat(saved?.shopExchangeCount) || 1)),
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
      shopItemId: "",
      shopExchangeCount: 1,
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
const targetPtReward = document.querySelector("#targetPtReward");
const shopItemSelect = document.querySelector("#shopItemSelect");
const shopSelection = document.querySelector("#shopSelection");
const shopItemPreview = document.querySelector("#shopItemPreview");
const shopExchangeCount = document.querySelector("#shopExchangeCount");

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
      shopItemId: shopItemSelect.value,
      shopExchangeCount: Math.max(1, Math.floor(safeNumber(shopExchangeCount.value) || 1)),
    }));
  } catch {
    // The calculator still works if local browser storage is unavailable.
  }
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
    ? [[rate.pt, "pt"], [rate.item, "道具"], [rate.cp, "cp"]]
    : [[rate.pt, "pt"], [rate.item, "道具"]];
  const summaryMarkup = summary.map(([value, unit]) =>
    `<span>${rateNumberMarkup(value, !isNormal)}<i>${unit}</i></span>`
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
        <span>道具加成</span>
        <span class="number-input"><input type="number" min="0" step="1" value="${option.item}" inputmode="decimal" data-option-field="item" aria-label="${label}選項 ${index + 1} 道具加成" /><b>%</b></span>
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

function applyShopTarget() {
  const item = shopItems.find((candidate) => candidate.id === shopItemSelect.value);
  shopSelection.hidden = !item;
  if (!item) {
    shopItemPreview.innerHTML = "";
    return;
  }

  const requestedCount = Math.max(1, Math.floor(safeNumber(shopExchangeCount.value) || 1));
  const count = item.limit === null ? requestedCount : Math.min(requestedCount, item.limit);
  shopExchangeCount.value = count;
  shopExchangeCount.max = item.limit ?? "";
  targetItem.value = item.price * count;
  const totalReward = item.quantity * count;
  shopItemPreview.innerHTML = `${item.icon
    ? `<img src="${item.icon}" alt="" loading="lazy" />`
    : '<span class="shop-item-fallback" aria-hidden="true">休</span>'}
    <span><b>${escapeHtml(item.name)}</b><small>每次 ${format(item.quantity, 0)} 個 · ${format(item.price, 0)} 道具${item.limit === null ? " · 無兌換限制" : ` · 最多 ${item.limit} 次`}</small><em>共 ${format(totalReward, 0)} 個，需 ${format(item.price * count, 0)} 道具</em></span>`;
  persistState();
  calculate();
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
      isItem ? '<span class="winner-mark item">道具最佳</span>' : "",
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
  renderBest("item", bestItem, "道具");
  updateWinnerHighlights(bestPt, bestItem);
  document.querySelector("#combinationCount").textContent = `${results.length} 種組合`;

  comparisonList.innerHTML = results.map((result) => `<div class="comparison-row">
    <div class="comparison-name">
      ${escapeHtml(result.normalOption.name)} × ${escapeHtml(result.eventOption.name)}
      ${result === bestPt ? '<span class="best-badge">pt 最佳</span>' : ""}
      ${result === bestItem ? '<span class="best-badge item">道具最佳</span>' : ""}
      <span class="comparison-ranks">${result.normalOption.rank} 級 × ${result.eventOption.rank} 級</span>
    </div>
    <div class="comparison-value"><span>尚缺 pt</span><b>${format(result.ptFire)} 火</b></div>
    <div class="comparison-value"><span>尚缺道具</span><b>${format(result.itemFire)} 火</b></div>
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
targetPtReward.insertAdjacentHTML("beforeend", pointRewardTargets.map((value) =>
  `<option value="${value}">${new Intl.NumberFormat("zh-TW").format(value)} pt 獎勵</option>`
).join(""));
shopItemSelect.insertAdjacentHTML("beforeend", shopItems.map((item) =>
  `<option value="${item.id}">${escapeHtml(item.name)}｜${format(item.quantity, 0)} 個／${format(item.price, 0)} 道具${item.limit === null ? "｜無限制" : `｜最多 ${item.limit} 次`}</option>`
).join(""));

targetPt.value = state.targetPt;
targetItem.value = state.targetItem;
ownedPt.value = state.ownedPt;
ownedItem.value = state.ownedItem;
targetPtReward.value = pointRewardTargets.includes(state.targetPt) ? String(state.targetPt) : "";
shopItemSelect.value = state.shopItemId;
shopExchangeCount.value = state.shopExchangeCount;

[targetPt, targetItem, ownedPt, ownedItem].forEach((field) => field.addEventListener("input", () => {
  if (field === targetPt) {
    targetPtReward.value = pointRewardTargets.includes(safeNumber(targetPt.value)) ? targetPt.value : "";
  }
  if (field === targetItem) {
    shopItemSelect.value = "";
    shopSelection.hidden = true;
    shopItemPreview.innerHTML = "";
  }
  persistState();
  calculate();
}));
targetPtReward.addEventListener("change", () => {
  if (!targetPtReward.value) return;
  targetPt.value = targetPtReward.value;
  persistState();
  calculate();
});
shopItemSelect.addEventListener("change", () => {
  shopExchangeCount.value = 1;
  applyShopTarget();
});
shopExchangeCount.addEventListener("input", applyShopTarget);

if (shopItemSelect.value) applyShopTarget();

renderOptions();
calculate();

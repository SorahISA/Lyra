const rates = {
  normal: {
    A: { pt: 50, item: 60, cp: 6 },
    B: { pt: 35, item: 42, cp: 5 },
    C: { pt: 25, item: 30, cp: 4 },
    D: { pt: 15, item: 18, cp: 3 },
  },
  event: {
    A: { pt: 16.25, item: 18.75 },
    B: { pt: 12.75, item: 17 },
    C: { pt: 10, item: 13.25 },
    D: { pt: 1, item: 1 },
  },
};

const state = {
  nextNormalId: 2,
  nextEventId: 2,
  normalOptions: [{ id: 1, rank: "A", pt: 0, item: 0 }],
  eventOptions: [{ id: 1, rank: "A", pt: 0, item: 0 }],
};

const normalOptions = document.querySelector("#normalOptions");
const eventOptions = document.querySelector("#eventOptions");
const comparisonList = document.querySelector("#comparisonList");
const targetPt = document.querySelector("#targetPt");
const targetItem = document.querySelector("#targetItem");

const format = (value, digits = 2) =>
  new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);

const safeNumber = (value) => Math.max(0, Number.parseFloat(value) || 0);
const percent = (value) => safeNumber(value) / 100;

function rankButtons(option, mode) {
  return ["SS", "S", "A", "B", "C", "D"].map((rank) => {
    const disabled = rank === "SS" || rank === "S" || (mode === "event" && rank === "D");
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
    ? `${rate.pt} pt · ${rate.item} 道具 · ${rate.cp} cp`
    : `${rate.pt} pt · ${rate.item} 道具`;
  const listLength = state[`${mode}Options`].length;

  return `<article class="option-card" data-option-type="${mode}" data-option-id="${option.id}">
    <div class="option-main">
      <div class="option-head">
        <div class="option-title">
          <span class="option-index">${index + 1}</span>${label} ${index + 1}
          <span class="winner-marks"></span>
        </div>
        <div class="option-actions">
          <small>${summary}</small>
          <button type="button" class="remove-plan" data-remove-option="${option.id}" ${listLength === 1 ? "disabled" : ""}>移除</button>
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
    ptFire: safeNumber(targetPt.value) / ptPerFire,
    itemFire: safeNumber(targetItem.value) / itemPerFire,
  };
}

function renderBest(kind, result, unit) {
  const fire = result[`${kind}Fire`];
  const perFire = result[`${kind}PerFire`];
  document.querySelector(`#${kind}Winner`).textContent = `一般 ${result.normalIndex + 1} × 活動 ${result.eventIndex + 1}`;
  document.querySelector(`#${kind}Result`).textContent = format(fire);
  document.querySelector(`#${kind}Rounded`).textContent = `至少需要 ${Math.ceil(fire)} 火`;
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
      一般 ${result.normalIndex + 1} × 活動 ${result.eventIndex + 1}
      ${result === bestPt ? '<span class="best-badge">pt 最佳</span>' : ""}
      ${result === bestItem ? '<span class="best-badge item">道具最佳</span>' : ""}
      <span class="comparison-ranks">${result.normalOption.rank} 級 × ${result.eventOption.rank} 級</span>
    </div>
    <div class="comparison-value"><span>目標 pt</span><b>${format(result.ptFire)} 火</b></div>
    <div class="comparison-value"><span>目標道具</span><b>${format(result.itemFire)} 火</b></div>
  </div>`).join("");
}

function addOption(mode) {
  const counterName = `next${mode[0].toUpperCase()}${mode.slice(1)}Id`;
  state[`${mode}Options`].push({ id: state[counterName]++, rank: "A", pt: 0, item: 0 });
  renderOptions(mode);
  calculate();
}

function handleOptionInput(event) {
  const input = event.target.closest("[data-option-field]");
  const card = event.target.closest("[data-option-id]");
  if (!input || !card) return;
  const list = state[`${card.dataset.optionType}Options`];
  const option = list.find((item) => item.id === Number(card.dataset.optionId));
  option[input.dataset.optionField] = safeNumber(input.value);
  calculate();
}

function handleOptionClick(event) {
  const card = event.target.closest("[data-option-id]");
  if (!card) return;
  const mode = card.dataset.optionType;
  const list = state[`${mode}Options`];
  const option = list.find((item) => item.id === Number(card.dataset.optionId));
  const rankButton = event.target.closest("[data-rank]:not(:disabled)");
  const removeButton = event.target.closest("[data-remove-option]");

  if (rankButton) {
    option.rank = rankButton.dataset.rank;
    renderOptions();
    calculate();
  }

  if (removeButton && list.length > 1) {
    state[`${mode}Options`] = list.filter((item) => item.id !== option.id);
    renderOptions();
    calculate();
  }
}

document.querySelector("#addNormal").addEventListener("click", () => addOption("normal"));
document.querySelector("#addEvent").addEventListener("click", () => addOption("event"));
[normalOptions, eventOptions].forEach((list) => {
  list.addEventListener("input", handleOptionInput);
  list.addEventListener("click", handleOptionClick);
});
[targetPt, targetItem].forEach((field) => field.addEventListener("input", calculate));

renderOptions();
calculate();

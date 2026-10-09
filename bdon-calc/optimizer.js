const STORAGE_KEY = window.BdonProfiles?.stateKey() ?? "bdon-calc-teams-v1";
const OPTIMIZER_KEY = window.BdonProfiles?.optimizerKey() ?? "bdon-calc-optimizer-v1";
const MAX_TARGET = 2_147_483_647;
const optimizerCore = window.BdonOptimizerCore;

const format = (value) => new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(value);
const number = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};
const bonusNumber = (value) => Math.min(500, Math.round(number(value) * 2) / 2);
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function readSharedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      targetPt: number(saved?.targetPt, 1000),
      ownedPt: number(saved?.ownedPt),
      ownedCp: Math.floor(number(saved?.ownedCp)),
      normalOptions: Array.isArray(saved?.normalOptions) ? saved.normalOptions : [],
      eventOptions: Array.isArray(saved?.eventOptions) ? saved.eventOptions : [],
    };
  } catch {
    return { targetPt: 1000, ownedPt: 0, ownedCp: 0, normalOptions: [], eventOptions: [] };
  }
}

function readOptimizerSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPTIMIZER_KEY));
    return { maxFire: [3, 4, 5].includes(Number(saved?.maxFire)) ? Number(saved.maxFire) : 5 };
  } catch {
    return { maxFire: 5 };
  }
}

let sharedState = readSharedState();
let settings = readOptimizerSettings();
let activeWorker = null;
let hasResult = false;
let activeSignature = null;

function teamMarkup(team, mode, index) {
  const fallback = `${mode === "normal" ? "一般" : "活動"}隊伍 ${index + 1}`;
  const name = typeof team?.name === "string" && team.name.trim() ? team.name.trim() : fallback;
  const rank = ["SS", "S", "A", "B", "C", "D"].includes(team?.rank) ? team.rank : "A";
  const bonus = bonusNumber(team?.pt);
  return `<article class="team-chip ${mode}">
    <span class="team-index">${index + 1}</span>
    <div><b>${escapeHtml(name)}</b><small>pt 加成 ${bonus}%</small></div>
    <strong>${rank}</strong>
  </article>`;
}

function renderTeams(mode, teams) {
  const list = document.querySelector(`#${mode}Teams`);
  document.querySelector(`#${mode}Count`).textContent = `${teams.length} 隊`;
  list.innerHTML = teams.length
    ? teams.map((team, index) => teamMarkup(team, mode, index)).join("")
    : `<div class="team-empty">尚未建立${mode === "normal" ? "一般" : "活動"}隊伍</div>`;
}

function renderSharedState(markStale = false) {
  const remaining = Math.max(sharedState.targetPt - sharedState.ownedPt, 0);
  document.querySelector("#goalPt").textContent = format(sharedState.targetPt);
  document.querySelector("#ownedPtDisplay").textContent = format(sharedState.ownedPt);
  document.querySelector("#remainingPt").textContent = format(remaining);
  renderTeams("normal", sharedState.normalOptions);
  renderTeams("event", sharedState.eventOptions);
  if (markStale) markDirty("設定已更新，請重新計算");
}

function currentSignature() {
  return JSON.stringify({
    targetPt: Math.floor(sharedState.targetPt),
    ownedPt: Math.floor(sharedState.ownedPt),
    ownedCp: Math.floor(sharedState.ownedCp),
    normalOptions: sharedState.normalOptions,
    eventOptions: sharedState.eventOptions,
    maxFire: settings.maxFire,
  });
}

function generateActions(target) {
  return optimizerCore.generateActions({
    target,
    maxFire: settings.maxFire,
    normalOptions: sharedState.normalOptions,
    eventOptions: sharedState.eventOptions,
  });
}

function setResultState(kind, status, title, copy) {
  const badge = document.querySelector(".result-state");
  const hero = document.querySelector("#resultHero");
  document.querySelector("#resultStatus").textContent = status;
  document.querySelector("#resultHeroTitle").textContent = title;
  document.querySelector("#resultHeroCopy").textContent = copy;
  badge.textContent = kind.toUpperCase();
  badge.dataset.state = kind;
  hero.dataset.state = kind;
}

function clearMetrics() {
  ["#totalPlays", "#totalFire", "#remainingCp"].forEach((selector) => {
    document.querySelector(selector).textContent = "—";
  });
}

function markDirty(message) {
  if (hasResult) setResultState("stale", message, "條件已經改變", "舊結果已保留，但請再次按下開始計算取得新攻略。");
  else document.querySelector("#resultStatus").textContent = message;
}

function routeMarkup(step) {
  const { action, count } = step;
  const normal = action.mode === "normal";
  const cost = normal ? `${action.fire} 火` : `${format(action.cpCost)} CP`;
  const cpText = normal ? `＋${format(action.cpDelta)} CP` : `−${format(action.cpCost)} CP`;
  return `<div class="route-row ${action.mode}">
    <div class="route-name"><span>${normal ? "一般" : "活動"}</span><b>${escapeHtml(action.teamName)}</b><small>每場 ${format(action.points)} pt · ${cpText} · 小計 ${format(action.points * count)} pt</small></div>
    <span>${cost}<small>${format(action.multiplier)} 倍</small></span>
    <strong>${action.rank}</strong>
    <b>× ${format(count)}</b>
  </div>`;
}

function renderSolution(result, target) {
  hasResult = true;
  document.querySelector("#totalPlays").textContent = format(result.totals.plays);
  document.querySelector("#totalFire").textContent = format(result.totals.fire);
  document.querySelector("#remainingCp").textContent = format(result.totals.cpBalance);
  document.querySelector("#routeResult").innerHTML = result.steps.map(routeMarkup).join("");
  setResultState(
    "optimal",
    "已找到最少場次的精確解",
    "可以恰好達成",
    `取得 ${format(target)} pt；產生 ${format(result.totals.cpGenerated)} CP、消耗 ${format(result.totals.cpSpent)} CP。`,
  );
}

function renderFailure(kind, status, title, copy) {
  hasResult = true;
  clearMetrics();
  document.querySelector("#routeResult").innerHTML = `<div class="route-empty">${escapeHtml(copy)}</div>`;
  setResultState(kind, status, title, copy);
}

function stopWorker() {
  if (activeWorker) activeWorker.terminate();
  activeWorker = null;
  document.querySelector("#calculateButton").disabled = false;
  document.querySelector("#cancelButton").hidden = true;
}

function beginCalculation() {
  if (activeWorker) return;
  const target = Math.max(Math.floor(sharedState.targetPt) - Math.floor(sharedState.ownedPt), 0);
  const initialCp = Math.floor(sharedState.ownedCp);
  if (target > MAX_TARGET) {
    renderFailure("error", "輸入超出範圍", "目標過大", `尚缺 pt 目前最多支援 ${format(MAX_TARGET)}。`);
    return;
  }
  if (target === 0) {
    renderSolution({ totals: { plays: 0, fire: 0, cpBalance: initialCp, cpGenerated: 0, cpSpent: 0 }, steps: [] }, 0);
    document.querySelector("#routeResult").innerHTML = '<div class="route-empty">已達成目標，不需要再打關卡。</div>';
    return;
  }

  const actions = generateActions(target);
  if (!actions.length) {
    renderFailure("infeasible", "沒有可用打法", "無法建立搜尋範圍", "請確認至少有一隊能取得不超過尚缺 pt 的分數。");
    return;
  }
  const divisor = actions.reduce((value, action) => optimizerCore.gcd(value, action.points), 0);
  if (divisor && target % divisor !== 0) {
    renderFailure("infeasible", "已證明無精確解", "無法恰好達成", `所有單場得分的最大公因數為 ${format(divisor)}，無法組成 ${format(target)} pt。`);
    return;
  }

  hasResult = false;
  setResultState("running", "正在搜尋精確解", "計算中…", "正在尋找總場次最少的精確打法，頁面仍可正常操作。");
  document.querySelector("#calculateButton").disabled = true;
  document.querySelector("#cancelButton").hidden = false;
  activeSignature = currentSignature();
  activeWorker = new Worker("optimizer-worker.js?v=20261002-2");
  activeWorker.onmessage = (event) => {
    const result = event.data;
    const stale = activeSignature !== currentSignature();
    activeSignature = null;
    stopWorker();
    if (result.status === "optimal") renderSolution(result, target);
    else if (result.status === "infeasible") renderFailure("infeasible", "已證明無精確解", "無法恰好達成", "在目前隊伍、火量上限與 CP 條件下沒有精確解。");
    else renderFailure("error", "計算發生錯誤", "無法完成計算", result.message || "求解器回傳未知錯誤。");
    if (stale) markDirty("計算期間設定已改變，請重新計算");
  };
  activeWorker.onerror = () => {
    activeSignature = null;
    stopWorker();
    renderFailure("error", "計算發生錯誤", "求解器無法啟動", "請重新整理頁面後再試一次。");
  };
  activeWorker.postMessage({ actions, target, initialCp });
}

document.querySelectorAll('[name="maxFire"]').forEach((input) => {
  input.checked = Number(input.value) === settings.maxFire;
  input.addEventListener("change", () => {
    settings.maxFire = Number(input.value);
    localStorage.setItem(OPTIMIZER_KEY, JSON.stringify(settings));
    markDirty("搜尋範圍已更新，尚未計算");
  });
});

document.querySelector("#calculateButton").addEventListener("click", beginCalculation);
document.querySelector("#cancelButton").addEventListener("click", () => {
  activeSignature = null;
  stopWorker();
  renderFailure("cancelled", "已取消計算", "計算已停止", "條件沒有變更，可以再次開始計算。");
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    sharedState = readSharedState();
    renderSharedState(true);
  }
  if (event.key === OPTIMIZER_KEY) {
    settings = readOptimizerSettings();
    document.querySelectorAll('[name="maxFire"]').forEach((input) => {
      input.checked = Number(input.value) === settings.maxFire;
    });
    markDirty("搜尋範圍已更新，請重新計算");
  }
});

renderSharedState();

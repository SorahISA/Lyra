(function exposeOptimizerCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.BdonOptimizerCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const RANK_ORDER = ["SS", "S", "A", "B", "C", "D"];
  const NORMAL_RATES = {
    SS: { quarterPt: 400, cp: 10 }, S: { quarterPt: 300, cp: 8 },
    A: { quarterPt: 200, cp: 6 }, B: { quarterPt: 140, cp: 5 },
    C: { quarterPt: 100, cp: 4 }, D: { quarterPt: 60, cp: 3 },
  };
  const EVENT_RATES = {
    SS: { quarterPt: 110 }, S: { quarterPt: 90 }, A: { quarterPt: 70 },
    B: { quarterPt: 55 }, C: { quarterPt: 40 }, D: { quarterPt: 30 },
  };
  const EVENT_CP_COSTS = [200, 400, 800, 1600];

  const safeNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };
  const bonusNumber = (value) => Math.min(500, Math.round(safeNumber(value) * 2) / 2);

  function allowedRanks(maxRank, mode) {
    const start = RANK_ORDER.indexOf(maxRank);
    if (start < 0) return [];
    return RANK_ORDER.slice(start);
  }

  function actionPoints(quarterPt, multiplier, bonus) {
    const halfPercent = Math.round(bonusNumber(bonus) * 2);
    return Math.floor(quarterPt * multiplier * (200 + halfPercent) / 800);
  }

  function generateActions({ target, maxFire, normalOptions, eventOptions }) {
    let order = 0;
    const actions = [];
    normalOptions.forEach((team, teamIndex) => {
      const bonus = bonusNumber(team?.pt);
      allowedRanks(team?.rank, "normal").forEach((rank) => {
        for (let fire = 0; fire <= maxFire; fire += 1) {
          const multiplier = fire === 0 ? 1 : fire * 5;
          const points = actionPoints(NORMAL_RATES[rank].quarterPt, multiplier, bonus);
          if (points <= 0 || points > target) continue;
          actions.push({
            mode: "normal",
            teamIndex,
            teamName: team?.name || `一般隊伍 ${teamIndex + 1}`,
            rank,
            bonus,
            fire,
            multiplier,
            points,
            cpDelta: NORMAL_RATES[rank].cp * multiplier,
            order: order++,
          });
        }
      });
    });

    EVENT_CP_COSTS.forEach((cpCost) => {
      eventOptions.forEach((team, teamIndex) => {
        const bonus = bonusNumber(team?.pt);
        allowedRanks(team?.rank, "event").forEach((rank) => {
          const points = actionPoints(EVENT_RATES[rank].quarterPt, cpCost, bonus);
          if (points <= 0 || points > target) return;
          actions.push({
            mode: "event",
            teamIndex,
            teamName: team?.name || `活動隊伍 ${teamIndex + 1}`,
            rank,
            bonus,
            fire: 0,
            multiplier: cpCost,
            cpCost,
            points,
            cpDelta: -cpCost,
            order: order++,
          });
        });
      });
    });

    const unique = new Map();
    actions.forEach((action) => {
      const key = `${action.mode}:${action.points}:${action.cpDelta}:${action.fire}`;
      if (!unique.has(key)) unique.set(key, action);
    });
    return [...unique.values()];
  }

  function gcd(left, right) {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b) [a, b] = [b, a % b];
    return a;
  }

  return {
    RANK_ORDER,
    NORMAL_RATES,
    EVENT_RATES,
    EVENT_CP_COSTS,
    allowedRanks,
    actionPoints,
    generateActions,
    gcd,
  };
});

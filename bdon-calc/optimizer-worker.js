importScripts("vendor/javascript-lp-solver-1.0.3.js");

function createModel(actions, target, initialCp, objective, exactPlays = null) {
  const constraints = {
    points: { equal: target },
    cpBalance: { min: -initialCp },
  };
  if (exactPlays !== null) constraints.plays = { equal: exactPlays };

  const variables = {};
  const ints = {};
  actions.forEach((action, index) => {
    const name = `a${index}`;
    variables[name] = {
      points: action.points,
      cpBalance: action.cpDelta,
      plays: 1,
      fire: action.fire,
    };
    ints[name] = 1;
  });

  return {
    optimize: objective,
    opType: "min",
    constraints,
    variables,
    ints,
    options: { presolve: true, tolerance: 0, nodeSelection: "best-first" },
  };
}

function integerCounts(result, actions) {
  return actions.map((_, index) => {
    const value = Number(result[`a${index}`] ?? 0);
    return Math.abs(value) < 1e-7 ? 0 : Math.round(value);
  });
}

function verify(actions, counts, target, initialCp) {
  let points = 0;
  let cpBalance = initialCp;
  let plays = 0;
  let fire = 0;
  let cpGenerated = 0;
  let cpSpent = 0;

  counts.forEach((count, index) => {
    if (!Number.isSafeInteger(count) || count < 0) throw new Error("求解器回傳了無效的次數。");
    const action = actions[index];
    points += action.points * count;
    cpBalance += action.cpDelta * count;
    plays += count;
    fire += action.fire * count;
    if (action.mode === "normal") cpGenerated += action.cpDelta * count;
    else cpSpent += -action.cpDelta * count;
  });

  if (!Number.isSafeInteger(points) || points !== target || cpBalance < 0) {
    throw new Error("求解結果未通過 pt／CP 整數驗證。");
  }
  return { points, cpBalance, plays, fire, cpGenerated, cpSpent };
}

self.onmessage = (event) => {
  try {
    const { actions, target, initialCp } = event.data;
    if (!Array.isArray(actions) || !actions.length) {
      self.postMessage({ status: "infeasible" });
      return;
    }

    const first = solver.Solve(createModel(actions, target, initialCp, "plays"));
    if (!first.feasible) {
      self.postMessage({ status: "infeasible" });
      return;
    }

    const firstCounts = integerCounts(first, actions);
    const firstTotals = verify(actions, firstCounts, target, initialCp);
    const second = solver.Solve(createModel(actions, target, initialCp, "fire", firstTotals.plays));
    const counts = second.feasible ? integerCounts(second, actions) : firstCounts;
    const totals = verify(actions, counts, target, initialCp);
    if (totals.plays !== firstTotals.plays) throw new Error("第二階段改變了最少場次。");

    const steps = actions
      .map((action, index) => ({ action, count: counts[index] }))
      .filter((step) => step.count > 0)
      .sort((left, right) => {
        if (left.action.mode !== right.action.mode) return left.action.mode === "normal" ? -1 : 1;
        return left.action.order - right.action.order;
      });

    self.postMessage({ status: "optimal", totals, steps });
  } catch (error) {
    self.postMessage({ status: "error", message: error instanceof Error ? error.message : "求解失敗。" });
  }
};

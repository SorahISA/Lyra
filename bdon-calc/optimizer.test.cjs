const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const core = require("./optimizer-core.js");

const root = __dirname;
let response = null;
const context = vm.createContext({
  console,
  self: {
    postMessage(message) {
      response = message;
    },
  },
});

context.importScripts = (...files) => {
  files.forEach((file) => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  });
};

vm.runInContext(
  fs.readFileSync(path.join(root, "optimizer-worker.js"), "utf8"),
  context,
  { filename: "optimizer-worker.js" },
);

assert.equal(core.actionPoints(78, 200, 0), 3900, "S 19.5 × 200");
assert.equal(core.actionPoints(65, 200, 43), 4647, "A 16.25 × 200 × 1.43");
assert.equal(core.actionPoints(51, 400, 500), 30600, "B 12.75 × 400 × 6");
assert.equal(core.actionPoints(53, 200, 0), 2650, "13.25 × 200");
assert.deepEqual(core.allowedRanks("A", "normal"), ["A", "B", "C", "D"]);
assert.deepEqual(core.allowedRanks("A", "event"), ["A", "B", "C"]);

{
  const actions = core.generateActions({
    target: 1_000_000,
    maxFire: 5,
    normalOptions: [{ name: "一般 A", rank: "A", pt: 0 }],
    eventOptions: [{ name: "活動 A", rank: "A", pt: 0 }],
  });
  const normal = actions.filter((candidate) => candidate.mode === "normal");
  const event = actions.filter((candidate) => candidate.mode === "event");
  assert.equal(normal.length, 24, "A～D × 0～5 火");
  assert.equal(event.length, 12, "A～C × 4 種 CP");
  assert.deepEqual([...new Set(normal.map((candidate) => candidate.fire))], [0, 1, 2, 3, 4, 5]);
  assert.deepEqual([...new Set(event.map((candidate) => candidate.cpCost))], [200, 400, 800, 1600]);
  assert.ok(!event.some((candidate) => candidate.rank === "D"));
}

function action(overrides) {
  return {
    mode: "normal",
    teamIndex: 0,
    teamName: "測試隊伍",
    rank: "A",
    bonus: 0,
    fire: 0,
    multiplier: 1,
    points: 100,
    cpDelta: 0,
    order: 0,
    ...overrides,
  };
}

function solve(actions, target, initialCp = 0) {
  response = null;
  context.self.onmessage({ data: { actions, target, initialCp } });
  assert.ok(response, "Worker must post a response");
  return response;
}

{
  const result = solve([action({ points: 100 })], 100);
  assert.equal(result.status, "optimal");
  assert.equal(result.totals.plays, 1);
  assert.equal(result.totals.points, 100);
}

{
  const result = solve([
    action({ points: 60, order: 0 }),
    action({ points: 40, order: 1 }),
  ], 100);
  assert.equal(result.status, "optimal");
  assert.equal(result.totals.plays, 2);
}

{
  const result = solve([
    action({ points: 50, cpDelta: 200, fire: 1, order: 0 }),
    action({ mode: "event", points: 100, cpDelta: -200, cpCost: 200, order: 1 }),
  ], 150);
  assert.equal(result.status, "optimal");
  assert.equal(result.totals.plays, 2);
  assert.equal(result.totals.cpBalance, 0);
  assert.deepEqual([...result.steps].map((step) => step.action.mode), ["normal", "event"]);
}

{
  const result = solve([
    action({ mode: "event", points: 100, cpDelta: -200, cpCost: 200 }),
  ], 100, 0);
  assert.equal(result.status, "infeasible");
}

{
  const result = solve([
    action({ points: 100, fire: 3, order: 0 }),
    action({ points: 100, fire: 1, order: 1 }),
  ], 100);
  assert.equal(result.status, "optimal");
  assert.equal(result.totals.plays, 1);
  assert.equal(result.totals.fire, 1);
  assert.equal(result.steps[0].action.order, 1);
}

{
  const result = solve([], 100);
  assert.equal(result.status, "infeasible");
}

console.log("optimizer worker tests passed");

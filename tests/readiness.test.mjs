import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("Track D readiness evidence is complete and honest", async () => {
  const readiness = JSON.parse(
    await readFile(new URL("app/data/readiness.json", root), "utf8"),
  );
  assert.equal(readiness.requirements.length, 15);
  assert.ok(
    readiness.requirements.every(
      (item) => item.requirement && item.status && item.evidence,
    ),
  );
  assert.ok(readiness.limitations.length >= 5);
  assert.match(readiness.limitations.join(" "), /synthetic/i);
});

test("routing remains explicitly human controlled", async () => {
  const routing = await readFile(
    new URL("app/api/routing/route.ts", root),
    "utf8",
  );
  assert.match(routing, /Senior Analyst|Administrator/);
  assert.match(routing, /reason/i);
  assert.match(routing, /Approved/);
});

test("offline queue and judge mode are present", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /Offline Queue/);
  assert.match(page, /Judge Mode/);
  assert.match(page, /Human/);
});

test("synthetic dataset is in range and incident clusters do not leak", async () => {
  const evaluation = JSON.parse(await readFile(new URL("app/data/model-evaluation.json", root), "utf8"));
  assert.ok(evaluation.dataset.total >= 600 && evaluation.dataset.total <= 1000);
  assert.equal(evaluation.dataset.clusterSeparated, true);
  assert.equal(evaluation.dataset.leakageCount, 0);
  assert.equal(Object.keys(evaluation.overall.perClass).length, 14);
});

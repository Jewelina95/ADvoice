import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the ADvoice research recap", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>ADvoice · Evidence-governed cognitive screening<\/title>/i);
  assert.match(html, /播放一段语音，复现完整证据路径/);
  assert.match(html, /python3 demo\/run_demo\.py/);
  assert.match(html, /cookie_theft_demo\.wav/);
  assert.match(html, /MetricEvidence/);
  assert.doesNotMatch(html, /三个代表性状态|去标识病例|De-identified case/);
  assert.match(html, /One constrained path from speech to clinical review/);
  assert.match(html, /Research preview · model module under revision/);
  assert.doesNotMatch(html, /SpeechCARE|三条件|失败模式|B1 传统|B2 直接|B3/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("ships the generated review assets", async () => {
  const snapshot = JSON.parse(
    await readFile(new URL("../public/data/project-snapshot.json", import.meta.url), "utf8"),
  );
  assert.equal(snapshot.channels.length, 4);
  assert.equal(snapshot.states.length, 14);
  assert.ok(snapshot.metrics.length >= 25);
  assert.equal(snapshot.example.predictedLabel, "MCI");
  await Promise.all([
    access(new URL("../public/figures/system-architecture.png", import.meta.url)),
    access(new URL("../public/figures/dataset-landscape.png", import.meta.url)),
    access(new URL("../public/figures/metric-state-map.png", import.meta.url)),
    access(new URL("../public/figures/channel-state-matrix.png", import.meta.url)),
    access(new URL("../public/demo/cookie_theft_demo.wav", import.meta.url)),
    access(new URL("../public/demo/cookie_theft_demo.vtt", import.meta.url)),
    access(new URL("../public/demo/cookie_theft_demo.txt", import.meta.url)),
    access(new URL("../public/demo/demo_result.json", import.meta.url)),
    access(new URL("../public/demo/advoice_demo_bundle.zip", import.meta.url)),
    access(new URL("../demo/run_demo.py", import.meta.url)),
    access(new URL("../demo/reference_profile.json", import.meta.url)),
  ]);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("keeps the model snapshot separate from the page implementation", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const sync = await readFile(new URL("../scripts/sync_project_data.py", import.meta.url), "utf8");
  assert.match(page, /project-snapshot\.json/);
  assert.match(sync, /configs.*metrics/s);
  assert.match(sync, /diagnostic_agent_report_batch\.json/);
});

test("runs the bundled speech-to-evidence example end to end", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "advoice-demo-"));
  const outputPath = join(temporaryDirectory, "result.json");
  try {
    const run = spawnSync(
      "python3",
      [fileURLToPath(new URL("../demo/run_demo.py", import.meta.url)), "--out", outputPath],
      { encoding: "utf8" },
    );
    assert.equal(run.status, 0, run.stderr || run.stdout);
    const result = JSON.parse(await readFile(outputPath, "utf8"));
    assert.equal(result.input.audio, "cookie_theft_demo.wav");
    assert.equal(result.metric_evidence.length, 10);
    assert.equal(result.state_cards.length, 3);
    assert.equal(result.fusion.diagnostic_probability, null);
    assert.ok(result.fusion.recommendation.length > 0);
    assert.equal(result.trace.length, 5);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

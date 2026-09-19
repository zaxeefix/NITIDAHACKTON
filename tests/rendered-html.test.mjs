import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("production build emits the hosted worker and project manifest", async () => {
  await access(new URL("dist/server/index.js", root));
  const manifest = JSON.parse(
    await readFile(new URL("dist/.openai/hosting.json", root), "utf8"),
  );
  assert.match(manifest.project_id, /^appgprj_/);
});

test("document metadata and accessibility entry point are present", async () => {
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(layout, /title:\s*["']Triage247Ng["']/);
  assert.match(layout, /manifest:\s*["']\/manifest\.webmanifest["']/);
  assert.match(page, /Skip to main content/);
  assert.match(page, /aria-live=["']polite["']/);
  assert.match(page, /Create Account/);
  assert.match(page, /Independent platform notice/);
});

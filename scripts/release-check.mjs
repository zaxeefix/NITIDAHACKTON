import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const required = ["README.md", ".gitignore", ".env.example", "LICENSE", "render.yaml", "vercel.json", "docs/DEPLOYMENT.md"];
for (const file of required) await access(file);

const ignored = spawnSync("git", ["check-ignore", ".dev.vars", ".wrangler", "node_modules"], { encoding: "utf8" });
if (ignored.status !== 0) throw new Error("Secret/local runtime paths are not fully ignored by Git.");

const envExample = await readFile(".env.example", "utf8");
if (/^(?:[A-Z0-9_]*(?:SECRET|TOKEN|API_KEY|PASSWORD)[A-Z0-9_]*)=\s*\S+/m.test(envExample)) {
  throw new Error("The environment template appears to contain a value. Keep production credentials blank.");
}

for (const [command, args] of [["npm.cmd", ["test"]], ["npm.cmd", ["audit", "--omit=dev", "--audit-level=high"]]]) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Release check passed: build/tests, production dependency audit and Git exclusions are ready.");

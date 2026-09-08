import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const workspace = process.cwd();
const logDirectory = resolve(workspace, ".wrangler", "logs");
const configDirectory = resolve(workspace, ".wrangler", "config");
mkdirSync(logDirectory, { recursive: true });
mkdirSync(configDirectory, { recursive: true });

const executable = process.execPath;
const wrangler = resolve(workspace, "node_modules", "wrangler", "bin", "wrangler.js");
const result = spawnSync(executable, [wrangler, "d1", "migrations", "apply", "site-creator-d1", "--local", "--config", "wrangler.local.jsonc"], {
  cwd: workspace,
  env: { ...process.env, WRANGLER_LOG_PATH: logDirectory, XDG_CONFIG_HOME: configDirectory },
  stdio: "inherit",
  shell: false,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

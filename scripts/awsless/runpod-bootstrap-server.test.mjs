import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, "../..");

test("RunPod builds the server against Alice's agent source", async () => {
  const bootstrap = await readFile(
    path.join(scriptsDir, "runpod-bootstrap-server.mjs"),
    "utf8",
  );
  const agentSource = await readFile(
    path.join(
      root,
      "555-bot/milaidy/packages/agent/src/services/telegram-account-auth.ts",
    ),
    "utf8",
  );
  const launcher = await readFile(
    path.join(root, "555-bot/milaidy/milady.mjs"),
    "utf8",
  );

  const agentRemap = bootstrap.indexOf(
    "cp packages/agent/package.json node_modules/@elizaos/agent/",
  );
  const productionBuild = bootstrap.indexOf("bun run build");

  assert.ok(agentRemap >= 0, "the Alice agent must be materialized");
  assert.ok(productionBuild >= 0, "the runtime must run a production build");
  assert.ok(
    agentRemap < productionBuild,
    "the Alice agent must be materialized before dist/entry.js is built",
  );
  assert.match(
    agentSource,
    /from "telegram\/sessions\/index\.js";/,
    "the server must use Telegram's concrete ESM sessions entry",
  );
  assert.match(
    bootstrap,
    /MILAIDY_SOURCE_CLI:\s*"1"/,
    "RunPod must select the source CLI under the tsx loader",
  );
  assert.match(
    launcher,
    /eliza\/packages\/app-core\/src\/cli\/run-main\.ts/,
    "the launcher must route the RunPod source-CLI mode to runCli",
  );
});

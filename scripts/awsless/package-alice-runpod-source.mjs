#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");
const yyyyMmDd = now.toISOString().slice(0, 10);
const root = process.cwd();

const config = {
  sourceRoot: process.env.ALICE_SOURCE_ROOT || "555-bot",
  outputDir:
    process.env.ALICE_RUNPOD_SOURCE_DIR ||
    path.join("555stream", ".secrets"),
  evidenceDir:
    process.env.OUTPUT_DIR ||
    path.join("555stream", "evidence", "awsless", yyyyMmDd),
};

const tarballPath = path.join(
  config.outputDir,
  `alice-runpod-source-${stamp}.tar.gz`,
);

const includes = [
  "docker/Dockerfile",
  "scripts/resolve-milaidy-missing-workspaces.mjs",
  "scripts/pin-alice-release-runtime-deps.mjs",
  "scripts/build-milaidy-runtime-plugin-workspaces.mjs",
  "scripts/seed-knowledge.ts",
  "alice_knowledge",
  "milaidy",
].map((entry) => path.join(config.sourceRoot, entry));

const excludes = [
  // bsdtar (macOS) does not honor the `**` globs below — its `*` matches `/`,
  // so node_modules/.git leaked into the archive (5x size + secret risk).
  // These flat patterns match any node_modules/.git path at any depth on both
  // bsdtar and GNU tar; keep the `**` forms too for GNU-tar parity.
  "*/node_modules",
  "*/node_modules/*",
  "*/.git",
  "*/.git/*",
  // Bun's on-disk package cache (264k files, ~2GB) — pointless to ship (the pod
  // does a fresh `bun install`) and the only secret-pattern hits in the tree
  // are benign npm test fixtures cached under here (e.g. agent-base snakeoil
  // certs). Exclude it on bsdtar + GNU tar.
  "*/.bun-cache",
  "*/.bun-cache/*",
  `${config.sourceRoot}/.git`,
  `${config.sourceRoot}/.env`,
  `${config.sourceRoot}/.env.*`,
  `${config.sourceRoot}/agent.log`,
  `${config.sourceRoot}/content_cache`,
  `${config.sourceRoot}/test-results`,
  `${config.sourceRoot}/milaidy/.git`,
  `${config.sourceRoot}/milaidy/**/.git`,
  `${config.sourceRoot}/milaidy/**/.git/**`,
  `${config.sourceRoot}/milaidy/.claude`,
  `${config.sourceRoot}/milaidy/.depot`,
  `${config.sourceRoot}/milaidy/.milady`,
  `${config.sourceRoot}/milaidy/.env`,
  `${config.sourceRoot}/milaidy/.env.*`,
  `${config.sourceRoot}/milaidy/**/node_modules`,
  `${config.sourceRoot}/milaidy/**/.env`,
  `${config.sourceRoot}/milaidy/**/.env.*`,
  `${config.sourceRoot}/milaidy/apps/app/.vite`,
  `${config.sourceRoot}/milaidy/apps/app/android`,
  `${config.sourceRoot}/milaidy/apps/app/ios`,
  `${config.sourceRoot}/milaidy/apps/app/native-overrides`,
  `${config.sourceRoot}/milaidy/apps/app/screenshots`,
  `${config.sourceRoot}/milaidy/eliza/reports`,
  `${config.sourceRoot}/milaidy/reports`,
  `${config.sourceRoot}/milaidy/report`,
  `${config.sourceRoot}/milaidy/test-results`,
  `${config.sourceRoot}/milaidy/**/test-results`,
  `${config.sourceRoot}/milaidy/test`,
  `${config.sourceRoot}/milaidy/steward-fi`,
  `${config.sourceRoot}/milaidy/**/playwright-report`,
  `${config.sourceRoot}/milaidy/**/coverage`,
  `${config.sourceRoot}/milaidy/eliza/scripts/post-merge-secrets.txt`,
  `${config.sourceRoot}/milaidy/**/*.tgz`,
  `${config.sourceRoot}/milaidy/**/*.tar.gz`,
];

await assertExists(config.sourceRoot);
for (const include of includes) {
  await assertExists(include);
}

await mkdir(config.outputDir, { recursive: true });
await mkdir(config.evidenceDir, { recursive: true });

const tarArgs = [
  "-czf",
  tarballPath,
  ...excludes.flatMap((entry) => [`--exclude=${entry}`]),
  ...includes,
];

await run("tar", tarArgs);

const tarballStat = await stat(tarballPath);
const sha256 = await sha256File(tarballPath);
const manifest = {
  createdAt: now.toISOString(),
  sourceRoot: path.resolve(root, config.sourceRoot),
  tarballPath: path.resolve(root, tarballPath),
  sizeBytes: tarballStat.size,
  sha256,
  includes,
  excludes,
  secretSafety: {
    envFilesExcluded: true,
    gitHistoryExcluded: true,
    nodeModulesExcluded: true,
    knownSecretTextExcluded: [
      `${config.sourceRoot}/milaidy/eliza/scripts/post-merge-secrets.txt`,
    ],
  },
};

const manifestPath = path.join(
  config.evidenceDir,
  `alice-runpod-source-manifest-${Date.now()}.json`,
);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify(manifest, null, 2));
console.log(`Evidence written to ${manifestPath}`);

async function assertExists(filePath) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Missing required source path: ${filePath}`);
  }
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

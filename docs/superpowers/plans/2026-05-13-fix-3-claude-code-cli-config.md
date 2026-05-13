# Fix 3 — Claude Code CLI Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the Claude Code MCP config path in `sw4p-kit`'s init/doctor CLIs. Currently writes to `~/.claude/settings.json` (Claude Code's settings file — wrong target). After this plan lands, init writes to `~/.claude.json` (Claude Code's actual MCP-registration target) by default, conditionally also writes to `<cwd>/.mcp.json` when the user is in a project context, and supports `--project` / `--user-only` flags for scripted use.

**Architecture:** Single platform entry `claude-code` writing to `~/.claude.json` by default. Init's interactive flow detects whether `<cwd>/.mcp.json` exists; only then prompts the user about project-local registration. `--project` forces project-local registration regardless of file presence. `--user-only` suppresses the project-local prompt even when the file exists. Doctor reports user-level always and project-local conditionally.

**Tech Stack:** Node 18+ (TypeScript, ESM), `@modelcontextprotocol/sdk`, `zod`, `node:fs/promises`, `node:readline/promises`, vitest.

**Base commit:** `kit/c1-c2-cli @ 1a14339` (current tip on origin).

**Branch:** continue on `kit/c1-c2-cli`. Each task = one additive commit on top of `1a14339`.

**Spec:** `docs/superpowers/specs/2026-05-13-batch-1-critical-fixes-design.md` § Fix 3.

---

## Setup

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
git status --short      # clean working tree
git config user.name    # rndrntwrk
git config user.email   # dev@rndrntwrk.com
npm install             # picks up existing deps (≤ 2 prod, dev deps for vitest)
npm test 2>&1 | tail -5 # baseline: 108/108 passing
```

Identity discipline: `rndrntwrk <dev@rndrntwrk.com>`. NO `Co-Authored-By:` trailer. NO `--author` override. NO AI attribution. (The legitimate phrase "Claude Code" as the agent-platform name is fine in commit body content — the trailer scan distinguishes attribution trailers from descriptive content.)

---

## File map

| File | Action |
|---|---|
| `src/cli/_platforms.ts` | Single `claude-code` entry → path `~/.claude.json`. |
| `src/cli/init.ts` | Add `--project` / `--user-only` flag parsing. Add post-write detection step: if `<cwd>/.mcp.json` exists OR `--project` passed, write project-local. Add the conditional prompt. |
| `src/cli/doctor.ts` | Conditional project-local report. |
| `src/cli/_io.ts` | If a yes/no helper is missing, add one. |
| `src/__tests__/cli/_platforms.test.ts` | Update Claude Code path assertion. |
| `src/__tests__/cli/init.test.ts` | 4 new tests covering the scope-decision matrix. |
| `src/__tests__/cli/doctor.test.ts` | 2 new tests covering both report shapes. |
| `README.md` | Document `--project` / `--user-only` flags + the smart-default behavior. |

---

### Task 1: Fix the Claude Code platform path

**Files:**
- Modify: `src/cli/_platforms.ts:41-46`
- Modify: `src/__tests__/cli/_platforms.test.ts:30-31, 73`

- [ ] **Step 1: Write the failing test**

In `src/__tests__/cli/_platforms.test.ts`, find the existing `claude-code` path assertion (around line 30-31) and change it:

```ts
// Update the existing assertion (currently asserts on .claude/settings.json):
expect(byId["claude-code"]!.configPath(home, cwd)).toBe(
  path.join(home, ".claude.json")
);
```

And at line ~73 (the `present` array test), the same update.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
npx vitest run src/__tests__/cli/_platforms.test.ts 2>&1 | tail -15
```

Expected: FAIL — current path is `.claude/settings.json`.

- [ ] **Step 3: Update the platform entry**

In `src/cli/_platforms.ts:41-46`, change the `claude-code` entry's `configPath`:

```ts
{
  id: "claude-code",
  label: "Claude Code",
  configPath: (home, _cwd) => path.join(home, ".claude.json"),
  format: "json",
  mcpKey: "mcpServers",
}
```

- [ ] **Step 4: Run platform tests + full suite**

```bash
npx vitest run src/__tests__/cli/_platforms.test.ts 2>&1 | tail -10
npm test 2>&1 | tail -10
```

Expected: PASS. Suite still 108/108 (the test count didn't change; just the assertion did).

- [ ] **Step 5: Commit**

```bash
git add src/cli/_platforms.ts src/__tests__/cli/_platforms.test.ts
git commit -m "fix(kit): Claude Code MCP path -> ~/.claude.json (Track C1/C2 Fix 3)" --no-verify
```

---

### Task 2: Add `--project` / `--user-only` flag parsing to `init.ts`

**Files:**
- Modify: `src/cli/init.ts` (the arg parser + the `runInit` signature)

- [ ] **Step 1: Read the existing arg parser**

```bash
grep -n 'process.argv\|parseArgs\|args\.\|--help' src/cli/init.ts | head -20
```

Identify whether `init.ts` already has an arg-parsing helper or just consumes `process.argv` directly.

- [ ] **Step 2: Failing test**

In `src/__tests__/cli/init.test.ts`, add at the end of the `describe` block:

```ts
it("rejects --project and --user-only together", async () => {
  const io = scriptedIO([]);
  const fs = memFs();
  const result = await runInit({
    io,
    fs,
    args: ["--project", "--user-only"],
    homedir: "/home/u",
    cwd: "/p",
    env: {},
  });
  expect(result.error).toMatch(/mutually exclusive/i);
  expect(result.exitCode).not.toBe(0);
});
```

Adjust the `runInit` signature shape to match whatever the existing test file uses; the addition is the `args` field carrying CLI flags.

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/__tests__/cli/init.test.ts -t 'mutually exclusive' 2>&1 | tail -10
```

Expected: FAIL — `runInit` doesn't accept `args` or doesn't validate the flag combo.

- [ ] **Step 4: Add the flag parser + validation**

In `src/cli/init.ts`:

- Extend `runInit`'s options interface to include `args: string[]`.
- Parse `args` into a `flags` object: `{ project: boolean, userOnly: boolean }`. Both default `false`.
- If both true, return early with `{ exitCode: 2, error: "--project and --user-only are mutually exclusive" }`.
- In the CLI-entry top-level (the actual binary code at the bottom of `init.ts`), parse `process.argv.slice(2)` and pass it as `args` to `runInit`.

- [ ] **Step 5: Update HELP_TEXT** to document the two new flags.

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run src/__tests__/cli/init.test.ts 2>&1 | tail -10
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/cli/init.ts src/__tests__/cli/init.test.ts
git commit -m "feat(kit): add --project / --user-only flags to sw4p-kit-init (Track C1/C2 Fix 3)" --no-verify
```

---

### Task 3: Add project-local detection + conditional prompt

**Files:**
- Modify: `src/cli/init.ts`
- Modify: `src/__tests__/cli/init.test.ts`

- [ ] **Step 1: Failing tests (three scenarios)**

In `src/__tests__/cli/init.test.ts`, add:

```ts
it("does not prompt for project-local when no .mcp.json exists and no --project flag", async () => {
  const io = scriptedIO(["y", "test-key", "testnet"]); // claude-code yes, api key, network
  const fs = memFs({ "/home/u/.claude.json": '{"otherKey":"keep"}' });
  // No /p/.mcp.json in fs
  const result = await runInit({
    io,
    fs,
    args: [],
    homedir: "/home/u",
    cwd: "/p",
    env: {},
  });
  expect(result.exitCode).toBe(0);
  expect(fs.files["/p/.mcp.json"]).toBeUndefined(); // not written
  expect(io.unconsumedPrompts()).toEqual([]); // exactly the scripted answers consumed
  // Crucially: NO prompt about project-local was asked.
});

it("prompts for project-local when .mcp.json exists; user says yes", async () => {
  const io = scriptedIO(["y", "test-key", "testnet", "y"]); // ...then yes to project-local
  const fs = memFs({
    "/home/u/.claude.json": "{}",
    "/p/.mcp.json": '{"mcpServers":{"other":{"command":"foo"}}}',
  });
  const result = await runInit({
    io,
    fs,
    args: [],
    homedir: "/home/u",
    cwd: "/p",
    env: {},
  });
  expect(result.exitCode).toBe(0);
  const projectConfig = JSON.parse(fs.files["/p/.mcp.json"]!);
  expect(projectConfig.mcpServers.sw4p).toBeDefined();
  expect(projectConfig.mcpServers.other).toBeDefined(); // preserved
});

it("--project flag forces project-local write even with no .mcp.json present", async () => {
  const io = scriptedIO(["y", "test-key", "testnet"]); // no project-local prompt expected
  const fs = memFs({ "/home/u/.claude.json": "{}" });
  const result = await runInit({
    io,
    fs,
    args: ["--project"],
    homedir: "/home/u",
    cwd: "/p",
    env: {},
  });
  expect(result.exitCode).toBe(0);
  const projectConfig = JSON.parse(fs.files["/p/.mcp.json"]!);
  expect(projectConfig.mcpServers.sw4p).toBeDefined();
});

it("--user-only suppresses the project-local prompt even when .mcp.json exists", async () => {
  const io = scriptedIO(["y", "test-key", "testnet"]); // no project-local prompt expected
  const fs = memFs({
    "/home/u/.claude.json": "{}",
    "/p/.mcp.json": "{}",
  });
  const result = await runInit({
    io,
    fs,
    args: ["--user-only"],
    homedir: "/home/u",
    cwd: "/p",
    env: {},
  });
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(fs.files["/p/.mcp.json"]!)).toEqual({}); // untouched
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/cli/init.test.ts -t 'project-local' 2>&1 | tail -25
```

Expected: all 4 FAIL — current code doesn't handle project-local.

- [ ] **Step 3: Implement project-local detection in `runInit`**

In `src/cli/init.ts`, after the existing per-platform write loop completes, add:

```ts
// Smart project-local detection
const projectMcpPath = path.join(cwd, ".mcp.json");
const projectFileExists = await fs.exists(projectMcpPath);

let writeProject = false;
if (flags.project) {
  writeProject = true;
} else if (!flags.userOnly && projectFileExists) {
  const answer = await io.askYesNo(
    `A project-local .mcp.json exists in ${cwd}. Also register sw4p there?`
  );
  writeProject = answer;
}

if (writeProject) {
  // Apply the same atomic write + timestamped backup discipline as the per-platform writes.
  // Use the same MCP server entry shape; same JSON merge semantics.
  // result.actions.push({ kind: "wrote", target: "claude-code-project", path: projectMcpPath });
  // ...inline the actual write call here using the same helper that writes platform configs.
}
```

Use the same `buildMcpEntry()` and `writeJsonPlatform()` (or whatever the existing helpers are named) so the JSON merge + backup behavior is identical to platform writes.

- [ ] **Step 4: Add `askYesNo` to `_io.ts` if absent**

```bash
grep -n 'askYesNo\|askConfirm' src/cli/_io.ts
```

If absent, add:

```ts
export interface CliIO {
  // ...existing
  askYesNo(prompt: string, defaultAnswer?: boolean): Promise<boolean>;
}

// In realIO():
async askYesNo(prompt, defaultAnswer = true) {
  const suffix = defaultAnswer ? "[Y/n]" : "[y/N]";
  const answer = await rl.question(`${prompt} ${suffix} `);
  const trimmed = answer.trim().toLowerCase();
  if (!trimmed) return defaultAnswer;
  return trimmed === "y" || trimmed === "yes";
}

// In scriptedIO():
async askYesNo(_prompt) {
  // Pop next scripted answer; treat "y"/"yes" as true, "n"/"no" as false.
  // (Match the existing pattern for scripted I/O in this module.)
}
```

- [ ] **Step 5: Run all 4 tests to verify they pass**

```bash
npx vitest run src/__tests__/cli/init.test.ts -t 'project-local|--project|--user-only' 2>&1 | tail -25
```

Expected: 4 PASS.

- [ ] **Step 6: Run full suite**

```bash
npm test 2>&1 | tail -10
```

Expected: 108 → 112 passing.

- [ ] **Step 7: Commit**

```bash
git add src/cli/init.ts src/cli/_io.ts src/__tests__/cli/init.test.ts
git commit -m "feat(kit): smart project-local .mcp.json detection in init (Track C1/C2 Fix 3)" --no-verify
```

---

### Task 4: Conditional project-local report in `doctor.ts`

**Files:**
- Modify: `src/cli/doctor.ts`
- Modify: `src/__tests__/cli/doctor.test.ts`

- [ ] **Step 1: Failing tests**

In `src/__tests__/cli/doctor.test.ts`, add:

```ts
it("reports project-local registration when .mcp.json exists", async () => {
  const fs = memFs({
    "/home/u/.claude.json": '{"mcpServers":{"sw4p":{"command":"npx"}}}',
    "/p/.mcp.json": '{"mcpServers":{"sw4p":{"command":"npx"}}}',
  });
  const result = await runDoctor({
    fs,
    fetchImpl: fakeFetch({}),
    homedir: "/home/u",
    cwd: "/p",
    env: { SW4P_API_KEY: "k" },
  });
  expect(result.checks).toContainEqual(
    expect.objectContaining({ id: "claude-code-project", pass: true })
  );
});

it("omits project-local from the report when .mcp.json is absent", async () => {
  const fs = memFs({ "/home/u/.claude.json": '{"mcpServers":{"sw4p":{"command":"npx"}}}' });
  const result = await runDoctor({
    fs,
    fetchImpl: fakeFetch({}),
    homedir: "/home/u",
    cwd: "/p",
    env: { SW4P_API_KEY: "k" },
  });
  // No project-local entry at all
  expect(result.checks.some(c => c.id === "claude-code-project")).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/cli/doctor.test.ts -t 'project-local' 2>&1 | tail -15
```

Expected: 2 FAIL.

- [ ] **Step 3: Implement conditional report in `runDoctor`**

In `src/cli/doctor.ts`, after the existing platform-check loop, add:

```ts
const projectMcpPath = path.join(cwd, ".mcp.json");
const projectFileExists = await fs.exists(projectMcpPath);
if (projectFileExists) {
  try {
    const raw = await fs.readFile(projectMcpPath, "utf8");
    const config = JSON.parse(raw);
    const present = !!config?.mcpServers?.sw4p;
    checks.push({
      id: "claude-code-project",
      label: "Claude Code (project-local .mcp.json)",
      pass: present,
      detail: present ? `registered at ${projectMcpPath}` : `not registered in ${projectMcpPath}`,
    });
  } catch (err) {
    checks.push({
      id: "claude-code-project",
      label: "Claude Code (project-local .mcp.json)",
      pass: false,
      detail: `${projectMcpPath} present but unreadable: ${err}`,
    });
  }
}
// If !projectFileExists, no entry pushed.
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/cli/doctor.test.ts 2>&1 | tail -10
```

Expected: PASS. Existing doctor tests still pass.

- [ ] **Step 5: Full suite**

```bash
npm test 2>&1 | tail -10
```

Expected: 112 → 114 passing.

- [ ] **Step 6: Commit**

```bash
git add src/cli/doctor.ts src/__tests__/cli/doctor.test.ts
git commit -m "feat(kit): conditional project-local report in sw4p-kit-doctor (Track C1/C2 Fix 3)" --no-verify
```

---

### Task 5: README + verification + push

**Files:**
- Modify: `README.md` (Setup section — document the flags + default behavior)

- [ ] **Step 1: Update README**

Find the "Setup — init + doctor" section the prior commits added to `README.md`. Append (or extend) to include:

```markdown
### CLI flags

- `--project` — force project-local registration regardless of whether `<cwd>/.mcp.json` exists. Creates the file if absent.
- `--user-only` — skip the project-local detection step even when `<cwd>/.mcp.json` exists. Useful for scripted CI runs that should never touch the working directory.
- Default behavior: writes user-level (`~/.claude.json`) always; project-local is offered only when `<cwd>/.mcp.json` already exists.
```

- [ ] **Step 2: Run the full acceptance gate**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/.claude/worktrees/c1-c2-cli"
npm run build 2>&1 | tail -5
npm test 2>&1 | tail -5
npm run typecheck 2>&1 | tail -5
npm audit --omit=dev 2>&1 | tail -5
npm ls --omit=dev --depth=0 2>&1 | head -5
```

Expected: build clean, 114 tests passing, typecheck clean, 0 vulnerabilities, prod deps still 2.

- [ ] **Step 3: Identity + trailer audit**

```bash
git log --format='%an <%ae> | %s' origin/kit/track-b-slim-down..HEAD | head -20
git log --format='%B' origin/kit/track-b-slim-down..HEAD | grep -iE 'co-authored-by:|generated with claude|🤖|<noreply@|anthropic-bot|claude-bot' && echo "WARN" || echo "clean"
```

Expected: every commit author is `rndrntwrk <dev@rndrntwrk.com>`; trailer scan clean. The string "Claude Code" appearing as the agent-platform NAME in commit bodies is fine (it's descriptive content, not attribution).

- [ ] **Step 4: Smoke test the CLIs**

```bash
node dist/cli/init.js --help 2>&1 | head -20
node dist/cli/doctor.js --help 2>&1 | head -20
```

Expected: both print usage including the new `--project` / `--user-only` flags.

- [ ] **Step 5: Commit + push**

```bash
git add README.md
git commit -m "docs(kit): document --project / --user-only flags + smart default (Track C1/C2 Fix 3)" --no-verify
git push origin kit/c1-c2-cli
```

Expected: 5 new commits on origin (Tasks 1-5).

---

## Acceptance gate (must all pass)

1. `npm run build` exit 0.
2. `npm test` 114/114 passing (108 baseline + 4 init + 2 doctor).
3. `npm run typecheck` exit 0.
4. `npm audit --omit=dev` 0 vulnerabilities.
5. `npm ls --omit=dev --depth=0` shows only `@modelcontextprotocol/sdk` + `zod`.
6. `_platforms.ts`'s `claude-code` entry's `configPath` is `~/.claude.json`.
7. `init.ts` accepts `--project` and `--user-only` flags; rejects them together with exit code 2.
8. `init.ts` prompts for project-local only when `<cwd>/.mcp.json` exists OR `--project` is passed.
9. `doctor.ts` reports project-local only when `<cwd>/.mcp.json` exists.
10. Every commit on `kit/c1-c2-cli` from `1a14339` to the new tip has author `rndrntwrk <dev@rndrntwrk.com>` and zero AI-attribution trailers.

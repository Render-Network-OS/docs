import fs from "fs";

const correctionLogPath =
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/render_hub/docs/program/BOARD_CORRECTION_LOG_2026-04-03.md";
const boardPath = "/tmp/current_board_items.json";

const correctionLog = fs.readFileSync(correctionLogPath, "utf8");
const board = JSON.parse(fs.readFileSync(boardPath, "utf8"));

const items = board.items || [];

const byRepoNum = new Map();
const byCode = new Map();

for (const item of items) {
  const repo = item.content?.repository;
  const num = item.content?.number;
  if (!repo || typeof num !== "number") continue;
  byRepoNum.set(`${repo}#${num}`, item);
  const title = item.content?.title || "";
  const match = title.match(/^([A-Z]+-\d+)\b/);
  if (match) byCode.set(match[1], item);
}

const issueMatches = [
  ...correctionLog.matchAll(
    /\[[^\]]+\]\(https:\/\/github\.com\/([^/]+\/[^/]+)\/issues\/(\d+)\)/g,
  ),
];

const removed = [];
const seen = new Set();
for (const [, repo, numStr] of issueMatches) {
  const key = `${repo}#${numStr}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const item = byRepoNum.get(key);
  if (!item) continue;
  removed.push(item);
}

function parseBacklogIds(body = "") {
  const match = body.match(/\*\*Backlog IDs:\*\*\s*([^\n]+)/);
  if (!match) return [];
  return match[1]
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isRecurringNonDoc(item) {
  const repo = item.content?.repository || "";
  if (repo === "Render-Network-OS/docs") return false;
  const title = item.content?.title || "";
  const labels = item.labels || [];
  if (labels.includes("Cadence")) return true;
  if (/^(Weekly|Biweekly|Per release|Per candidate|Per incident)\b/i.test(title)) {
    return true;
  }
  if (/\bweekly demo cadence\b/i.test(title)) return true;
  return false;
}

const allDoneSuccessors = [];
const partialSuccessors = [];
const recurringNonDoc = [];

for (const item of removed) {
  const status = item.status;
  const state = item.content?.state || "open";
  const body = item.content?.body || "";
  const ids = parseBacklogIds(body);
  const mapped = ids.map((id) => {
    const next = byCode.get(id);
    return {
      id,
      status: next?.status || "MISSING",
      repo: next?.content?.repository || null,
      number: next?.content?.number || null,
      title: next?.content?.title || null,
    };
  });

  if (status !== "Done" && state !== "closed" && isRecurringNonDoc(item)) {
    recurringNonDoc.push({
      repo: item.content.repository,
      number: item.content.number,
      title: item.content.title,
      status,
      state,
      labels: item.labels,
    });
  }

  if (!ids.length || status === "Done" || state === "closed") continue;
  const allDone = mapped.length > 0 && mapped.every((entry) => entry.status === "Done");
  if (allDone) {
    allDoneSuccessors.push({
      repo: item.content.repository,
      number: item.content.number,
      title: item.content.title,
      status,
      state,
      ids,
      mapped,
    });
  } else {
    partialSuccessors.push({
      repo: item.content.repository,
      number: item.content.number,
      title: item.content.title,
      ids,
      mapped,
    });
  }
}

const summary = {
  removed_count_found_on_board: removed.length,
  all_done_successors: allDoneSuccessors.length,
  recurring_non_doc_open_not_done: recurringNonDoc.length,
};

console.log(JSON.stringify(summary, null, 2));
console.log("\nALL_DONE_SUCCESSORS");
for (const entry of allDoneSuccessors) {
  console.log(
    JSON.stringify(
      {
        repo: entry.repo,
        number: entry.number,
        title: entry.title,
        ids: entry.ids,
      },
      null,
      2,
    ),
  );
}

console.log("\nRECURRING_NON_DOC_OPEN_NOT_DONE");
for (const entry of recurringNonDoc) {
  console.log(JSON.stringify(entry, null, 2));
}

fs.writeFileSync(
  "/tmp/board_done_recovery_candidates.json",
  JSON.stringify(
    {
      summary,
      allDoneSuccessors,
      recurringNonDoc,
      partialSuccessors,
    },
    null,
    2,
  ),
);

# Weekly Security Review — Cadence Template

**Frequency**: Every Friday
**Owner**: Rotating (assigned per sprint)
**Duration**: 30 minutes
**Output**: Review comment on QA-SYS-03 (#72)

---

## Checklist

### 1. Open Findings Triage (10 min)

- [ ] Review each file in `security/` with Status: Open or Owned
- [ ] For new findings: assign owner and due date
- [ ] For owned findings past due: escalate or extend with justification
- [ ] For findings with PRs: verify fix addresses the root cause
- [ ] Update finding file with review disposition

### 2. Dependency Audit (10 min)

- [ ] Run `npm audit` in each service directory
- [ ] Review any new Dependabot PRs
- [ ] Merge or dismiss Dependabot PRs with justification
- [ ] Record critical/high vulnerability count

### 3. New Findings Scan (5 min)

- [ ] Check for new security-related issues or PRs
- [ ] Check Sentry for new unhandled error patterns
- [ ] Check logs for suspicious auth failure patterns

### 4. Record Results (5 min)

- [ ] Post review table on QA-SYS-03 issue (#72)
- [ ] Update any finding files that changed status
- [ ] Commit changes to `docs` repo

---

## Review Table Template

```markdown
## Weekly Security Review — YYYY-MM-DD

**Reviewer**: @username

| Finding | Severity | Owner | Due | Status | Disposition |
|:--------|:---------|:------|:----|:-------|:------------|
| Rate limiting on auth | P2 | @owner | date | Open/Owned/Closed | notes |
| ... | ... | ... | ... | ... | ... |

**Dependency audit**: X critical, Y high, Z moderate
**Dependabot PRs**: N reviewed, M merged, K dismissed
**New findings**: description or "None"
```

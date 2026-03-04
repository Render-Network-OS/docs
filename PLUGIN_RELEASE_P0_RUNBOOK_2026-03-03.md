# Plugin Release P0 Runbook (Tonight)

## Objective
Ship the plugin set tonight with safe defaults and operator-ready setup:
- `five55-games`
- `stream555-live`
- `stream555-ads`

## Release Gate (must pass)
1. Plugin manifests validate and load in Milaidy.
2. Required settings are documented and schema-validated.
3. Live start/stop works through Cloudflare-first path.
4. Ad trigger action can be called from plugin surface.
5. Score submission works for Alice and non-Alice agents.
6. Rollback instructions are tested and documented.

## Minimal Operator Config
- `FIVE55_API_BASE_URL`
- `FIVE55_AGENT_API_KEY`
- `FIVE55_AGENT_ID`
- `FIVE55_SESSION_DEFAULT_PROFILE` (optional)
- `FIVE55_ADS_ENABLED=true`
- `FIVE55_STREAM_PROVIDER=cloudflare`

## P0 Execution Sequence
1. Freeze plugin public interfaces for tonight build.
2. Validate plugin install/discovery in Milaidy app UI.
3. Validate action catalog exposure (live, games, ads).
4. Run smoke flow:
   - create/reuse session,
   - start live,
   - start game,
   - trigger ad,
   - confirm score write.
5. Tag release candidate and publish notes.

## Publish Artifacts
- Installation guide.
- Env/config reference.
- Troubleshooting section (auth, session, ad trigger, stream output).
- Changelog for plugin consumers.
- Explicit known issues + next patch ETA.

## Rollback
1. Disable new plugin versions in distribution metadata.
2. Re-pin previous stable plugin tags.
3. Flush plugin cache where applicable.
4. Confirm fallback release remains installable.

## Post-Release Monitoring (first 2 hours)
- Plugin install success rate.
- Session start success rate.
- Stream start success rate.
- Ad trigger request success and renderer ACK rate.
- Score ingest success and leaderboard write success.

# Track 2 · Slice 01 — Legacy Cleanup & Cross-Platform Lockfile

| Field | Value |
| :--- | :--- |
| **Task ID** | `T2-01` |
| **Track & Owner** | Track 2 (`apps/field-pwa`) · `@Akarshx-x` |
| **Issue / Branch** | Issue `#9` · `chore/field-pwa-cleanup-lockfile` |
| **Allowed Paths** | `apps/field-pwa/src/sync_client.ts` (delete), `apps/field-pwa/src/clinical/triage_input.ts` (comment only), `apps/field-pwa/MODULE_GUIDE.md` (note cleanup), `apps/field-pwa/package-lock.json` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/watch-companion/`, root `pyproject.toml`, `.github/` |
| **Depends On** | None (independent — can run immediately) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/field-pwa/`, Track 2) for Issue #9.

GOAL:
1. Delete the unused legacy file `apps/field-pwa/src/sync_client.ts`.
2. Update any stale comments or notes referencing `src/sync_client.ts`:
   - `apps/field-pwa/src/clinical/triage_input.ts` (comment on line 6)
   - `apps/field-pwa/MODULE_GUIDE.md` (legacy note)
3. Regenerate `apps/field-pwa/package-lock.json` cleanly so `npm ci` succeeds deterministically on Linux (x86_64) as well as macOS/Windows (no platform-exclusive optional esbuild binary breakage).

CONSTRAINTS:
- ONLY touch the Allowed Paths under `apps/field-pwa/`. Do NOT touch `packages/`, `services/`, `apps/watch-companion/`, or root config files.
- Do NOT alter runtime behavior of `src/sync/`, `src/core/`, `src/clinical/`, or `src/ui/`.
- Keep the PR small (<150 LOC excluding lockfile diff).

Before finishing, run:
  cd apps/field-pwa && npm ci && npm run typecheck && npm test && npm run build
  cd ../.. && make verify
````

---

## Step-by-Step Checklist

1. Run `git grep sync_client apps/field-pwa/` to confirm no active code imports `apps/field-pwa/src/sync_client.ts`.
2. Delete `apps/field-pwa/src/sync_client.ts` and remove the stale comment in `apps/field-pwa/src/clinical/triage_input.ts` plus the legacy bullet in `apps/field-pwa/MODULE_GUIDE.md`.
3. Regenerate `apps/field-pwa/package-lock.json` using `npm install --package-lock-only` (ensuring `@esbuild/linux-x64` optional dependency entries are preserved for Linux CI).
4. Verify a clean install from scratch via `npm ci`, followed by full typecheck, unit tests, and production bundle build.

---

## Verification Commands & Definition of Done

```bash
cd apps/field-pwa
npm ci
npm run typecheck
npm test
npm run build
cd ../..
make verify
```

**Definition of Done**:
- `apps/field-pwa/src/sync_client.ts` is deleted and `git grep sync_client apps/field-pwa/` returns zero matches.
- `npm ci` succeeds cleanly on Linux without deleting `package-lock.json`.
- `npm run typecheck`, `npm test`, `npm run build`, and root `make verify` all pass with zero errors.

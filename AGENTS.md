# AGENTS.md — AI Coding Agent Instructions for Aarogya Mesh

Read this file **before** editing any file or running code generation in this repository (applies to Antigravity, Cursor, Claude Code, GitHub Copilot, and any other AI agent).

---

## 1. Mandatory Pre-Flight Anti-Conflict Check

Before writing a single line of code, inspect live repository state so you never duplicate claimed work or collide with another teammate's active branch:

```bash
git fetch origin
git status
gh issue list --state open
gh pr list --state open
```

1. **Check Issue Assignment**: Never work on an open GitHub Issue that is already assigned to another developer. Have your user assign the Issue to themselves first.
2. **Check Open PRs**: Inspect open Draft and Ready PRs (`gh pr list`) to see which files and sub-tasks are actively in flight.
3. **Read Your Single Atomic Starter Prompt**: Open [`prompts/README.md`](./prompts/README.md) to find the track index and dependency DAG, then read **ONLY** the single atomic slice prompt under `prompts/track-N-*/` matching your claimed Issue before writing code. Do not load or execute other tracks' prompts.
4. **Sync Before Branching**: Always branch from up-to-date `origin/main` (`git checkout -b feat/<module>-<slug> origin/main`). Never commit directly to `main`.

---

## 2. Strict Directory Isolation

Aarogya Mesh uses **contract-locked parallel tracks**. Only edit files inside the directory assigned to your user:

| Track | Allowed Directory | Forbidden Directories (Unless Explicitly Authorized) |
| --- | --- | --- |
| **Track 1 (Core Bedrock)** | `packages/contracts/`, `packages/clinical-engine/`, `packages/crdt-sync/`, `services/phc-hub/`, root docs/CI | Do not overwrite teammate work in `apps/` or `services/ml-pipeline/` |
| **Track 2 (Teammate A)** | `apps/field-pwa/` | `packages/`, `services/`, `apps/watch-companion/`, root config |
| **Track 3 (Teammate B)** | `apps/watch-companion/` | `packages/`, `services/`, `apps/field-pwa/`, root config |
| **Track 4 (Teammate C)** | `services/ml-pipeline/` | `packages/`, `services/phc-hub/`, `apps/`, root config |

- **Contract & Root Dependency Lock**: Never mutate `packages/contracts/` or root `pyproject.toml` inside a feature branch. If an edge case requires a schema bump or new workspace dependency, escalate first via a **tiny standalone PR** (see `CONTRIBUTING.md`) and wait for explicit approval from the contract owner (`@Gauthampro7`).

---

## 3. Sub-Task Claiming & Claim-by-Draft-PR Workflow

1. **Assign Issue**: Claim or create a GitHub Issue and assign it to your developer before coding.
2. **Claim-by-Draft-PR**: Push your first small commit early and open a **Draft PR** (`gh pr create --draft`) so teammates and other AI agents immediately see active files.
3. **Keep Slices Small**: Target **< 300 LOC** per PR and merge every 2–4 hours.
4. **Rebase Discipline**: Run `git fetch origin && git rebase origin/main` before starting work and again before marking a PR Ready for Review.

---

## 4. Non-Negotiable Engineering & Clinical Invariants

- **Autonomous Node Kernel**: Every node (`TIER_0_WATCH`, `TIER_1_PHONE`, `TIER_2_HUB`) must operate 100% standalone indefinitely with zero RPC coupling. Peers converge only via `CrdtEvent` / `SyncEnvelope` delta sync.
- **Deterministic Clinical Safety Floor**: `WHO IMNCI` and India `UIP` deterministic rules in `packages/clinical-engine` are the hard safety floor. Local ML/SLM outputs (`services/ml-pipeline`) are advisory enrichments only and **must never override or downgrade** a deterministic `RED_EMERGENCY` danger-sign triage.
- **Contract-First Compliance**: All payloads must conform strictly to `packages/contracts/src/aarogya_contracts/models.py` (`extra="forbid"`), `packages/contracts/schemas/*.schema.json`, and `packages/contracts/ts/index.ts`. Never invent ad-hoc JSON fields.
- **Pure Indigenous Indic Vocabulary**: Any Indic clinical or UI text must use pure *Shuddh Tatsama* / classical Dravidian roots — zero Perso-Arabic or Hinglish vocabulary.
- **Zero-Bloat Hardware Rule**: Target hardware is **Fedora Linux, Python 3.12 (`uv`), 32 GiB RAM, Intel Core Ultra 9 185H**. **Never** add `torch`, `torchvision`, `torchaudio`, `tensorflow`, or `nvidia-*` CUDA dependencies.

---

## 5. Verification Gate (Required Before Concluding)

Before reporting a task complete or marking a PR Ready for Review, run and pass:

```bash
make verify
```

This runs `uv run ruff check .`, `uv run pytest -v`, and `uv run python -m aarogya_contracts.export_schemas --check`. Do not claim completion if any check fails.

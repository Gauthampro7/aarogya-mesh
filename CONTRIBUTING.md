# Contributing to Aarogya Mesh

We use **Trunk-Based Development**, **Contract-First Engineering**, and strict **module boundaries** so 4 developers can build simultaneously from Mon Nov 23 to Thu Nov 26 with zero merge conflicts.

---

## 1. Branching & Trunk-Based Workflow

- `main` is always green and demo-ready. Never push directly to `main`.
- Branch off `main` using short-lived branches (< 1 day):
  - `feat/<module>-<slug>` (e.g., `feat/field-pwa-offline-triage-form`)
  - `fix/<module>-<slug>` (e.g., `fix/ml-pipeline-ewma-window`)
  - `docs/<scope>-<slug>` (e.g., `docs/team-board-status`)
- Rebase or merge from `main` frequently (`git fetch origin && git rebase origin/main`), and delete branches immediately after merge.

---

## 2. Conventional Commits

Every commit message and PR title must follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <imperative summary>
```

**Allowed types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`  
**Standard scopes**: `contracts`, `clinical-engine`, `crdt-sync`, `phc-hub`, `ml-pipeline`, `field-pwa`, `watch-companion`, `ci`, `root`

Examples:
- `feat(field-pwa): add IndexedDB CRDT outbox queue`
- `feat(watch-companion): implement dual-mode patient-family SOS screen`
- `feat(ml-pipeline): wire faster-whisper INT8 transcriber`
- `fix(crdt-sync): preserve idempotent duplicate count on replay`

---

## 3. Contract-First Rule

`packages/contracts` is the single source of truth across Python (`aarogya_contracts`), JSON Schema (`packages/contracts/schemas/*.json`), and TypeScript (`packages/contracts/ts/index.ts`).

- **Never** invent ad-hoc JSON payloads in `apps/` or `services/`. Always import from `aarogya_contracts` or `packages/contracts/ts/index.ts`.
- **Never** mutate `packages/contracts/` without:
  1. Updating Pydantic models in `packages/contracts/src/aarogya_contracts/models.py`
  2. Regenerating JSON Schemas in `packages/contracts/schemas/` and matching interfaces in `packages/contracts/ts/index.ts`
  3. Running `make verify` to confirm all downstream packages and tests pass
  4. Getting explicit review from the `packages/contracts` owner (see `.github/CODEOWNERS`)

---

## 4. Clinical Safety & Vocabulary Rules

- **Deterministic Safety Floor**: WHO IMNCI and India UIP rules in `packages/clinical-engine` are authoritative. ML/SLM outputs in `services/ml-pipeline` are strictly advisory enrichments and must never override or downgrade a deterministic danger-sign triage (`RED_EMERGENCY`).
- **Pure Indigenous Indic Vocabulary**: Any Indic clinical or UI terminology must use pure *Shuddh Tatsama* / classical Dravidian roots — zero Perso-Arabic or Hinglish phrasing.

---

## 5. Zero-Bloat Hardware Rules

Target demo & development hardware: **Fedora Linux, Python 3.12 (`uv`), 32 GiB RAM, Intel Core Ultra 9 185H**.

- **NO NVIDIA CUDA**, **NO PyTorch (`torch`)**, **NO TensorFlow**, and no multi-gigabyte framework installs.
- Use lightweight edge runtimes only:
  - Audio STT: `whisper.cpp` / `faster-whisper` (CTranslate2 INT8 on CPU)
  - Structured Clinical Extraction: `llama.cpp` (`Qwen2.5-3B-Instruct` quantized GGUF with GBNF grammar constraints)
  - Risk Scoring & Explainability: `LightGBM` + `SHAP` (TreeExplainer)
  - Outbreak Surveillance: Pure NumPy/SciPy/stdlib `EWMA`
- Keep `uv sync` fast and reproducible across all team laptops.

---

## 6. PR Size & Review Checklist

Keep PRs small, focused on a single module, and ideally under **300 lines changed**. Before requesting review:

- [ ] Changes are scoped strictly to your owned module (or contract changes were pre-approved)
- [ ] `make lint` (`ruff check .`) passes with zero warnings
- [ ] `make test` (`pytest -v`) passes with all new unit tests added
- [ ] `make verify` succeeds cleanly
- [ ] Zero PyTorch/CUDA or unapproved heavy dependencies added to `pyproject.toml`
- [ ] All user-facing docs / `MODULE_GUIDE.md` updated if interfaces or commands changed

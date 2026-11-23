# T4-02: GBNF-Constrained Local SLM Structurer (`LlamaCppSlmStructurer`)

- **Task ID**: `T4-02`
- **Track & Owner**: Track 4 (`services/ml-pipeline/`) — `@Krishnanand-10`
- **Branch**: `feat/ml-slm-gbnf` (branched from `origin/main`)
- **Allowed Paths**: `services/ml-pipeline/src/aarogya_ml_pipeline/slm_structurer.py`, `services/ml-pipeline/src/aarogya_ml_pipeline/grammars/clinical_note.gbnf`, `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py`, `services/ml-pipeline/pyproject.toml`, `services/ml-pipeline/tests/test_slm_structurer.py`
- **Forbidden Paths**: `packages/`, `services/phc-hub/`, `apps/`, root `pyproject.toml`, `.github/`, `Makefile`
- **Depends On**: None (runs in parallel with `T4-01`, `T4-03`, `T4-04`)

---

## Copy-Paste Starter Prompt

```text
Read `AGENTS.md`, `ARCHITECTURE.md` (Sections 3 & 4), `services/ml-pipeline/MODULE_GUIDE.md`, `services/ml-pipeline/src/aarogya_ml_pipeline/interfaces.py`, and `packages/clinical-engine/rules/{imnci_pediatric,maternal_anc}.json` (read-only) to align extracted danger flag names.

Run pre-flight checks (`git fetch origin && git status && gh issue list --state open && gh pr list --state open`) and work on branch `feat/ml-slm-gbnf`.

Implement ONLY slice T4-02 inside `services/ml-pipeline/`:
1. Create `services/ml-pipeline/src/aarogya_ml_pipeline/grammars/clinical_note.gbnf`: a strict GBNF grammar constraining `llama.cpp` JSON output exclusively to keys `extracted_symptoms` (string array), `candidate_danger_flags` (string array), and `recommended_follow_up` (string). The grammar MUST NOT include `severity`, `triage_severity`, or `referral_required`.
2. Create `services/ml-pipeline/src/aarogya_ml_pipeline/slm_structurer.py` implementing `LlamaCppSlmStructurer` behind the `@runtime_checkable` `ClinicalSlmStructurer` protocol (`structure_note(self, transcript: str, language: str = "hi") -> StructuredClinicalNote`).
3. Target `Qwen2.5-3B-Instruct` Q4_K_M GGUF via `llama-cpp-python` (CPU / OpenVINO / Vulkan — zero CUDA/PyTorch), configured via `model_path` / `AAROGYA_SLM_GGUF_PATH` with `temperature=0.0` for deterministic extraction.
4. Enforce the Clinical Safety Invariant & Pure Indic Vocabulary Rule in the system prompt and output validator:
   - Map extracted danger flags onto canonical codes from `packages/clinical-engine/rules/` (e.g., `convulsions`, `not_able_to_drink_or_breastfeed`, `lethargic_or_unconscious`, `vaginal_bleeding`, `severe_headache_or_blurred_vision`, `reduced_fetal_movement`).
   - Strictly NEVER output or override `TriageSeverity`.
   - For Hindi (`language="hi"`), instruct pure *Shuddh Tatsama* vocabulary (e.g., ज्वर, श्वास कष्ट, प्राथमिक स्वास्थ्य केन्द्र, आपातकाल — zero Perso-Arabic/Hinglish/nukta).
5. Implement automatic offline fallback to `StubClinicalSlmStructurer` if `llama_cpp` is unavailable, GGUF weights are missing, or JSON validation fails, tagging `backend="stub-slm-fallback"`.
6. Declare `llama-cpp-python` only under `[project.optional-dependencies] slm = [...]` in `services/ml-pipeline/pyproject.toml`.
7. Export `LlamaCppSlmStructurer` in `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py` and add unit tests in `services/ml-pipeline/tests/test_slm_structurer.py` (protocol conformance, GBNF file presence, mocked LLM JSON parsing, rejection of extra `severity` keys, and missing-GGUF fallback).

Do NOT touch any files outside `services/ml-pipeline/`. Target < 300 LOC. Finish by running the zero-bloat check and `make verify`.
```

---

## Step-by-Step Checklist

1. **Pre-Flight & Branch**: Claim/create the Track 4 SLM issue, branch `feat/ml-slm-gbnf` from `origin/main`, and open a Draft PR early.
2. **GBNF Grammar**: Author `services/ml-pipeline/src/aarogya_ml_pipeline/grammars/clinical_note.gbnf` permitting only `extracted_symptoms`, `candidate_danger_flags`, and `recommended_follow_up`.
3. **SLM Adapter**: Implement `LlamaCppSlmStructurer` in `slm_structurer.py` with lazy `llama_cpp` import, `LlamaGrammar.from_file(...)`, `temperature=0.0`, Pydantic validation into `StructuredClinicalNote` (`extra="forbid"`), and `StubClinicalSlmStructurer` fallback.
4. **Canonical Flag Alignment & Indic Safety**: Ensure system prompt maps phrases to `imnci_pediatric.json` / `maternal_anc.json` danger-flag identifiers and mandates pure *Shuddh Tatsama* Hindi or crisp English for `recommended_follow_up`.
5. **Unit Tests**: Add `services/ml-pipeline/tests/test_slm_structurer.py` testing mocked `llama_cpp` completion, fallback when GGUF is absent, strict rejection of unauthorized `severity` fields, and `isinstance(..., ClinicalSlmStructurer)`.

---

## Verification Commands & Definition of Done

```bash
# 1. Zero PyTorch / CUDA bloat guard
! uv pip list | grep -iE '^(torch|torchvision|torchaudio|nvidia-|tensorflow)\b'

# 2. Slice unit tests & lint
uv run ruff check services/ml-pipeline/
uv run pytest -v services/ml-pipeline/tests/

# 3. Full monorepo verification gate
make verify
```

**Definition of Done**:
- `LlamaCppSlmStructurer` passes `isinstance(..., ClinicalSlmStructurer)` and returns strict `StructuredClinicalNote` (never outputs `TriageSeverity`).
- GBNF grammar file exists and forbids any triage severity override fields.
- Cleanly falls back to `StubClinicalSlmStructurer` when GGUF weights or `llama-cpp-python` are absent; `make verify` passes with 0 errors.
- Zero `torch`/`cuda`/`nvidia-*`/`tensorflow` packages; diff strictly inside `services/ml-pipeline/` and < 300 LOC.

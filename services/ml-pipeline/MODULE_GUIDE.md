# `services/ml-pipeline` — Module Guide (Teammate C)

**Track**: Tier-2 Local Edge ML & Outbreak Pipeline  
**Package**: `aarogya-ml-pipeline` (importable as `aarogya_ml_pipeline`)  
**Target Hardware**: Fedora Linux, Python 3.12 (`uv`), 32 GiB RAM, Intel Core Ultra 9 185H (x86_64 CPU + iGPU/NPU)

> **Atomic Starter Prompts**: Pick one independent slice from [`prompts/track-4-ml-pipeline/`](../../prompts/track-4-ml-pipeline/) (see the dependency DAG in [`prompts/README.md`](../../prompts/README.md)) and read only that file before coding.

---

## 1. Zero-Bloat Hardware & Safety Rules

1. **NO PyTorch / CUDA Bloat**: Never add `torch`, `torchvision`, `torchaudio`, `tensorflow`, or `nvidia-*` to `pyproject.toml`. CI fails automatically if any of those packages appear in `uv pip list`.
2. **Clinical Safety Invariant**: Local ML models **never** own raw triage severity or override deterministic WHO IMNCI / ASHA rules in `packages/clinical-engine`. SLMs only extract structured symptom flags (which feed *into* deterministic rules) and format grounded `ActionCard` summaries.
3. **Graceful Offline Fallback**: Keep `Stub*` classes intact or ensure your adapters fall back cleanly when local GGUF/Whisper weights are absent so `make verify` passes on fresh clones.
4. **Pure Indigenous Indic Vocabulary**: Any generated Indic `ActionCard` templates or voice prompts must use *Shuddh Tatsama* (Indo-Aryan) or classical Dravidian clinical terms — zero Perso-Arabic loanwords or Hinglish.

---

## 2. Protocol Interfaces to Implement (`src/aarogya_ml_pipeline/interfaces.py`)

Implement concrete adapters for the 4 `@runtime_checkable` protocols:

1. **`VoiceTranscriber` -> `faster-whisper` or `whisper.cpp` INT8**
   - Recommended: `faster-whisper` (CTranslate2 CPU `int8`) or `pywhispercpp` with `whisper-small` / Indic Whisper quantized INT8 GGUF.
   - Input: `audio_bytes: bytes, language_hint: str = "hi"`.
   - Output: `TranscriptionResult`.

2. **`ClinicalSlmStructurer` -> `llama.cpp` (`Qwen2.5-3B-Instruct` Q4_K_M + GBNF)**
   - Recommended: `llama-cpp-python` (CPU / OpenVINO / Vulkan, no CUDA) with a strict **GBNF grammar** enforcing JSON matching `StructuredClinicalNote`.
   - Input: `transcript: str, language: str = "hi"`.
   - Output: `StructuredClinicalNote` (`extracted_symptoms`, `candidate_danger_flags`, `recommended_follow_up`).

3. **`RiskScorer` -> `LightGBM` + `SHAP`**
   - Recommended: `lightgbm` + `shap` (`TreeExplainer`) on tabular patient features (`age_months`, `fever_days`, `respiratory_rate`, `gestational_weeks`, etc.).
   - Output: `RiskScoreResult` with calibrated `risk_score`, `risk_band`, and `shap_attributions`.

4. **`OutbreakDetector` -> `EWMA` Spatiotemporal Spike Detector**
   - Pure NumPy/Python Exponentially Weighted Moving Average over rolling village syndrome counts.
   - Output: `OutbreakSignal` mapped to `EventType.OUTBREAK_ALERT_RAISED` when `alert_triggered=True`.

---

## 3. Running Tests Locally

From the repo root (`aarogya-mesh/`):

```bash
uv sync
uv run pytest -v services/ml-pipeline/tests/
uv run ruff check services/ml-pipeline/
```

---

## 4. Wiring into Tier-2 Hub

`services/phc-hub` fetches pending `VOICE_NOTE_RECORDED` (`ENRICHMENT_PENDING`) events via `GET /api/v1/enrichment/pending` and processes them with `enrich_voice_note_event(...)`, appending `ENRICHMENT_COMPLETED` + `ACTION_CARD_ISSUED` to the CRDT store so they sync back to Tier-1 Phone and Tier-0 Watch.

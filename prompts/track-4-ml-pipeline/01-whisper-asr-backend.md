# T4-01: Whisper INT8 Offline ASR Backend (`WhisperVoiceTranscriber`)

- **Task ID**: `T4-01`
- **Track & Owner**: Track 4 (`services/ml-pipeline/`) — `@Krishnanand-10`
- **Branch**: `feat/ml-whisper-asr` (branched from `origin/main`)
- **Allowed Paths**: `services/ml-pipeline/src/aarogya_ml_pipeline/whisper_asr.py`, `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py`, `services/ml-pipeline/pyproject.toml`, `services/ml-pipeline/tests/test_whisper_asr.py`
- **Forbidden Paths**: `packages/`, `services/phc-hub/`, `apps/`, root `pyproject.toml`, `.github/`, `Makefile`
- **Depends On**: None (runs in parallel with `T4-02`, `T4-03`, `T4-04`)

---

## Copy-Paste Starter Prompt

```text
Read `AGENTS.md`, `services/ml-pipeline/MODULE_GUIDE.md`, `services/ml-pipeline/src/aarogya_ml_pipeline/interfaces.py`, and `services/phc-hub/src/aarogya_phc_hub/blob_store.py` (read-only reference).

Run pre-flight checks (`git fetch origin && git status && gh issue list --state open && gh pr list --state open`) and work on branch `feat/ml-whisper-asr`.

Implement ONLY slice T4-01 inside `services/ml-pipeline/`:
1. Create `services/ml-pipeline/src/aarogya_ml_pipeline/whisper_asr.py` implementing `WhisperVoiceTranscriber`, conforming strictly to the `@runtime_checkable` `VoiceTranscriber` protocol (`transcribe(self, audio_bytes: bytes, language_hint: str = "hi") -> TranscriptionResult`).
2. Use CPU-only INT8 local inference (`faster-whisper` with `device="cpu", compute_type="int8"` or `pywhispercpp`) — strictly NO `torch`, `torchvision`, `torchaudio`, `tensorflow`, or `nvidia-*`.
3. Accept raw audio bytes (WAV/OGG/WebM/Opus fetched from `LocalBlobStore` via `VOICE_NOTE_RECORDED.payload["audio_blob_key"]`), writing to an in-memory buffer or `tempfile.NamedTemporaryFile` (cleaned up in `finally`) for the ASR decoder.
4. Configure model directory/path via constructor args + env vars (`AAROGYA_WHISPER_MODEL_PATH`, `AAROGYA_WHISPER_MODEL_SIZE`, default local cache, `local_files_only=True` so it NEVER performs hidden network downloads at runtime).
5. Implement deterministic graceful fallback: if the optional ASR package is not installed, model weights are missing on disk, or `audio_bytes` is empty/unparseable in offline CI, fall back cleanly to `StubVoiceTranscriber` and annotate `backend="stub-asr-fallback"` (never crash CI on fresh clones).
6. Keep heavy native ASR packages under `[project.optional-dependencies] asr = [...]` in `services/ml-pipeline/pyproject.toml` so base `uv sync --all-packages` stays fast and bloat-free.
7. Export `WhisperVoiceTranscriber` from `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py` without modifying existing `Stub*` classes or protocol signatures.
8. Add focused unit tests in `services/ml-pipeline/tests/test_whisper_asr.py` covering protocol conformance, missing-weights fallback, mocked `faster-whisper`/`whisper.cpp` segment aggregation, confidence clamping (`0.0..1.0`), and offline `local_files_only=True` enforcement.

Do NOT touch any files outside `services/ml-pipeline/`. Target < 300 LOC. Finish by running the zero-bloat check and `make verify`.
```

---

## Step-by-Step Checklist

1. **Pre-Flight & Branch**: Claim/create the Track 4 ASR issue, branch `feat/ml-whisper-asr` from `origin/main`, and open a Draft PR early.
2. **Adapter Module**: Create `services/ml-pipeline/src/aarogya_ml_pipeline/whisper_asr.py` with lazy runtime import, CPU INT8 configuration, `local_files_only=True`, temp-file cleanup, and automatic `StubVoiceTranscriber` fallback.
3. **Optional Dependency Extra**: Add `[project.optional-dependencies]` (`asr = ["faster-whisper>=1.1"]` or `pywhispercpp`) to `services/ml-pipeline/pyproject.toml` — verify zero `torch`/`nvidia-*` transitive pulls.
4. **Public Export**: Re-export `WhisperVoiceTranscriber` in `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py` (keep `interfaces.py` protocol untouched).
5. **Unit Tests**: Write `services/ml-pipeline/tests/test_whisper_asr.py` verifying `isinstance(asr, VoiceTranscriber)`, fallback behavior without weights, mocked real-engine decoding of raw bytes, and language hint propagation (`"hi"`, `"en"`, `"ta"`).

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
- `isinstance(WhisperVoiceTranscriber(), VoiceTranscriber)` is `True` and returns strict `TranscriptionResult`.
- Works 100% offline with `local_files_only=True` and degrades cleanly to `StubVoiceTranscriber` when local INT8 weights are absent.
- Zero `torch`/`cuda`/`nvidia-*`/`tensorflow` packages installed; `make verify` passes with 0 errors.
- Diff stays strictly inside `services/ml-pipeline/` and < 300 LOC.

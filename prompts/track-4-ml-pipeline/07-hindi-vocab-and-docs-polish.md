# T4-07 — ML Pipeline Pure *Shuddh Tatsama* Hindi Polish & Docs

- **Task ID**: `T4-07`
- **Track & Owner**: Track 4 — `services/ml-pipeline/` i18n & Docs Polish (**Krishna / Tiwari `@Krishnanand-10`**)
- **Difficulty**: Easy / Non-Critical Polish Slice (zero triage/safety logic mutations)
- **Branch**: `feat/ml-pipeline-hindi-docs-polish`
- **Allowed Paths**:
  - `services/ml-pipeline/src/aarogya_ml_pipeline/slm_structurer.py` (ONLY Hindi prompt string + `HINDI_VOCAB_REPLACEMENTS` + `sanitize_hindi_text`)
  - `services/ml-pipeline/src/aarogya_ml_pipeline/pipeline.py` (ONLY Hindi `ActionCard` display title / step label formatting)
  - `services/ml-pipeline/MODULE_GUIDE.md`
  - `services/ml-pipeline/tests/test_slm_structurer.py`
  - `services/ml-pipeline/tests/test_enrichment_pipeline.py`
- **Forbidden Paths**:
  - `packages/contracts/`, `packages/clinical-engine/`, `packages/crdt-sync/`, `services/phc-hub/`, `apps/`, root `pyproject.toml`
  - `services/ml-pipeline/src/aarogya_ml_pipeline/grammars/clinical_note.gbnf`
  - `services/ml-pipeline/src/aarogya_ml_pipeline/risk_scorer.py`
  - `services/ml-pipeline/src/aarogya_ml_pipeline/outbreak_detector.py`
  - `services/ml-pipeline/src/aarogya_ml_pipeline/whisper_asr.py`
  - **DO NOT** modify `evaluate_triage` calls, `CANONICAL_DANGER_FLAGS`, `DANGER_FLAG_SYNONYMS`, `map_to_canonical_danger_flag`, or `FORBIDDEN_CLINICAL_KEYS`
- **Depends On**: `T4-06` (PR `#22` merged into `origin/main` first — cut your branch from updated `origin/main`!)

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T4-07.
First make sure you are branched from the latest `origin/main` (AFTER `T4-06` / PR `#22` is merged).
Read `AGENTS.md`, `ARCHITECTURE.md` (Section 4: Pure Indigenous Indic Vocabulary Rule), and these exact files:
- `services/ml-pipeline/src/aarogya_ml_pipeline/slm_structurer.py`
- `services/ml-pipeline/src/aarogya_ml_pipeline/pipeline.py`
- `services/ml-pipeline/MODULE_GUIDE.md`
- `services/ml-pipeline/tests/test_slm_structurer.py`
- `services/ml-pipeline/tests/test_enrichment_pipeline.py`

Goal: Polish Pure *Shuddh Tatsama* Hindi vocabulary across SLM prompts, sanitization, and generated `ActionCard` display strings, and document the synthetic risk model training workflow & optional local weights in `MODULE_GUIDE.md`.

CRITICAL INVARIANTS (violating any of these fails review):
1. ZERO CLINICAL SAFETY MUTATIONS: Do NOT touch `evaluate_triage(...)` calls, `CANONICAL_DANGER_FLAGS`, `DANGER_FLAG_SYNONYMS`, `map_to_canonical_danger_flag(...)`, `FORBIDDEN_CLINICAL_KEYS`, `grammars/clinical_note.gbnf`, `risk_scorer.py`, `outbreak_detector.py`, or `whisper_asr.py`.
2. PURE SHUDDH TATSAMA HINDI ONLY: Every Hindi string in `slm_structurer.py` and `pipeline.py` MUST use pure Sanskrit-derived Tatsama terms — ZERO Perso-Arabic/Urdu loanwords (`बुख़ार`, `इलाज`, `मरीज़`, `ख़ून`, `तकलीफ़`, `तेज़`, `फ़ौरन`), ZERO English/Hinglish Devanagari transliterations (`आउटपुट`, `हॉस्पिटल`, `डॉक्टर`, `इमरजेंसी`), and ZERO Unicode nukta (`\u093c` / `़`).
3. KEEP ENGLISH BEHAVIOR UNCHANGED: When `language != "hi"` (e.g., `"en"`), `ActionCard` titles and step labels must remain unchanged so no existing English tests break.
4. ZERO PYTORCH / CUDA BLOAT: Do not add dependencies to `pyproject.toml`.

Exact 4 Changes to Implement:
1. Fix Hindi System Prompt in `slm_structurer.py` (`_build_prompt`):
   - Replace both occurrences of the Hinglish transliteration `"आउटपुट"` with pure Tatsama `"निर्गत"` (e.g., `"निर्गत केवल JSON कुंजियों के साथ होना चाहिए: ..."` and `"कभी भी severity या referral_required निर्गत न करें।"`).
2. Harden `HINDI_VOCAB_REPLACEMENTS` and `sanitize_hindi_text(text)` in `slm_structurer.py`:
   - Add `("तेज़", "तीव्र")`, `("तेज", "तीव्र")`, and `("आउटपुट", "निर्गत")` to `HINDI_VOCAB_REPLACEMENTS` (place longer/nukta phrases before shorter ones so replacements do not collide).
   - At the end of `sanitize_hindi_text(text)`, strip any remaining Unicode nukta character (`\u093c`) via `unicodedata.normalize("NFD", result)` -> strip `\u093c` -> `unicodedata.normalize("NFC", ...)` (or `.replace("\u093c", "")` on NFD-decomposed Devanagari so precomposed `क़`/`ख़`/`ग़`/`ज़`/`ड़`/`ढ़`/`फ़` also lose their nukta cleanly!). Verify that pure Devanagari matras and anusvara (`ं`) remain untouched!
3. Localize Hindi `ActionCard` Display Strings in `pipeline.py`:
   - Add a pure Tatsama Hindi title map `_TITLE_MAP_HI`:
     - `TriageSeverity.RED_EMERGENCY`: `"रक्त आपातकाल — तत्काल प्राथमिक स्वास्थ्य केन्द्र प्रेषण"`
     - `TriageSeverity.YELLOW_PHC`: `"पीत चेतावनी — प्राथमिक स्वास्थ्य केन्द्र परामर्श आवश्यक"`
     - `TriageSeverity.GREEN_HOME`: `"हरित — स्वर टिप्पणी चिकित्सीय सारांश"`
   - Add a pure Tatsama Hindi risk-band label map (`"HIGH": "उच्च"`, `"MODERATE": "मध्यम"`, `"LOW": "न्यून"`).
   - When `asr_result.language == "hi"` (or starts with `"hi"`), use `_TITLE_MAP_HI`, format symptom step as `f"लक्षित लक्षण: {', '.join(structured.extracted_symptoms)}"`, format risk step as `f"संकट स्तर: {band_hi} ({risk_result.risk_score:.2f})"`, and run `sanitize_hindi_text(...)` on `summary_text`. Keep English formatting identical when `language != "hi"`.
4. Update `services/ml-pipeline/MODULE_GUIDE.md`:
   - Add a crisp section documenting:
     - How to run `uv run python services/ml-pipeline/scripts/train_synthetic_risk_model.py` to generate optional local `models/risk_lgbm.txt` (gitignored).
     - Optional model environment variables (`AAROGYA_WHISPER_MODEL`, `AAROGYA_SLM_MODEL_PATH`, `AAROGYA_RISK_MODEL_PATH`).
     - How each backend (`WhisperVoiceTranscriber`, `LlamaCppSlmStructurer`, `LightGbmRiskScorer`, `EwmaOutbreakDetector`) degrades cleanly to deterministic stubs when weights or optional wheels are absent so CI stays fast and PyTorch/CUDA-free.

Tests to Add:
- In `tests/test_slm_structurer.py`:
  - Assert `"आउटपुट"` is absent from the built Hindi prompt and `"निर्गत"` is present.
  - Assert `sanitize_hindi_text("तेज़ बुख़ार और फ़ौरन आउटपुट")` produces `"तीव्र ज्वर और तत्काल निर्गत"` with zero `\u093c` nukta characters (even after NFD decomposition).
- In `tests/test_enrichment_pipeline.py`:
  - Assert that enriching a Hindi voice note (`language="hi"`) emits an `ACTION_CARD_ISSUED` whose `title`, `summary`, and `action_steps` use pure *Shuddh Tatsama* Hindi labels (`"लक्षित लक्षण:"`, `"संकट स्तर:"`, zero `"Observed symptoms:"`, zero `"ML risk band:"`, zero nukta).
  - Assert English voice note (`language="en"`) still emits English `ActionCard` labels unchanged.

Run `make verify` before finishing and keep diff <250 LOC.
```

---

## Step-by-Step Checklist

1. Confirm branch is cut from `origin/main` containing merged `T4-06` (PR `#22`).
2. Update `slm_structurer.py`: replace `"आउटपुट"` → `"निर्गत"`, add `("तेज़", "तीव्र")`, `("तेज", "तीव्र")`, `("आउटपुट", "निर्गत")`, and strip NFD nukta (`\u093c`) in `sanitize_hindi_text()`.
3. Update `pipeline.py`: add `_TITLE_MAP_HI` and pure Tatsama Hindi formatting for `ActionCard.title`, `summary`, and `action_steps` when `language` is Hindi (preserving English output unchanged).
4. Document `scripts/train_synthetic_risk_model.py`, optional local model env vars, and deterministic stub fallback in `services/ml-pipeline/MODULE_GUIDE.md`.
5. Add unit tests in `test_slm_structurer.py` and `test_enrichment_pipeline.py` verifying zero nukta, zero `"आउटपुट"`, `"तेज"` → `"तीव्र"`, and localized Hindi `ActionCard` strings.

---

## Verification Commands & Definition of Done

```bash
# 1. Confirm no safety-critical files or rules were touched
git diff --stat origin/main

# 2. Verify zero nukta / forbidden loanwords in slm_structurer.py & pipeline.py Hindi strings
uv run python -c "
import unicodedata
from pathlib import Path
for rel in ('slm_structurer.py', 'pipeline.py'):
    p = Path('services/ml-pipeline/src/aarogya_ml_pipeline') / rel
    text = p.read_text(encoding='utf-8')
    assert 'आउटपुट' not in text, f'Hinglish आउटपुट still in {rel}'
print('Hindi prompt check passed!')
"

# 3. Run ML pipeline tests and full workspace verify
uv run pytest -v services/ml-pipeline/tests/
make verify
```

- [ ] Zero occurrences of `"आउटपुट"` in `slm_structurer.py`; `"निर्गत"` used in Hindi prompt.
- [ ] `sanitize_hindi_text` converts `"तेज"`/`"तेज़"` → `"तीव्र"` and strips all `\u093c` nukta cleanly without damaging Devanagari matras.
- [ ] Hindi voice notes produce pure *Shuddh Tatsama* `ActionCard` titles and steps; English voice notes remain unchanged.
- [ ] `MODULE_GUIDE.md` clearly documents `train_synthetic_risk_model.py` and optional local weights/env vars.
- [ ] Zero modifications to clinical safety floor / danger-sign matching / GBNF grammar; `make verify` passes 100%.

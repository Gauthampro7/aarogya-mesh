"""Tests for GBNF-constrained Local SLM Structurer (slice T4-02)."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from aarogya_ml_pipeline.interfaces import (
    ClinicalSlmStructurer,
    StructuredClinicalNote,
)
from aarogya_ml_pipeline.slm_structurer import (
    CANONICAL_DANGER_FLAGS,
    LlamaCppSlmStructurer,
    map_to_canonical_danger_flag,
    parse_and_validate_slm_json,
    sanitize_hindi_text,
)


def test_protocol_conformance() -> None:
    """LlamaCppSlmStructurer must conform to ClinicalSlmStructurer protocol."""
    structurer = LlamaCppSlmStructurer()
    assert isinstance(structurer, ClinicalSlmStructurer)
    assert structurer.temperature == 0.0


def test_gbnf_grammar_presence_and_clinical_safety() -> None:
    """GBNF grammar file must exist and forbid any triage severity keys."""
    grammar_file = (
        Path(__file__).parents[1]
        / "src"
        / "aarogya_ml_pipeline"
        / "grammars"
        / "clinical_note.gbnf"
    )
    assert grammar_file.is_file(), f"Missing GBNF grammar at {grammar_file}"

    content = grammar_file.read_text(encoding="utf-8")

    # Required JSON schema keys must be constrained by grammar
    assert "extracted_symptoms" in content
    assert "candidate_danger_flags" in content
    assert "recommended_follow_up" in content

    # Clinical Safety Floor: MUST NOT contain triage severity fields
    content_lower = content.lower()
    assert "severity" not in content_lower
    assert "triage_severity" not in content_lower
    assert "referral_required" not in content_lower
    assert "triage" not in content_lower


def test_missing_gguf_fallback() -> None:
    """Missing or invalid GGUF model path falls back cleanly to StubClinicalSlmStructurer."""
    structurer = LlamaCppSlmStructurer(model_path="/nonexistent/model.gguf")
    note = structurer.structure_note("Child has fever and convulsions", language="en")

    assert isinstance(note, StructuredClinicalNote)
    assert note.backend == "stub-slm-fallback"
    assert "fever" in note.extracted_symptoms
    assert "convulsions" in note.candidate_danger_flags


def test_missing_gguf_hindi_fallback_pure_indic() -> None:
    """Fallback in Hindi uses pure Shuddh Tatsama vocabulary."""
    structurer = LlamaCppSlmStructurer(model_path=None)
    note = structurer.structure_note("शिशु को ज्वर और श्वास कष्ट है", language="hi")

    assert isinstance(note, StructuredClinicalNote)
    assert note.backend == "stub-slm-fallback"
    assert note.language == "hi"
    # Ensure zero Perso-Arabic terms in fallback output
    assert "अस्पताल" not in note.recommended_follow_up
    assert "दवाखाना" not in note.recommended_follow_up
    assert "इलाज" not in note.recommended_follow_up
    assert "प्राथमिक स्वास्थ्य केन्द्र" in note.recommended_follow_up or "निर्धारक" in note.recommended_follow_up


def test_canonical_danger_flag_mapping() -> None:
    """Danger flags must normalize to canonical clinical-engine codes."""
    assert map_to_canonical_danger_flag("convulsion") == "convulsions"
    assert map_to_canonical_danger_flag("seizures") == "convulsions"
    assert map_to_canonical_danger_flag("दौरा") == "convulsions"
    assert map_to_canonical_danger_flag("unable to drink") == "not_able_to_drink_or_breastfeed"
    assert map_to_canonical_danger_flag("cannot_breastfeed") == "not_able_to_drink_or_breastfeed"
    assert map_to_canonical_danger_flag("lethargy") == "lethargic_or_unconscious"
    assert map_to_canonical_danger_flag("abnormally_sleepy") == "lethargic_or_unconscious"
    assert map_to_canonical_danger_flag("bleeding") == "vaginal_bleeding"
    assert map_to_canonical_danger_flag("रक्तस्राव") == "vaginal_bleeding"
    assert map_to_canonical_danger_flag("severe headache") == "severe_headache_or_blurred_vision"
    assert map_to_canonical_danger_flag("धुंधली दृष्टि") == "severe_headache_or_blurred_vision"
    assert map_to_canonical_danger_flag("reduced_fetal_movement") == "reduced_fetal_movement"

    # All primary canonical flags must be present in canonical set
    expected_flags = {
        "convulsions",
        "not_able_to_drink_or_breastfeed",
        "lethargic_or_unconscious",
        "vaginal_bleeding",
        "severe_headache_or_blurred_vision",
        "reduced_fetal_movement",
    }
    assert expected_flags.issubset(CANONICAL_DANGER_FLAGS)


def test_sanitize_hindi_text_pure_indic() -> None:
    """Sanitizer replaces Perso-Arabic and Hinglish loanwords with Shuddh Tatsama."""
    raw = "मरीज को तेज बुखार और सांस की तकलीफ है। अस्पताल ले जाना जरूरी है।"
    sanitized = sanitize_hindi_text(raw)

    assert "मरीज" not in sanitized
    assert "बुखार" not in sanitized
    assert "सांस की तकलीफ" not in sanitized
    assert "अस्पताल" not in sanitized
    assert "जरूरी" not in sanitized

    assert "रोगी" in sanitized
    assert "ज्वर" in sanitized
    assert "श्वास कष्ट" in sanitized
    assert "प्राथमिक स्वास्थ्य केन्द्र" in sanitized
    assert "आवश्यक" in sanitized


def test_mocked_llm_json_parsing() -> None:
    """Mocked LLM completion correctly parses into StructuredClinicalNote."""
    structurer = LlamaCppSlmStructurer(model_path=None)

    llm_payload = {
        "extracted_symptoms": ["fever", "cough"],
        "candidate_danger_flags": ["convulsion", "unable to drink"],
        "recommended_follow_up": "Refer to Primary Health Centre immediately.",
    }
    mock_llm = MagicMock()
    mock_llm.return_value = {
        "choices": [{"text": json.dumps(llm_payload)}],
    }

    structurer._llm = mock_llm
    structurer._is_available = True

    note = structurer.structure_note("Child has fever, cough, and fits", language="en")

    assert note.backend == "llama-cpp-qwen2.5-3b-gbnf"
    assert "fever" in note.extracted_symptoms
    assert "cough" in note.extracted_symptoms
    # Canonical mapped flags
    assert note.candidate_danger_flags == ["convulsions", "not_able_to_drink_or_breastfeed"]
    assert note.recommended_follow_up == "Refer to Primary Health Centre immediately."


def test_mocked_llm_hindi_structuring() -> None:
    """Mocked LLM completion in Hindi applies Pure Indic vocabulary sanitation."""
    structurer = LlamaCppSlmStructurer(model_path=None)

    llm_payload = {
        "extracted_symptoms": ["तेज बुखार", "सांस की तकलीफ"],
        "candidate_danger_flags": ["दौरा"],
        "recommended_follow_up": "मरीज को तुरंत अस्पताल में भर्ती कराएं।",
    }
    mock_llm = MagicMock()
    mock_llm.return_value = {
        "choices": [{"text": json.dumps(llm_payload)}],
    }

    structurer._llm = mock_llm
    structurer._is_available = True

    note = structurer.structure_note("शिशु को तेज बुखार और दौरा है", language="hi")

    assert note.backend == "llama-cpp-qwen2.5-3b-gbnf"
    assert note.language == "hi"
    assert "तेज ज्वर" in note.extracted_symptoms
    assert "श्वास कष्ट" in note.extracted_symptoms
    assert note.candidate_danger_flags == ["convulsions"]
    assert "रोगी" in note.recommended_follow_up
    assert "प्राथमिक स्वास्थ्य केन्द्र" in note.recommended_follow_up
    assert "अस्पताल" not in note.recommended_follow_up


def test_rejection_of_extra_severity_keys_in_json() -> None:
    """Direct JSON parser rejects any forbidden triage severity keys."""
    payload_with_severity = json.dumps({
        "extracted_symptoms": ["fever"],
        "candidate_danger_flags": ["convulsions"],
        "recommended_follow_up": "Follow up immediately",
        "severity": "RED_EMERGENCY",
    })
    with pytest.raises(ValueError, match="Clinical Safety Floor Violation"):
        parse_and_validate_slm_json(payload_with_severity)

    payload_with_triage = json.dumps({
        "extracted_symptoms": ["fever"],
        "candidate_danger_flags": [],
        "recommended_follow_up": "Follow up",
        "triage_severity": "YELLOW_PHC",
    })
    with pytest.raises(ValueError, match="Clinical Safety Floor Violation"):
        parse_and_validate_slm_json(payload_with_triage)

    payload_with_referral = json.dumps({
        "extracted_symptoms": ["cough"],
        "candidate_danger_flags": [],
        "recommended_follow_up": "Follow up",
        "referral_required": True,
    })
    with pytest.raises(ValueError, match="Clinical Safety Floor Violation"):
        parse_and_validate_slm_json(payload_with_referral)


def test_structure_note_safely_rejects_llm_severity_override() -> None:
    """When LLM attempts to output severity, structure_note falls back cleanly."""
    structurer = LlamaCppSlmStructurer(model_path=None)

    llm_payload = {
        "extracted_symptoms": ["fever"],
        "candidate_danger_flags": ["convulsions"],
        "recommended_follow_up": "Immediate triage",
        "severity": "RED_EMERGENCY",
    }
    mock_llm = MagicMock()
    mock_llm.return_value = {
        "choices": [{"text": json.dumps(llm_payload)}],
    }

    structurer._llm = mock_llm
    structurer._is_available = True

    note = structurer.structure_note("Child has fever and convulsions")

    # The unauthorized severity override must be rejected, falling back to deterministic stub
    assert note.backend == "stub-slm-fallback"
    assert not hasattr(note, "severity")
    assert "severity" not in note.model_dump()


def test_env_var_model_path_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    """Structurer respects AAROGYA_SLM_GGUF_PATH environment variable."""
    fake_path = "/tmp/fake_qwen_model.gguf"
    monkeypatch.setenv("AAROGYA_SLM_GGUF_PATH", fake_path)

    structurer = LlamaCppSlmStructurer()
    assert structurer.model_path == Path(fake_path)

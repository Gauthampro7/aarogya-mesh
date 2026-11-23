"""Tests for EnrichmentPipeline deferred enrichment orchestrator (Track 4 / Slice T4-05)."""

from typing import Any

import pytest

from aarogya_contracts import (
    ActionCard,
    ActionCardPriority,
    CrdtEvent,
    EnrichmentState,
    EventType,
    HlcTimestamp,
    TriageSeverity,
)
from aarogya_ml_pipeline import (
    EnrichmentPipeline,
    EwmaOutbreakDetector,
    LightGbmRiskScorer,
    LlamaCppSlmStructurer,
    RiskScoreResult,
    StructuredClinicalNote,
    TranscriptionResult,
    WhisperVoiceTranscriber,
)


class MockSlmWithDangerFlag:
    """Mock SLM structurer returning configurable candidate danger flags."""

    def __init__(self, danger_flags: list[str], symptoms: list[str] | None = None) -> None:
        self.danger_flags = danger_flags
        self.symptoms = symptoms or ["fever"]

    def structure_note(self, transcript: str, language: str = "hi") -> StructuredClinicalNote:
        return StructuredClinicalNote(
            extracted_symptoms=self.symptoms,
            candidate_danger_flags=self.danger_flags,
            recommended_follow_up="Deterministic danger-sign triage required.",
            language=language,
            backend="mock-slm",
        )


class MockRiskScorerFixed:
    """Mock RiskScorer returning a fixed low risk score."""

    def __init__(self, score: float = 0.05, band: str = "LOW") -> None:
        self.score = score
        self.band = band

    def score_risk(self, features: dict[str, Any]) -> RiskScoreResult:
        return RiskScoreResult(
            risk_score=self.score,
            risk_band=self.band,  # type: ignore[arg-type]
            shap_attributions={"has_danger_sign": 0.0, "symptom_count": 0.05},
            backend="mock-low-risk-scorer",
        )


class MockVoiceTranscriberRecord:
    """Mock VoiceTranscriber tracking received audio bytes."""

    def __init__(self) -> None:
        self.called_with_bytes: bytes | None = None

    def transcribe(self, audio_bytes: bytes, language_hint: str = "hi") -> TranscriptionResult:
        self.called_with_bytes = audio_bytes
        return TranscriptionResult(
            transcript="माता कहती है कि बच्चे को तीव्र दौरा और ज्वर आया है।",
            language=language_hint,
            confidence=0.98,
            backend="mock-transcriber",
        )


def _make_voice_event(
    event_id: str = "evt-voice-101",
    patient_id: str = "pat-101",
    payload: dict[str, Any] | None = None,
) -> CrdtEvent:
    return CrdtEvent(
        event_id=event_id,
        hlc=HlcTimestamp(wall_ms=1_700_000_100_000, logical=0, node_id="phone-asha-01"),
        origin_node_id="phone-asha-01",
        patient_id=patient_id,
        event_type=EventType.VOICE_NOTE_RECORDED,
        enrichment_state=EnrichmentState.PENDING,
        payload=payload or {"language": "hi", "transcript_hint": "बच्चे को दौरा आया है।"},
    )


def test_single_danger_sign_convulsions_forces_red_emergency_despite_low_risk_score() -> None:
    """CLINICAL SAFETY FLOOR: A single danger sign (convulsions) MUST force RED_EMERGENCY.

    Even if RiskScorer returns a LOW advisory risk score (e.g. 0.05), local ML/SLM
    must never override or downgrade deterministic WHO IMNCI danger sign triage.
    """
    slm = MockSlmWithDangerFlag(danger_flags=["convulsions"], symptoms=["fever", "convulsions"])
    low_risk_scorer = MockRiskScorerFixed(score=0.05, band="LOW")

    pipeline = EnrichmentPipeline(
        structurer=slm,
        risk_scorer=low_risk_scorer,
    )

    voice_event = _make_voice_event(patient_id="child-pat-01")
    hub_hlc = HlcTimestamp(wall_ms=1_700_000_200_000, logical=5, node_id="hub-01")

    emitted = pipeline.process_voice_note(
        voice_event,
        hub_node_id="hub-01",
        hlc=hub_hlc,
        patient_context={"age_months": 18},
    )

    assert len(emitted) == 2
    enrichment_evt, card_evt = emitted

    # Verify ENRICHMENT_COMPLETED payload
    triage = enrichment_evt.payload["triage_assessment"]
    assert triage["severity"] == TriageSeverity.RED_EMERGENCY
    assert triage["referral_required"] is True
    assert "IMNCI_GDS_03" in triage["matched_rules"]

    # Verify risk score remains advisory LOW
    risk = enrichment_evt.payload["risk_score"]
    assert risk["risk_band"] == "LOW"
    assert risk["risk_score"] == 0.05

    # Verify ACTION_CARD_ISSUED priority is anchored to deterministic RED_EMERGENCY
    card = ActionCard.model_validate(card_evt.payload)
    assert card.priority == ActionCardPriority.CRITICAL
    assert card.severity == TriageSeverity.RED_EMERGENCY
    assert "RED EMERGENCY" in card.title


def test_single_danger_sign_vaginal_bleeding_maternal_forces_red_emergency() -> None:
    """CLINICAL SAFETY FLOOR: Maternal vaginal bleeding MUST force RED_EMERGENCY."""
    slm = MockSlmWithDangerFlag(danger_flags=["vaginal_bleeding"], symptoms=["vaginal_bleeding"])
    low_risk_scorer = MockRiskScorerFixed(score=0.08, band="LOW")

    pipeline = EnrichmentPipeline(
        structurer=slm,
        risk_scorer=low_risk_scorer,
    )

    voice_event = _make_voice_event(patient_id="mother-pat-02")
    hub_hlc = HlcTimestamp(wall_ms=1_700_000_300_000, logical=0, node_id="hub-01")

    emitted = pipeline.process_voice_note(
        voice_event,
        hub_node_id="hub-01",
        hlc=hub_hlc,
        patient_context={"is_pregnant": True, "gestational_weeks": 28},
    )

    assert len(emitted) == 2
    enrichment_evt, card_evt = emitted

    triage = enrichment_evt.payload["triage_assessment"]
    assert triage["severity"] == TriageSeverity.RED_EMERGENCY
    assert triage["referral_required"] is True

    card = ActionCard.model_validate(card_evt.payload)
    assert card.priority == ActionCardPriority.CRITICAL
    assert card.severity == TriageSeverity.RED_EMERGENCY


def test_emitted_events_pass_strict_crdt_and_action_card_validation_with_monotonic_hlc() -> None:
    """Emitted events must conform to CrdtEvent and ActionCard with monotonic HLCs."""
    pipeline = EnrichmentPipeline()
    voice_event = _make_voice_event(
        event_id="evt-voice-test-301",
        patient_id="pat-301",
        payload={"language": "hi", "transcript_hint": "रोगी को दो दिन से सामान्य ज्वर है।"},
    )
    base_hlc = HlcTimestamp(wall_ms=1_700_000_400_000, logical=10, node_id="hub-phc-01")

    emitted = pipeline.process_voice_note(
        voice_event,
        hub_node_id="hub-phc-01",
        hlc=base_hlc,
    )

    assert len(emitted) == 2
    enrichment_evt, card_evt = emitted

    # Validate strict CrdtEvent schemas
    assert isinstance(enrichment_evt, CrdtEvent)
    assert isinstance(card_evt, CrdtEvent)
    assert enrichment_evt.event_type == EventType.ENRICHMENT_COMPLETED
    assert card_evt.event_type == EventType.ACTION_CARD_ISSUED

    # Monotonic HLC check
    assert enrichment_evt.hlc.logical == 10
    assert card_evt.hlc.logical == 11
    assert enrichment_evt.hlc < card_evt.hlc

    # References check
    assert enrichment_evt.ref_event_id == "evt-voice-test-301"
    assert card_evt.ref_event_id == "evt-voice-test-301"
    assert enrichment_evt.enrichment_state == EnrichmentState.COMPLETED
    assert card_evt.enrichment_state == EnrichmentState.COMPLETED

    # ActionCard strict schema validation
    card = ActionCard.model_validate(card_evt.payload)
    assert card.patient_id == "pat-301"
    assert card.source_event_id == enrichment_evt.event_id
    assert card.status == "OPEN"
    assert card.target_tier == "TIER_0_WATCH"


def test_outbreak_detection_surge_emits_outbreak_alert_raised() -> None:
    """Anomalous syndrome surge must emit OUTBREAK_ALERT_RAISED with monotonic HLC."""
    detector = EwmaOutbreakDetector(alpha=0.3, sigma_multiplier=2.5, min_case_floor=3)
    pipeline = EnrichmentPipeline(outbreak_detector=detector)

    voice_event = _make_voice_event(
        event_id="evt-voice-outbreak-401",
        patient_id="pat-401",
        payload={"language": "hi", "transcript_hint": "सामान्य जांच।"},
    )
    base_hlc = HlcTimestamp(wall_ms=1_700_000_500_000, logical=0, node_id="hub-01")

    # Historical daily counts ending in an extreme surge: baseline ~1, surge to 15 cases
    village_counts = {
        ("village-rampur", "acute_diarrhea"): [1, 1, 2, 1, 1, 15],
    }

    emitted = pipeline.process_voice_note(
        voice_event,
        hub_node_id="hub-01",
        hlc=base_hlc,
        village_syndrome_counts=village_counts,
    )

    assert len(emitted) == 3
    enrichment_evt, card_evt, outbreak_evt = emitted

    # Verify event types and references
    assert enrichment_evt.event_type == EventType.ENRICHMENT_COMPLETED
    assert card_evt.event_type == EventType.ACTION_CARD_ISSUED
    assert outbreak_evt.event_type == EventType.OUTBREAK_ALERT_RAISED
    assert outbreak_evt.ref_event_id == "evt-voice-outbreak-401"

    # Verify monotonic HLC across all 3 events
    assert enrichment_evt.hlc.logical == 0
    assert card_evt.hlc.logical == 1
    assert outbreak_evt.hlc.logical == 2
    assert enrichment_evt.hlc < card_evt.hlc < outbreak_evt.hlc

    # Verify outbreak signal payload
    payload = outbreak_evt.payload
    assert payload["village_id"] == "village-rampur"
    assert payload["syndrome"] == "acute_diarrhea"
    assert payload["alert_triggered"] is True
    assert payload["ewma_value"] > payload["threshold"]


def test_outbreak_detection_flat_baseline_emits_no_outbreak_alert() -> None:
    """Flat baseline case counts must NOT emit OUTBREAK_ALERT_RAISED."""
    detector = EwmaOutbreakDetector(alpha=0.3, sigma_multiplier=2.5, min_case_floor=3)
    pipeline = EnrichmentPipeline(outbreak_detector=detector)

    voice_event = _make_voice_event(event_id="evt-voice-normal-501")
    base_hlc = HlcTimestamp(wall_ms=1_700_000_600_000, logical=0, node_id="hub-01")

    village_counts = {
        ("village-rampur", "acute_diarrhea"): [1, 1, 1, 1, 1, 1],
    }

    emitted = pipeline.process_voice_note(
        voice_event,
        hub_node_id="hub-01",
        hlc=base_hlc,
        village_syndrome_counts=village_counts,
    )

    # Exactly 2 events: ENRICHMENT_COMPLETED and ACTION_CARD_ISSUED; no OUTBREAK_ALERT_RAISED
    assert len(emitted) == 2
    assert [e.event_type for e in emitted] == [
        EventType.ENRICHMENT_COMPLETED,
        EventType.ACTION_CARD_ISSUED,
    ]


def test_pipeline_audio_bytes_vs_transcript_hint() -> None:
    """Pipeline transcribes audio_bytes when present, and falls back to transcript_hint when absent."""
    mock_transcriber = MockVoiceTranscriberRecord()
    pipeline = EnrichmentPipeline(transcriber=mock_transcriber)

    # Path 1: audio_bytes is provided -> transcriber.transcribe is called with raw audio
    voice_event_1 = _make_voice_event(
        event_id="evt-audio-01",
        payload={"language": "hi", "transcript_hint": "hint text"},
    )
    raw_audio = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00"
    pipeline.process_voice_note(
        voice_event_1,
        hub_node_id="hub-01",
        hlc=HlcTimestamp(wall_ms=1_700_000_700_000, logical=0, node_id="hub-01"),
        audio_bytes=raw_audio,
    )
    assert mock_transcriber.called_with_bytes == raw_audio

    # Path 2: audio_bytes is None -> falls back to transcript_hint in payload
    mock_transcriber.called_with_bytes = None
    voice_event_2 = _make_voice_event(
        event_id="evt-audio-02",
        payload={"language": "hi", "transcript_hint": "रोगी को खांसी है।"},
    )
    emitted = pipeline.process_voice_note(
        voice_event_2,
        hub_node_id="hub-01",
        hlc=HlcTimestamp(wall_ms=1_700_000_700_000, logical=0, node_id="hub-01"),
        audio_bytes=None,
    )
    assert mock_transcriber.called_with_bytes is None
    enrichment_evt = emitted[0]
    assert enrichment_evt.payload["transcription"]["transcript"] == "रोगी को खांसी है।"


def test_pipeline_invalid_event_type_raises_value_error() -> None:
    """Non-VOICE_NOTE_RECORDED event must raise ValueError."""
    pipeline = EnrichmentPipeline()
    wrong_event = CrdtEvent(
        event_id="evt-reg-001",
        hlc=HlcTimestamp(wall_ms=1_700_000_800_000, logical=0, node_id="phone-01"),
        origin_node_id="phone-01",
        patient_id="pat-001",
        event_type=EventType.PATIENT_REGISTERED,
        payload={"full_name": "Test Patient", "village_id": "v-01"},
    )

    with pytest.raises(ValueError, match="VOICE_NOTE_RECORDED"):
        pipeline.process_voice_note(
            wrong_event,
            hub_node_id="hub-01",
            hlc=HlcTimestamp(wall_ms=1_700_000_800_000, logical=0, node_id="hub-01"),
        )


def test_pipeline_default_backends_instantiate_and_run_cleanly() -> None:
    """Pipeline initializes with default concrete backends and runs successfully."""
    pipeline = EnrichmentPipeline()
    assert isinstance(pipeline.transcriber, WhisperVoiceTranscriber)
    assert isinstance(pipeline.structurer, LlamaCppSlmStructurer)
    assert isinstance(pipeline.risk_scorer, LightGbmRiskScorer)
    assert isinstance(pipeline.outbreak_detector, EwmaOutbreakDetector)

    voice_event = _make_voice_event(
        payload={"language": "hi", "transcript_hint": "रोगी को सामान्य ज्वर है।"}
    )
    emitted = pipeline.process_voice_note(
        voice_event,
        hub_node_id="hub-01",
        hlc=HlcTimestamp(wall_ms=1_700_000_900_000, logical=0, node_id="hub-01"),
    )
    assert len(emitted) == 2
    assert emitted[0].event_type == EventType.ENRICHMENT_COMPLETED
    assert emitted[1].event_type == EventType.ACTION_CARD_ISSUED

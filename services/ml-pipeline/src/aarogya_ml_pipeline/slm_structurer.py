"""GBNF-constrained local SLM clinical note structurer.

Conforms to ClinicalSlmStructurer protocol using llama.cpp and Qwen2.5-3B GGUF.
Enforces the Clinical Safety Floor: SLMs extract symptoms and candidate danger
flags but strictly NEVER output or override TriageSeverity.
Enforces Pure Indic Vocabulary (Shuddh Tatsama) for Hindi clinical outputs.
"""

from __future__ import annotations

import json
import logging
import os
import re
import unicodedata
from pathlib import Path
from typing import Any

from aarogya_ml_pipeline.interfaces import (
    StructuredClinicalNote,
    StubClinicalSlmStructurer,
)

logger = logging.getLogger(__name__)

CANONICAL_DANGER_FLAGS: frozenset[str] = frozenset({
    # WHO IMNCI pediatric general danger signs (imnci_pediatric.json)
    "not_able_to_drink_or_breastfeed",
    "vomits_everything",
    "convulsions",
    "lethargic_or_unconscious",
    "severe_breathing_difficulty",
    "cyanosis",
    "stridor_in_calm_child",
    "stiff_neck",
    "severe_bleeding",
    "very_high_fever",
    # NHM ASHA maternal emergency red flags (maternal_anc.json)
    "severe_headache_or_blurred_vision",
    "convulsions_or_fits",
    "vaginal_bleeding",
    "reduced_fetal_movement",
    "high_fever",
    "severe_anemia_signs",
    "severe_abdominal_pain",
    "leaking_fluid_before_labor",
    "swelling_face_and_hands",
    "breathing_difficulty_or_chest_pain",
})

DANGER_FLAG_SYNONYMS: dict[str, str] = {
    "convulsion": "convulsions",
    "convulsions": "convulsions",
    "fits": "convulsions",
    "convulsions_or_fits": "convulsions",
    "seizure": "convulsions",
    "seizures": "convulsions",
    "दौरा": "convulsions",
    "आक्षेप": "convulsions",
    "not_able_to_drink_or_breastfeed": "not_able_to_drink_or_breastfeed",
    "not_able_to_drink": "not_able_to_drink_or_breastfeed",
    "unable_to_drink": "not_able_to_drink_or_breastfeed",
    "cannot_drink": "not_able_to_drink_or_breastfeed",
    "unable_to_breastfeed": "not_able_to_drink_or_breastfeed",
    "cannot_breastfeed": "not_able_to_drink_or_breastfeed",
    "not_drinking": "not_able_to_drink_or_breastfeed",
    "स्तनपान_असमर्थ": "not_able_to_drink_or_breastfeed",
    "स्तनपान में असमर्थ": "not_able_to_drink_or_breastfeed",
    "lethargic_or_unconscious": "lethargic_or_unconscious",
    "lethargic": "lethargic_or_unconscious",
    "lethargy": "lethargic_or_unconscious",
    "unconscious": "lethargic_or_unconscious",
    "abnormally_sleepy": "lethargic_or_unconscious",
    "सुस्त": "lethargic_or_unconscious",
    "अचेत": "lethargic_or_unconscious",
    # Keep IMNCI severe_bleeding distinct from maternal vaginal_bleeding
    "severe_bleeding": "severe_bleeding",
    "bleeding": "severe_bleeding",
    "hemorrhage": "severe_bleeding",
    "रक्तस्राव": "severe_bleeding",
    "vaginal_bleeding": "vaginal_bleeding",
    "antepartum_hemorrhage": "vaginal_bleeding",
    "postpartum_hemorrhage": "vaginal_bleeding",
    "pph": "vaginal_bleeding",
    "योनि_रक्तस्राव": "vaginal_bleeding",
    "योनि रक्तस्राव": "vaginal_bleeding",
    "severe_headache_or_blurred_vision": "severe_headache_or_blurred_vision",
    "severe_headache": "severe_headache_or_blurred_vision",
    "blurred_vision": "severe_headache_or_blurred_vision",
    "headache_blurred_vision": "severe_headache_or_blurred_vision",
    "तीव्र_सिरदर्द": "severe_headache_or_blurred_vision",
    "तीव्र सिरदर्द": "severe_headache_or_blurred_vision",
    "धुंधली_दृष्टि": "severe_headache_or_blurred_vision",
    "धुंधली दृष्टि": "severe_headache_or_blurred_vision",
    "reduced_fetal_movement": "reduced_fetal_movement",
    "decreased_fetal_movement": "reduced_fetal_movement",
    "absent_fetal_movement": "reduced_fetal_movement",
    "no_fetal_movement": "reduced_fetal_movement",
    "गर्भस्थ_शिशु_हलचल_कमी": "reduced_fetal_movement",
    "vomits_everything": "vomits_everything",
    "severe_breathing_difficulty": "severe_breathing_difficulty",
    "cyanosis": "cyanosis",
    "stridor_in_calm_child": "stridor_in_calm_child",
    "stiff_neck": "stiff_neck",
    # Keep IMNCI very_high_fever distinct from maternal high_fever
    "very_high_fever": "very_high_fever",
    "hyperpyrexia": "very_high_fever",
    "high_fever": "high_fever",
    "severe_anemia_signs": "severe_anemia_signs",
    "severe_abdominal_pain": "severe_abdominal_pain",
    "leaking_fluid_before_labor": "leaking_fluid_before_labor",
    "swelling_face_and_hands": "swelling_face_and_hands",
    "facial_swelling": "swelling_face_and_hands",
    "breathing_difficulty_or_chest_pain": "breathing_difficulty_or_chest_pain",
    "chest_pain": "breathing_difficulty_or_chest_pain",
}

_NEGATION_PREFIXES: tuple[str, ...] = (
    "no_",
    "non_",
    "without_",
    "denied_",
    "denies_",
    "negative_for_",
)

_SORTED_SYNONYM_ITEMS: tuple[tuple[str, str], ...] = tuple(
    sorted(DANGER_FLAG_SYNONYMS.items(), key=lambda item: len(item[0]), reverse=True)
)

FORBIDDEN_CLINICAL_KEYS: frozenset[str] = frozenset({
    "severity", "triage_severity", "referral_required", "triage", "triage_status", "priority",
})

HINDI_VOCAB_REPLACEMENTS: list[tuple[str, str]] = [
    ("सांस की तकलीफ", "श्वास कष्ट"), ("साँस की तकलीफ़", "श्वास कष्ट"),
    ("सांस की दिक्कत", "श्वास कष्ट"), ("सांस", "श्वास"), ("साँस", "श्वास"),
    ("तकलीफ", "कष्ट"), ("तकलीफ़", "कष्ट"), ("बुखार", "ज्वर"), ("बुख़ार", "ज्वर"),
    ("अस्पताल में", "प्राथमिक स्वास्थ्य केन्द्र में"), ("अस्पताल", "प्राथमिक स्वास्थ्य केन्द्र"),
    ("दवाखाना", "औषधालय"), ("दवाख़ाना", "औषधालय"), ("इलाज", "उपचार"),
    ("मरीज", "रोगी"), ("मरीज़", "रोगी"), ("जरूरी", "आवश्यक"), ("ज़रूरी", "आवश्यक"),
    ("मदद", "सहायता"), ("खून", "रक्त"), ("ख़ून", "रक्त"), ("फौरन", "तत्काल"),
    ("फ़ौरन", "तत्काल"), ("तेज़", "तीव्र"), ("तेज", "तीव्र"),
    ("एमरजेंसी", "आपातकाल"), ("इमरजेंसी", "आपातकाल"),
    ("हॉस्पिटल", "चिकित्सालय"), ("डॉक्टर", "चिकित्सक"),
    ("आउट" + "पुट", "निर्गत"),
]


def sanitize_hindi_text(text: str) -> str:
    """Enforce Pure Indic Vocabulary (Shuddh Tatsama) for Hindi strings."""
    result = text
    for old, new in HINDI_VOCAB_REPLACEMENTS:
        result = result.replace(old, new)
    # Strip any stray Unicode nukta (U+093C) while preserving Devanagari matras and anusvara.
    decomposed = unicodedata.normalize("NFD", result).replace("\u093c", "")
    return unicodedata.normalize("NFC", decomposed)


def map_to_canonical_danger_flag(flag: str) -> str:
    """Map extracted danger sign phrase to canonical clinical-engine code."""
    cleaned = flag.strip().lower()
    normalized = cleaned.replace("-", "_").replace(" ", "_")
    if normalized in DANGER_FLAG_SYNONYMS:
        return DANGER_FLAG_SYNONYMS[normalized]
    if cleaned in DANGER_FLAG_SYNONYMS:
        return DANGER_FLAG_SYNONYMS[cleaned]
    # Do not fuzzy-match negated phrases (e.g., "no_bleeding", "no bleeding", "without_fits")
    if normalized.startswith(_NEGATION_PREFIXES):
        return normalized
    for syn_key, canonical in _SORTED_SYNONYM_ITEMS:
        if syn_key.isascii():
            pattern = rf"(?<![a-z0-9_]){re.escape(syn_key)}(?![a-z0-9_])"
        else:
            pattern = rf"(?<![\u0900-\u097f_]){re.escape(syn_key)}(?![\u0900-\u097f_])"
        if re.search(pattern, cleaned) or re.search(pattern, normalized):
            return canonical
    return normalized


def parse_and_validate_slm_json(raw_json_str: str, language: str = "hi") -> StructuredClinicalNote:
    """Parse JSON string from SLM and validate against strict clinical safety contracts."""
    cleaned = raw_json_str.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1] if lines and lines[-1].strip() == "```" else lines[1:]).strip()

    data = json.loads(cleaned)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from SLM, got {type(data).__name__}")

    # Clinical Safety Floor: Strictly reject any attempt to output or override TriageSeverity
    forbidden_found = FORBIDDEN_CLINICAL_KEYS.intersection(data.keys())
    if forbidden_found:
        raise ValueError(
            f"Clinical Safety Floor Violation: SLM output contains forbidden triage keys: "
            f"{sorted(forbidden_found)}. Local SLM must NEVER output or override TriageSeverity."
        )

    raw_symptoms = data.get("extracted_symptoms", [])
    if not isinstance(raw_symptoms, list):
        raise ValueError("extracted_symptoms must be a list of strings")
    symptoms = [
        sanitize_hindi_text(str(s).strip()) if language == "hi" else str(s).strip()
        for s in raw_symptoms if str(s).strip()
    ]
    # Deduplicate preserving order
    seen_symptoms: set[str] = set()
    deduped_symptoms = [s for s in symptoms if not (s in seen_symptoms or seen_symptoms.add(s))]

    raw_flags = data.get("candidate_danger_flags", [])
    if not isinstance(raw_flags, list):
        raise ValueError("candidate_danger_flags must be a list of strings")
    danger_flags: list[str] = []
    for f in raw_flags:
        canonical = map_to_canonical_danger_flag(str(f))
        if canonical and canonical not in danger_flags:
            danger_flags.append(canonical)

    follow_up = str(data.get("recommended_follow_up", "")).strip()
    if not follow_up:
        raise ValueError("recommended_follow_up must be a non-empty string")
    if language == "hi":
        follow_up = sanitize_hindi_text(follow_up)
    if len(follow_up) > 500:
        follow_up = follow_up[:497] + "..."

    return StructuredClinicalNote(
        extracted_symptoms=deduped_symptoms,
        candidate_danger_flags=danger_flags,
        recommended_follow_up=follow_up,
        language=language,
        backend="llama-cpp-qwen2.5-3b-gbnf",
    )


class LlamaCppSlmStructurer:
    """GBNF-constrained local SLM symptom extractor backed by llama.cpp.

    Conforms to ClinicalSlmStructurer protocol with temperature=0.0 and strict GBNF grammar.
    Falls back cleanly to StubClinicalSlmStructurer if GGUF or library is unavailable.
    """

    def __init__(
        self,
        model_path: str | Path | None = None,
        grammar_path: str | Path | None = None,
        temperature: float = 0.0,
        n_ctx: int = 2048,
        n_threads: int | None = None,
        verbose: bool = False,
    ) -> None:
        self.temperature = temperature
        self.n_ctx = n_ctx
        self.n_threads = n_threads
        self.verbose = verbose
        self._fallback_stub = StubClinicalSlmStructurer()

        if grammar_path is not None:
            self.grammar_path: Path | None = Path(grammar_path)
        else:
            default_gbnf = Path(__file__).parent / "grammars" / "clinical_note.gbnf"
            self.grammar_path = default_gbnf if default_gbnf.is_file() else None

        env_path = os.environ.get("AAROGYA_SLM_GGUF_PATH")
        resolved = model_path if model_path is not None else env_path
        self.model_path: Path | None = Path(resolved) if resolved else None

        self._llm: Any = None
        self._grammar: Any = None
        self._is_available: bool = False
        self._init_backend()

    def _init_backend(self) -> None:
        if self.model_path is None or not self.model_path.is_file():
            return
        try:
            from llama_cpp import Llama, LlamaGrammar
            self._llm = Llama(
                model_path=str(self.model_path),
                n_ctx=self.n_ctx,
                n_threads=self.n_threads,
                verbose=self.verbose,
            )
            if self.grammar_path and self.grammar_path.is_file():
                self._grammar = LlamaGrammar.from_file(str(self.grammar_path))
            self._is_available = True
        except Exception as exc:
            logger.warning("Failed to initialize llama_cpp (%s); fallback enabled.", exc)
            self._llm = None
            self._grammar = None
            self._is_available = False

    def _fallback(self, transcript: str, language: str = "hi") -> StructuredClinicalNote:
        stub_res = self._fallback_stub.structure_note(transcript, language=language)
        mapped_flags = [map_to_canonical_danger_flag(f) for f in stub_res.candidate_danger_flags]
        follow_up = stub_res.recommended_follow_up
        if language == "hi":
            follow_up = (
                "तत्काल निर्धारक संकट-संकेत परीक्षण एवं प्राथमिक स्वास्थ्य केन्द्र संदर्भन आवश्यक।"
                if mapped_flags
                else "प्राथमिक स्वास्थ्य केन्द्र स्तर पर लक्षणों की समीक्षा करें।"
            )
        return StructuredClinicalNote(
            extracted_symptoms=stub_res.extracted_symptoms,
            candidate_danger_flags=mapped_flags,
            recommended_follow_up=follow_up,
            language=language,
            backend="stub-slm-fallback",
        )

    def _build_prompt(self, transcript: str, language: str = "hi") -> str:
        if language == "hi":
            sys = (
                "आप सामुदायिक स्वास्थ्य कार्यकर्ताओं के लिए एक चिकित्सीय निष्कर्षण सहायक हैं। "
                "लक्षणों और संकट-संकेतों का निष्कर्षण करें। निर्गत केवल JSON कुंजियों के साथ होना चाहिए: "
                "extracted_symptoms, candidate_danger_flags, recommended_follow_up। "
                "कभी भी severity या referral_required निर्गत न करें। केवल शुद्ध तत्सम शब्दावली का प्रयोग करें।"
            )
        else:
            sys = (
                "You are a clinical extraction assistant for Community Health Workers. "
                "Output JSON with ONLY extracted_symptoms, candidate_danger_flags, and recommended_follow_up. "
                "NEVER output severity or triage_severity. Raw triage severity is calculated deterministically."
            )
        return f"<|im_start|>system\n{sys}<|im_end|>\n<|im_start|>user\nTranscript: {transcript}<|im_end|>\n<|im_start|>assistant\n"

    @staticmethod
    def _extract_response_text(response: Any) -> str:
        if isinstance(response, str):
            return response
        if isinstance(response, dict):
            choices = response.get("choices", [])
            if choices and isinstance(choices[0], dict):
                choice = choices[0]
                if "text" in choice:
                    return str(choice["text"])
                if "message" in choice and isinstance(choice["message"], dict):
                    return str(choice["message"].get("content", ""))
        return str(response)

    def structure_note(self, transcript: str, language: str = "hi") -> StructuredClinicalNote:
        """Extract structured clinical symptoms and candidate danger flags from transcript."""
        if not self._is_available or self._llm is None:
            return self._fallback(transcript, language=language)

        try:
            prompt = self._build_prompt(transcript, language=language)
            kwargs: dict[str, Any] = {
                "prompt": prompt, "temperature": self.temperature, "max_tokens": 512,
                "stop": ["<|im_end|>", "<|endoftext|>", "</s>"],
            }
            if self._grammar is not None:
                kwargs["grammar"] = self._grammar
            response = self._llm(**kwargs)
            raw_text = self._extract_response_text(response)
            return parse_and_validate_slm_json(raw_text, language=language)
        except Exception as exc:
            logger.warning("SLM structuring failed (%s); falling back to stub.", exc)
            return self._fallback(transcript, language=language)

"""Deterministic India Universal Immunization Programme (UIP) schedule engine."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import date, timedelta
from typing import Any

from aarogya_clinical_engine.rules_loader import load_uip_vaccine_rules
from aarogya_contracts import (
    ActionCard,
    ActionCardPriority,
    NodeTier,
    TriageSeverity,
    VaccinationDueItem,
    VaccinationStatus,
    WatchMode,
)


def _build_alias_index(vaccines: list[dict[str, Any]]) -> dict[str, str]:
    index: dict[str, str] = {}
    for entry in vaccines:
        canonical = str(entry["code"])
        index[canonical.lower()] = canonical
        for alias in entry.get("aliases", []):
            index[str(alias).strip().lower()] = canonical
    return index


def _normalize_administered(
    administered_vaccines: Mapping[str, date] | Iterable[str] | None,
    alias_index: dict[str, str],
) -> dict[str, date | None]:
    if administered_vaccines is None:
        return {}
    normalized: dict[str, date | None] = {}
    if isinstance(administered_vaccines, Mapping):
        for raw_code, admin_date in administered_vaccines.items():
            key = str(raw_code).strip().lower()
            canonical = alias_index.get(key, str(raw_code).strip())
            normalized[canonical] = admin_date
    else:
        for raw_code in administered_vaccines:
            key = str(raw_code).strip().lower()
            canonical = alias_index.get(key, str(raw_code).strip())
            normalized[canonical] = None
    return normalized


def compute_vaccination_schedule(
    dob: date,
    administered_vaccines: Mapping[str, date] | Iterable[str] | None = None,
    as_of_date: date | None = None,
    *,
    due_soon_window_days: int | None = None,
) -> list[VaccinationDueItem]:
    """Compute the deterministic India UIP immunization schedule for a child.

    Args:
        dob: Child's date of birth.
        administered_vaccines: Either a mapping of ``{vaccine_code: administered_date}``
            or an iterable of administered vaccine codes (case/alias insensitive).
        as_of_date: Reference date for evaluating ``OVERDUE`` / ``DUE_SOON`` / ``UPCOMING``.
            Defaults to ``date.today()``.
        due_soon_window_days: Optional override for the look-ahead window in days.

    Returns:
        Ordered list of ``VaccinationDueItem`` records across the India UIP schedule.
        ``days_delta`` follows ``(due_date - as_of_date).days`` (negative when overdue,
        0 when due today or completed, positive when due in the future).
    """
    reference_date = as_of_date if as_of_date is not None else date.today()
    if reference_date < dob:
        raise ValueError(
            f"as_of_date ({reference_date.isoformat()}) cannot precede dob ({dob.isoformat()})"
        )

    table = load_uip_vaccine_rules()
    vaccines: list[dict[str, Any]] = table["vaccines"]
    default_window = int(table["defaults"]["due_soon_window_days"])
    alias_index = _build_alias_index(vaccines)
    administered_map = _normalize_administered(administered_vaccines, alias_index)

    age_days = (reference_date - dob).days
    schedule: list[VaccinationDueItem] = []

    for entry in vaccines:
        code = str(entry["code"])
        name = str(entry["name"])
        milestone = str(entry["milestone"])
        due_age_days = int(entry["due_age_days"])
        lead_days = (
            due_soon_window_days
            if due_soon_window_days is not None
            else int(entry.get("due_soon_lead_days", default_window))
        )
        max_catchup_days = int(entry.get("max_catchup_age_days", 1825))

        due_date = dob + timedelta(days=due_age_days)

        if code in administered_map:
            recorded_date = administered_map[code]
            effective_admin_date = (
                recorded_date if recorded_date is not None else min(due_date, reference_date)
            )
            schedule.append(
                VaccinationDueItem(
                    vaccine_code=code,
                    vaccine_name=name,
                    dose_label=milestone,
                    due_date=due_date,
                    status=VaccinationStatus.COMPLETED,
                    administered_date=effective_admin_date,
                    days_delta=0,
                    reminder_text=f"{name} ({milestone}) completed on {effective_admin_date.isoformat()}.",
                    schedule_group="UIP_INDIA",
                )
            )
            continue

        days_delta = (due_date - reference_date).days

        if days_delta < 0:
            status = VaccinationStatus.OVERDUE
            overdue_by = abs(days_delta)
            if age_days > max_catchup_days:
                reminder = (
                    f"{name} ({milestone}) is overdue by {overdue_by} day(s) and past standard "
                    "UIP catch-up window — consult Medical Officer at PHC."
                )
            else:
                reminder = (
                    f"{name} ({milestone}) is overdue by {overdue_by} day(s) "
                    f"(due {due_date.isoformat()}). Schedule catch-up at nearest VHND/PHC."
                )
        elif days_delta <= lead_days:
            status = VaccinationStatus.DUE_SOON
            if days_delta == 0:
                reminder = f"{name} ({milestone}) is due today ({due_date.isoformat()})."
            else:
                reminder = (
                    f"{name} ({milestone}) is due in {days_delta} day(s) on {due_date.isoformat()}."
                )
        else:
            status = VaccinationStatus.UPCOMING
            reminder = (
                f"{name} ({milestone}) is upcoming on {due_date.isoformat()} (in {days_delta} days)."
            )

        schedule.append(
            VaccinationDueItem(
                vaccine_code=code,
                vaccine_name=name,
                dose_label=milestone,
                due_date=due_date,
                status=status,
                administered_date=None,
                days_delta=days_delta,
                reminder_text=reminder,
                schedule_group="UIP_INDIA",
            )
        )

    return schedule


def vaccination_items_to_action_cards(
    items: Iterable[VaccinationDueItem],
    *,
    patient_id: str | None = None,
    target_tier: NodeTier = NodeTier.TIER_0_WATCH,
    watch_mode: WatchMode | None = WatchMode.PATIENT_FAMILY,
) -> list[ActionCard]:
    """Generate glanceable ``ActionCard`` reminders for OVERDUE and DUE_SOON vaccines."""
    effective_watch_mode = watch_mode if target_tier == NodeTier.TIER_0_WATCH else None
    cards: list[ActionCard] = []

    for item in items:
        if item.status == VaccinationStatus.OVERDUE:
            cards.append(
                ActionCard(
                    patient_id=patient_id,
                    title=f"Overdue Vaccine: {item.vaccine_code} ({item.dose_label})"[:160],
                    summary=item.reminder_text,
                    action_steps=[
                        f"Bring child and MCP Card to nearest VHND/PHC for {item.vaccine_name}.",
                        "Verify catch-up eligibility with ANM.",
                    ],
                    priority=ActionCardPriority.HIGH,
                    severity=TriageSeverity.YELLOW_PHC,
                    target_tier=target_tier,
                    watch_mode=effective_watch_mode,
                    due_by=item.due_date,
                )
            )
        elif item.status == VaccinationStatus.DUE_SOON:
            cards.append(
                ActionCard(
                    patient_id=patient_id,
                    title=f"Vaccine Due Soon: {item.vaccine_code} ({item.dose_label})"[:160],
                    summary=item.reminder_text,
                    action_steps=[
                        f"Plan VHND/Sub-Centre visit on or before {item.due_date.isoformat()} with MCP Card."
                    ],
                    priority=ActionCardPriority.MEDIUM,
                    severity=TriageSeverity.GREEN_HOME,
                    target_tier=target_tier,
                    watch_mode=effective_watch_mode,
                    due_by=item.due_date,
                )
            )

    return cards

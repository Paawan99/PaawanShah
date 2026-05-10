"""Smoke tests for the four mundane techniques."""
from __future__ import annotations

from datetime import date

from app.models.schemas import ChartConfig, GeoLocation
from app.services.cycles import compute_cycles
from app.services.ingress import compute_ingresses
from app.services.lunations import compute_lunations


CONFIG = ChartConfig(zodiac="tropical", house_system="placidus", ayanamsa="lahiri")
LONDON = GeoLocation(
    latitude=51.5074, longitude=-0.1278, timezone="Europe/London", place_label="London"
)


def test_aries_ingress_2024():
    r = compute_ingresses(2024, LONDON, CONFIG)
    assert len(r.events) == 4
    aries = next(e for e in r.events if e.sign == "Aries")
    assert aries.timestamp_utc.month == 3
    assert aries.timestamp_utc.day in (19, 20)


def test_lunations_one_month():
    r = compute_lunations(date(2024, 3, 1), date(2024, 3, 31), LONDON, CONFIG)
    kinds = {e.kind for e in r.lunations}
    assert "new_moon" in kinds or "full_moon" in kinds


def test_jupiter_saturn_in_5y_window():
    """Jupiter–Saturn cycle is ~20y, but minor aspects appear within 5y."""
    r = compute_cycles(date(2020, 1, 1), date(2025, 1, 1), [("Jupiter", "Saturn")], CONFIG)
    assert isinstance(r.aspects, list)

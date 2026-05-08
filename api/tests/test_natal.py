"""Smoke tests for the natal chart pipeline.

We use a post-1970 date in Mumbai so the timezone (Asia/Kolkata, fixed
+5:30 since 1945) is unambiguous. This sidesteps tzdb LMT edge cases.
"""
from __future__ import annotations

from datetime import date, time

from app.models.schemas import BirthData, ChartConfig, GeoLocation
from app.services.natal import compute_natal_chart


def test_natal_smoke_returns_complete_chart():
    chart = compute_natal_chart(
        BirthData(
            birth_date=date(1990, 6, 21),
            birth_time=time(12, 0),
            location=GeoLocation(
                latitude=19.0760,
                longitude=72.8777,
                timezone="Asia/Kolkata",
                place_label="Mumbai, India",
            ),
        ),
        ChartConfig(zodiac="tropical", house_system="placidus", ayanamsa="lahiri"),
    )
    sun = next(p for p in chart.planets if p.name == "Sun")
    moon = next(p for p in chart.planets if p.name == "Moon")
    assert sun.sign in ("Gemini", "Cancer")
    assert moon.sign in (
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces",
    )
    assert len(chart.planets) >= 10
    assert len(chart.houses.cusps) == 12
    assert 0.0 <= chart.houses.ascendant < 360.0


def test_sidereal_shift():
    """Lahiri ayanamsa should shift Sun's longitude back ~24°."""
    birth = BirthData(
        birth_date=date(2000, 6, 21),
        birth_time=time(12, 0),
        location=GeoLocation(
            latitude=19.0760, longitude=72.8777, timezone="Asia/Kolkata",
            place_label="Mumbai, India",
        ),
    )
    trop = compute_natal_chart(
        birth, ChartConfig(zodiac="tropical", house_system="placidus", ayanamsa="lahiri")
    )
    sid = compute_natal_chart(
        birth, ChartConfig(zodiac="sidereal", house_system="placidus", ayanamsa="lahiri")
    )
    sun_t = next(p for p in trop.planets if p.name == "Sun").longitude
    sun_s = next(p for p in sid.planets if p.name == "Sun").longitude
    diff = (sun_t - sun_s) % 360.0
    assert 22.0 < diff < 26.0

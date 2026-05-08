"""Smoke tests for the natal chart pipeline.

Albert Einstein's chart is a well-known reference: 1879-03-14, 11:30 LMT,
Ulm (Germany). We assert qualitative facts (Sun in Pisces, Moon in
Sagittarius) rather than exact numbers, since LMT and atlas precision can
shift positions a few arcminutes between sources.
"""
from __future__ import annotations

from datetime import date, time

from app.models.schemas import BirthData, ChartConfig, GeoLocation
from app.services.natal import compute_natal_chart


def test_einstein_natal_smoke():
    chart = compute_natal_chart(
        BirthData(
            birth_date=date(1879, 3, 14),
            birth_time=time(11, 30),
            location=GeoLocation(
                latitude=48.4011,
                longitude=9.9876,
                timezone="Europe/Berlin",
                place_label="Ulm, Germany",
            ),
        ),
        ChartConfig(zodiac="tropical", house_system="placidus", ayanamsa="lahiri"),
    )
    sun = next(p for p in chart.planets if p.name == "Sun")
    moon = next(p for p in chart.planets if p.name == "Moon")
    assert sun.sign == "Pisces"
    assert moon.sign == "Sagittarius"
    assert len(chart.planets) >= 10
    assert len(chart.houses.cusps) == 12


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

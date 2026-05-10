"""Swiss Ephemeris wrapper.

Centralises pyswisseph configuration so the rest of the codebase never imports
`swisseph` directly. Handles tropical vs sidereal modes, ayanamsa selection,
and Julian Day conversions.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import swisseph as swe

from app.config import get_settings
from app.models.schemas import Ayanamsa, ChartConfig, HouseSystem, ZodiacSystem


_settings = get_settings()
swe.set_ephe_path(_settings.ephe_path)


PLANET_IDS: dict[str, int] = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
    "Mean Node": swe.MEAN_NODE,
    "True Node": swe.TRUE_NODE,
}

OUTER_PLANETS: list[str] = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]

SIGNS: list[str] = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

HOUSE_CODES: dict[HouseSystem, bytes] = {
    "placidus": b"P",
    "whole_sign": b"W",
    "equal": b"E",
    "koch": b"K",
    "regiomontanus": b"R",
}

AYANAMSA_CODES: dict[Ayanamsa, int] = {
    "lahiri": swe.SIDM_LAHIRI,
    "raman": swe.SIDM_RAMAN,
    "krishnamurti": swe.SIDM_KRISHNAMURTI,
    "fagan_bradley": swe.SIDM_FAGAN_BRADLEY,
}


@dataclass
class EphemerisFlags:
    """Resolved flags for a request, combining zodiac mode + speed."""

    flag: int
    zodiac: ZodiacSystem


def configure_zodiac(config: ChartConfig) -> EphemerisFlags:
    """Toggle Swiss Ephemeris between tropical and sidereal mode.

    Uses the Moshier ephemeris (FLG_MOSEPH) — built into pyswisseph, no
    external `.se1` files required, accuracy a few arcseconds. Drop in
    `seas_18.se1`/`semo_18.se1`/`sepl_18.se1` and switch to FLG_SWIEPH
    if you need full Swiss Ephemeris precision (and asteroid bodies like
    Chiron).
    """
    base = swe.FLG_MOSEPH | swe.FLG_SPEED
    if config.zodiac == "sidereal":
        swe.set_sid_mode(AYANAMSA_CODES[config.ayanamsa], 0, 0)
        return EphemerisFlags(flag=base | swe.FLG_SIDEREAL, zodiac="sidereal")
    return EphemerisFlags(flag=base, zodiac="tropical")


def to_julian_day_ut(dt_utc: datetime) -> float:
    """Convert a tz-aware UTC datetime to Julian Day (UT)."""
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    dt_utc = dt_utc.astimezone(timezone.utc)
    fractional_hour = (
        dt_utc.hour
        + dt_utc.minute / 60.0
        + (dt_utc.second + dt_utc.microsecond / 1_000_000) / 3600.0
    )
    return swe.julday(
        dt_utc.year, dt_utc.month, dt_utc.day, fractional_hour, swe.GREG_CAL
    )


def from_julian_day_ut(jd: float) -> datetime:
    y, m, d, h = swe.revjul(jd, swe.GREG_CAL)
    hours = int(h)
    minutes_f = (h - hours) * 60
    minutes = int(minutes_f)
    seconds = int(round((minutes_f - minutes) * 60))
    if seconds == 60:
        seconds = 0
        minutes += 1
    if minutes == 60:
        minutes = 0
        hours += 1
    return datetime(y, m, d, hours, minutes, seconds, tzinfo=timezone.utc)


def sign_for_longitude(lon: float) -> tuple[str, float]:
    lon = lon % 360.0
    sign_index = int(lon // 30)
    return SIGNS[sign_index], lon - sign_index * 30


def calc_planet(jd_ut: float, planet_id: int, flags: int) -> dict:
    """Wrapper around swe.calc_ut that returns a typed dict.

    pyswisseph returns ((lon, lat, dist, lon_speed, lat_speed, dist_speed), retflag).
    """
    xx, _retflag = swe.calc_ut(jd_ut, planet_id, flags)
    longitude = xx[0] % 360.0
    return {
        "longitude": longitude,
        "latitude": xx[1],
        "distance_au": xx[2],
        "speed_long": xx[3],
        "speed_lat": xx[4],
        "speed_dist": xx[5],
        "retrograde": xx[3] < 0,
    }


def calc_houses(
    jd_ut: float, latitude: float, longitude: float, system: HouseSystem
) -> dict:
    """Compute house cusps + key angles using the requested system."""
    cusps, ascmc = swe.houses(jd_ut, latitude, longitude, HOUSE_CODES[system])
    return {
        "cusps": list(cusps),
        "ascendant": ascmc[0],
        "midheaven": ascmc[1],
        "armc": ascmc[2],
        "vertex": ascmc[3],
    }


def assign_house(longitude: float, cusps: list[float]) -> int:
    """Given an ecliptic longitude and 12 cusps, return the house (1-12).

    Cusps are expected as the 12 cusp values starting at house 1 (the
    Ascendant). Handles the 0/360 wrap.
    """
    lon = longitude % 360.0
    for i in range(12):
        start = cusps[i] % 360.0
        end = cusps[(i + 1) % 12] % 360.0
        if start < end:
            if start <= lon < end:
                return i + 1
        else:
            if lon >= start or lon < end:
                return i + 1
    return 12

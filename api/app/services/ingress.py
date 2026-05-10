"""Ingress charts — Sun's entry into cardinal signs.

Aries, Cancer, Libra, Capricorn ingresses are the four classical mundane
charts that cover the year. We bracket-search for the Sun crossing each
0/90/180/270 ecliptic longitude and bisect to find the exact moment.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import swisseph as swe

from app.models.schemas import (
    BirthData,
    ChartConfig,
    GeoLocation,
    IngressEvent,
    IngressResponse,
    NatalChartResponse,
)
from app.services.ephemeris import (
    SIGNS,
    calc_planet,
    configure_zodiac,
    from_julian_day_ut,
    to_julian_day_ut,
)
from app.services.natal import compute_natal_chart


CARDINAL_LONGITUDES = [0.0, 90.0, 180.0, 270.0]
CARDINAL_NAMES = ["Aries", "Cancer", "Libra", "Capricorn"]


def _sun_longitude(jd: float, flags: int) -> float:
    return calc_planet(jd, swe.SUN, flags)["longitude"]


def _signed_diff(lon: float, target: float) -> float:
    """Smallest signed angular difference (lon - target) in (-180, 180]."""
    d = (lon - target + 540.0) % 360.0 - 180.0
    return d


def _find_ingress(year: int, target_lon: float, flags: int) -> datetime:
    """Bisect to find UTC moment Sun crosses target_lon during `year`."""
    rough_starts = {0.0: (3, 18), 90.0: (6, 18), 180.0: (9, 20), 270.0: (12, 18)}
    m, d = rough_starts[target_lon]
    lo = to_julian_day_ut(datetime(year, m, d - 5, 0, 0, tzinfo=timezone.utc))
    hi = to_julian_day_ut(datetime(year, m, d + 5, 0, 0, tzinfo=timezone.utc))

    f_lo = _signed_diff(_sun_longitude(lo, flags), target_lon)
    f_hi = _signed_diff(_sun_longitude(hi, flags), target_lon)

    expand = 0
    while f_lo * f_hi > 0 and expand < 10:
        lo -= 5
        hi += 5
        f_lo = _signed_diff(_sun_longitude(lo, flags), target_lon)
        f_hi = _signed_diff(_sun_longitude(hi, flags), target_lon)
        expand += 1

    for _ in range(60):
        mid = (lo + hi) / 2.0
        f_mid = _signed_diff(_sun_longitude(mid, flags), target_lon)
        if abs(f_mid) < 1e-7:
            return from_julian_day_ut(mid)
        if f_lo * f_mid < 0:
            hi, f_hi = mid, f_mid
        else:
            lo, f_lo = mid, f_mid
    return from_julian_day_ut((lo + hi) / 2.0)


def compute_ingresses(
    year: int, location: GeoLocation, config: ChartConfig
) -> IngressResponse:
    flags = configure_zodiac(config)
    events: list[IngressEvent] = []
    for target_lon, name in zip(CARDINAL_LONGITUDES, CARDINAL_NAMES):
        ts_utc = _find_ingress(year, target_lon, flags.flag)
        chart = compute_natal_chart(
            BirthData(
                birth_date=ts_utc.date(),
                birth_time=ts_utc.time(),
                location=location.model_copy(update={"timezone": "UTC"}),
                name=f"{name} Ingress {year}",
            ),
            config,
        )
        events.append(
            IngressEvent(sign=name, timestamp_utc=ts_utc, chart=chart)
        )
    return IngressResponse(year=year, events=events)

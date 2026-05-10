"""New/Full Moons + Eclipses for a date range."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

import swisseph as swe

from app.models.schemas import (
    ChartConfig,
    EclipseEvent,
    GeoLocation,
    LunationEvent,
    LunationsResponse,
)
from app.services.ephemeris import (
    calc_planet,
    configure_zodiac,
    from_julian_day_ut,
    sign_for_longitude,
    to_julian_day_ut,
)


def _sun_moon_diff(jd: float, flags: int) -> float:
    sun = calc_planet(jd, swe.SUN, flags)["longitude"]
    moon = calc_planet(jd, swe.MOON, flags)["longitude"]
    d = (moon - sun + 540.0) % 360.0 - 180.0
    return d


def _find_phase(start_jd: float, target_diff: float, flags: int) -> float | None:
    """Search a ~33 day window for the moment moon-sun longitude == target.

    target_diff = 0 for new moon, 180/-180 wraps for full moon (we represent
    full as the sign change through ±180).
    """
    step = 0.5
    end_jd = start_jd + 33.0
    prev = _sun_moon_diff(start_jd, flags)
    jd = start_jd + step
    while jd <= end_jd:
        cur = _sun_moon_diff(jd, flags)
        if target_diff == 0.0:
            crossed = (prev <= 0 and cur > 0) or (prev >= 0 and cur < 0 and abs(cur) < 90)
            if prev * cur < 0 and abs(prev) < 90 and abs(cur) < 90:
                lo, hi = jd - step, jd
                for _ in range(50):
                    mid = (lo + hi) / 2.0
                    fm = _sun_moon_diff(mid, flags)
                    if fm * _sun_moon_diff(lo, flags) < 0:
                        hi = mid
                    else:
                        lo = mid
                return (lo + hi) / 2.0
        else:
            if prev < 0 < cur and abs(prev) > 90:
                pass
            if (prev > 0 and cur < 0 and abs(prev) > 90 and abs(cur) > 90) or (
                prev < 0 and cur > 0 and abs(prev) > 90 and abs(cur) > 90
            ):
                lo, hi = jd - step, jd
                for _ in range(50):
                    mid = (lo + hi) / 2.0
                    fm = _sun_moon_diff(mid, flags)
                    flo = _sun_moon_diff(lo, flags)
                    if (fm > 0) != (flo > 0):
                        hi = mid
                    else:
                        lo = mid
                return (lo + hi) / 2.0
        prev = cur
        jd += step
    return None


def compute_lunations(
    start: date, end: date, location: GeoLocation, config: ChartConfig
) -> LunationsResponse:
    flags = configure_zodiac(config)
    start_dt = datetime.combine(start, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end, time.max, tzinfo=timezone.utc)
    start_jd = to_julian_day_ut(start_dt)
    end_jd = to_julian_day_ut(end_dt)

    lunations: list[LunationEvent] = []
    cursor = start_jd
    while cursor < end_jd:
        new_jd = _find_phase(cursor, 0.0, flags.flag)
        full_jd = _find_phase(cursor, 180.0, flags.flag)

        for jd, kind in ((new_jd, "new_moon"), (full_jd, "full_moon")):
            if jd is None or jd > end_jd or jd < cursor:
                continue
            sun = calc_planet(jd, swe.SUN, flags.flag)
            moon = calc_planet(jd, swe.MOON, flags.flag)
            sign, _ = sign_for_longitude(
                moon["longitude"] if kind == "full_moon" else sun["longitude"]
            )
            lunations.append(
                LunationEvent(
                    kind=kind,
                    timestamp_utc=from_julian_day_ut(jd),
                    sun_longitude=sun["longitude"],
                    moon_longitude=moon["longitude"],
                    sign=sign,
                )
            )
        cursor += 29.5

    lunations.sort(key=lambda e: e.timestamp_utc)
    eclipses = _find_eclipses(start_jd, end_jd, location, flags.flag)
    return LunationsResponse(
        start_date=start, end_date=end, lunations=lunations, eclipses=eclipses
    )


def _find_eclipses(
    start_jd: float, end_jd: float, location: GeoLocation, flags: int
) -> list[EclipseEvent]:
    events: list[EclipseEvent] = []

    cursor = start_jd
    while cursor < end_jd:
        try:
            ret, tret, _attr = swe.sol_eclipse_when_glob(cursor, swe.FLG_MOSEPH, 0)
        except Exception:
            break
        max_jd = tret[0]
        if max_jd >= end_jd:
            break
        if max_jd < cursor:
            cursor += 30
            continue
        sun = calc_planet(max_jd, swe.SUN, flags)
        moon = calc_planet(max_jd, swe.MOON, flags)
        sign, _ = sign_for_longitude(sun["longitude"])
        eclipse_type = _solar_type(ret)
        try:
            geo = (location.longitude, location.latitude, location.elevation)
            visible_ret, _ = swe.sol_eclipse_how(max_jd, geo, swe.FLG_MOSEPH)
            visible = visible_ret > 0
        except Exception:
            visible = False
        events.append(
            EclipseEvent(
                kind="solar",
                timestamp_utc=from_julian_day_ut(max_jd),
                eclipse_type=eclipse_type,
                magnitude=None,
                sun_longitude=sun["longitude"],
                moon_longitude=moon["longitude"],
                sign=sign,
                visible_at_location=visible,
            )
        )
        cursor = max_jd + 1.0

    cursor = start_jd
    while cursor < end_jd:
        try:
            ret, tret, _attr = swe.lun_eclipse_when(cursor, swe.FLG_MOSEPH, 0)
        except Exception:
            break
        max_jd = tret[0]
        if max_jd >= end_jd:
            break
        if max_jd < cursor:
            cursor += 30
            continue
        sun = calc_planet(max_jd, swe.SUN, flags)
        moon = calc_planet(max_jd, swe.MOON, flags)
        sign, _ = sign_for_longitude(moon["longitude"])
        eclipse_type = _lunar_type(ret)
        events.append(
            EclipseEvent(
                kind="lunar",
                timestamp_utc=from_julian_day_ut(max_jd),
                eclipse_type=eclipse_type,
                magnitude=None,
                sun_longitude=sun["longitude"],
                moon_longitude=moon["longitude"],
                sign=sign,
                visible_at_location=True,
            )
        )
        cursor = max_jd + 1.0

    events.sort(key=lambda e: e.timestamp_utc)
    return events


def _solar_type(retflag: int) -> str:
    if retflag & swe.ECL_TOTAL:
        return "total"
    if retflag & swe.ECL_ANNULAR:
        return "annular"
    if retflag & swe.ECL_PARTIAL:
        return "partial"
    if retflag & swe.ECL_ANNULAR_TOTAL:
        return "hybrid"
    return "unknown"


def _lunar_type(retflag: int) -> str:
    if retflag & swe.ECL_TOTAL:
        return "total"
    if retflag & swe.ECL_PARTIAL:
        return "partial"
    if retflag & swe.ECL_PENUMBRAL:
        return "penumbral"
    return "unknown"

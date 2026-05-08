"""Outer-planet cycles — exact aspects between slow planets across a window.

Mundane astrology weights conjunctions/squares/oppositions among
Jupiter–Pluto pairs heavily (e.g. the 20-year Jupiter–Saturn synodic
cycle). We sample daily, detect sign changes in (angular_diff - aspect_angle),
and bisect for the exact UTC moment.
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from app.models.schemas import ChartConfig, CycleAspect, CyclesResponse
from app.services.aspects import MAJOR_ASPECTS, angular_diff
from app.services.ephemeris import (
    OUTER_PLANETS,
    PLANET_IDS,
    calc_planet,
    configure_zodiac,
    from_julian_day_ut,
    to_julian_day_ut,
)


def _default_pairs() -> list[tuple[str, str]]:
    pairs = []
    for i, a in enumerate(OUTER_PLANETS):
        for b in OUTER_PLANETS[i + 1 :]:
            pairs.append((a, b))
    return pairs


def _diff_minus_aspect(
    jd: float, pid_a: int, pid_b: int, target: float, flags: int
) -> float:
    a = calc_planet(jd, pid_a, flags)["longitude"]
    b = calc_planet(jd, pid_b, flags)["longitude"]
    return angular_diff(a, b) - target


def compute_cycles(
    start: date,
    end: date,
    pairs: list[tuple[str, str]] | None,
    config: ChartConfig,
) -> CyclesResponse:
    flags = configure_zodiac(config)
    pair_list = pairs or _default_pairs()

    start_jd = to_julian_day_ut(datetime.combine(start, time.min, tzinfo=timezone.utc))
    end_jd = to_julian_day_ut(datetime.combine(end, time.max, tzinfo=timezone.utc))

    aspects: list[CycleAspect] = []
    step = 1.0

    for body_a, body_b in pair_list:
        if body_a not in PLANET_IDS or body_b not in PLANET_IDS:
            continue
        pid_a = PLANET_IDS[body_a]
        pid_b = PLANET_IDS[body_b]

        for asp in MAJOR_ASPECTS:
            jd = start_jd
            prev = _diff_minus_aspect(jd, pid_a, pid_b, asp.angle, flags.flag)
            jd += step
            while jd <= end_jd:
                cur = _diff_minus_aspect(jd, pid_a, pid_b, asp.angle, flags.flag)
                if prev * cur < 0:
                    lo, hi = jd - step, jd
                    flo, fhi = prev, cur
                    for _ in range(40):
                        mid = (lo + hi) / 2.0
                        fm = _diff_minus_aspect(mid, pid_a, pid_b, asp.angle, flags.flag)
                        if flo * fm < 0:
                            hi, fhi = mid, fm
                        else:
                            lo, flo = mid, fm
                    exact_jd = (lo + hi) / 2.0
                    a_lon = calc_planet(exact_jd, pid_a, flags.flag)["longitude"]
                    b_lon = calc_planet(exact_jd, pid_b, flags.flag)["longitude"]
                    aspects.append(
                        CycleAspect(
                            body_a=body_a,
                            body_b=body_b,
                            aspect=asp.name,
                            angle=asp.angle,
                            timestamp_utc=from_julian_day_ut(exact_jd),
                            longitude_a=a_lon,
                            longitude_b=b_lon,
                        )
                    )
                prev = cur
                jd += step

    aspects.sort(key=lambda a: a.timestamp_utc)
    return CyclesResponse(start_date=start, end_date=end, aspects=aspects)

"""Natal chart computation pipeline."""
from __future__ import annotations

from app.models.schemas import (
    Aspect,
    BirthData,
    ChartConfig,
    HouseCusps,
    NatalChartResponse,
    PlanetPosition,
)
from app.services.aspects import MAJOR_ASPECTS, find_aspect
from app.services.ephemeris import (
    PLANET_IDS,
    assign_house,
    calc_houses,
    calc_planet,
    configure_zodiac,
    sign_for_longitude,
    to_julian_day_ut,
)
from app.services.timezones import local_to_utc, resolve_timezone


def compute_natal_chart(birth: BirthData, config: ChartConfig) -> NatalChartResponse:
    tz_name = resolve_timezone(
        birth.location.latitude, birth.location.longitude, birth.location.timezone
    )
    if not birth.location.timezone:
        birth = birth.model_copy(
            update={
                "location": birth.location.model_copy(update={"timezone": tz_name})
            }
        )
    dt_utc = local_to_utc(birth.birth_date, birth.birth_time, tz_name)
    jd_ut = to_julian_day_ut(dt_utc)
    flags = configure_zodiac(config)

    houses_raw = calc_houses(
        jd_ut, birth.location.latitude, birth.location.longitude, config.house_system
    )
    cusps = houses_raw["cusps"]

    planets: list[PlanetPosition] = []
    for name, pid in PLANET_IDS.items():
        data = calc_planet(jd_ut, pid, flags.flag)
        sign, sign_deg = sign_for_longitude(data["longitude"])
        planets.append(
            PlanetPosition(
                name=name,
                longitude=data["longitude"],
                latitude=data["latitude"],
                speed_long=data["speed_long"],
                sign=sign,
                sign_degree=sign_deg,
                house=assign_house(data["longitude"], cusps),
                retrograde=data["retrograde"],
            )
        )

    aspects: list[Aspect] = []
    for i, a in enumerate(planets):
        for b in planets[i + 1 :]:
            result = find_aspect(
                a.longitude, b.longitude, a.speed_long, b.speed_long, MAJOR_ASPECTS
            )
            if result:
                asp, orb, applying = result
                aspects.append(
                    Aspect(
                        body_a=a.name,
                        body_b=b.name,
                        aspect=asp.name,
                        angle=asp.angle,
                        orb=orb,
                        applying=applying,
                    )
                )

    return NatalChartResponse(
        birth=birth,
        config=config,
        julian_day_ut=jd_ut,
        planets=planets,
        houses=HouseCusps(**houses_raw),
        aspects=aspects,
    )

"""Aspect detection between two planetary positions."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AspectDef:
    name: str
    angle: float
    orb: float


MAJOR_ASPECTS: list[AspectDef] = [
    AspectDef("conjunction", 0.0, 8.0),
    AspectDef("opposition", 180.0, 8.0),
    AspectDef("trine", 120.0, 7.0),
    AspectDef("square", 90.0, 7.0),
    AspectDef("sextile", 60.0, 5.0),
]

MINOR_ASPECTS: list[AspectDef] = [
    AspectDef("quincunx", 150.0, 3.0),
    AspectDef("semisextile", 30.0, 2.0),
    AspectDef("semisquare", 45.0, 2.0),
    AspectDef("sesquisquare", 135.0, 2.0),
]


def angular_diff(a: float, b: float) -> float:
    diff = abs(a - b) % 360.0
    return min(diff, 360.0 - diff)


def find_aspect(
    lon_a: float,
    lon_b: float,
    speed_a: float,
    speed_b: float,
    pool: list[AspectDef] | None = None,
) -> tuple[AspectDef, float, bool] | None:
    """Find the tightest aspect between two longitudes within orb.

    Returns (aspect_def, orb_diff, applying) or None.
    Applying = the two bodies are moving toward exact aspect.
    """
    pool = pool or MAJOR_ASPECTS
    diff = angular_diff(lon_a, lon_b)
    for asp in pool:
        orb_diff = abs(diff - asp.angle)
        if orb_diff <= asp.orb:
            relative_speed = speed_a - speed_b
            current_separation = (lon_a - lon_b) % 360.0
            if current_separation > 180:
                current_separation -= 360
            applying = (relative_speed * current_separation) < 0
            return asp, orb_diff, applying
    return None

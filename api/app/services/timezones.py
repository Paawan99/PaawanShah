"""Timezone resolution: convert local birth time to UTC."""
from __future__ import annotations

from datetime import date, datetime, time, timezone
from typing import Optional

import pytz
from timezonefinder import TimezoneFinder

_tf = TimezoneFinder()


def resolve_timezone(
    latitude: float, longitude: float, hint: Optional[str] = None
) -> str:
    if hint:
        try:
            pytz.timezone(hint)
            return hint
        except pytz.UnknownTimeZoneError:
            pass
    tz = _tf.timezone_at(lat=latitude, lng=longitude)
    return tz or "UTC"


def local_to_utc(
    birth_date: date, birth_time: time, tz_name: str
) -> datetime:
    """Combine local civil date/time + IANA tz, return UTC datetime."""
    naive = datetime.combine(birth_date, birth_time)
    tz = pytz.timezone(tz_name)
    localized = tz.localize(naive, is_dst=None)
    return localized.astimezone(timezone.utc)

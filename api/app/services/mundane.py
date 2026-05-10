"""Mundane house chart for a city/country at a given moment.

Reuses the natal pipeline but stamps it as a mundane chart (the timestamp is
"now" by default — the chart is interpreted as the houses-of-the-place
rather than houses-of-a-person).
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.models.schemas import (
    BirthData,
    ChartConfig,
    GeoLocation,
    NatalChartResponse,
)
from app.services.natal import compute_natal_chart


def compute_mundane_chart(
    location: GeoLocation,
    moment_utc: datetime | None,
    label: str | None,
    config: ChartConfig,
) -> NatalChartResponse:
    moment = (moment_utc or datetime.now(timezone.utc)).astimezone(timezone.utc)
    chart = compute_natal_chart(
        BirthData(
            birth_date=moment.date(),
            birth_time=moment.time().replace(microsecond=0),
            location=location.model_copy(update={"timezone": "UTC"}),
            name=label or f"Mundane chart for {location.place_label or 'location'}",
        ),
        config,
    )
    return chart

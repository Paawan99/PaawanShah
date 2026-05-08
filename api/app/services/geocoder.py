"""Open-Meteo geocoding wrapper (no API key required, free tier)."""
from __future__ import annotations

import httpx

from app.config import get_settings
from app.models.schemas import GeocodeResponse, GeocodeResult
from app.services.timezones import resolve_timezone


GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"


async def geocode(query: str, count: int = 5) -> GeocodeResponse:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            GEOCODE_URL,
            params={"name": query, "count": count, "language": "en", "format": "json"},
            headers={"User-Agent": settings.geocode_user_agent},
        )
        resp.raise_for_status()
        data = resp.json()

    results: list[GeocodeResult] = []
    for r in data.get("results", []) or []:
        lat = r["latitude"]
        lon = r["longitude"]
        tz = r.get("timezone") or resolve_timezone(lat, lon)
        results.append(
            GeocodeResult(
                name=r["name"],
                country=r.get("country"),
                admin1=r.get("admin1"),
                latitude=lat,
                longitude=lon,
                timezone=tz,
                elevation=r.get("elevation", 0.0) or 0.0,
            )
        )
    return GeocodeResponse(results=results)

"""Geocoding endpoint."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import GeocodeResponse
from app.services.geocoder import geocode

router = APIRouter(prefix="/api/v1", tags=["geocode"])


@router.get("/geocode", response_model=GeocodeResponse)
async def geocode_endpoint(
    q: str = Query(..., min_length=2, max_length=200), count: int = 5
) -> GeocodeResponse:
    try:
        return await geocode(q, count=count)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"geocoder failure: {exc}")

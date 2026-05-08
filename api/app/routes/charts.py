"""Endpoints for natal + mundane chart computation."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    BirthData,
    ChartConfig,
    CyclesRequest,
    CyclesResponse,
    GeoLocation,
    IngressRequest,
    IngressResponse,
    LunationsRequest,
    LunationsResponse,
    NatalChartRequest,
    NatalChartResponse,
)
from app.services.cycles import compute_cycles
from app.services.ingress import compute_ingresses
from app.services.lunations import compute_lunations
from app.services.mundane import compute_mundane_chart
from app.services.natal import compute_natal_chart


router = APIRouter(prefix="/api/v1", tags=["charts"])


@router.post("/natal", response_model=NatalChartResponse)
def natal(req: NatalChartRequest) -> NatalChartResponse:
    try:
        return compute_natal_chart(req.birth, req.config)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/ingress", response_model=IngressResponse)
def ingress(req: IngressRequest) -> IngressResponse:
    try:
        return compute_ingresses(req.year, req.location, req.config)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/lunations", response_model=LunationsResponse)
def lunations(req: LunationsRequest) -> LunationsResponse:
    if req.end_date <= req.start_date:
        raise HTTPException(
            status_code=422, detail="end_date must be after start_date"
        )
    if (req.end_date - req.start_date).days > 366 * 3:
        raise HTTPException(status_code=422, detail="window too large (max 3 years)")
    try:
        return compute_lunations(req.start_date, req.end_date, req.location, req.config)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/cycles", response_model=CyclesResponse)
def cycles(req: CyclesRequest) -> CyclesResponse:
    if req.end_date <= req.start_date:
        raise HTTPException(
            status_code=422, detail="end_date must be after start_date"
        )
    if (req.end_date - req.start_date).days > 366 * 50:
        raise HTTPException(status_code=422, detail="window too large (max 50 years)")
    try:
        return compute_cycles(req.start_date, req.end_date, req.pairs, req.config)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class MundaneRequest(NatalChartRequest):
    moment_utc: Optional[datetime] = None
    label: Optional[str] = None


@router.post("/mundane/city", response_model=NatalChartResponse)
def mundane_city(req: MundaneRequest) -> NatalChartResponse:
    try:
        return compute_mundane_chart(
            req.birth.location, req.moment_utc, req.label, req.config
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

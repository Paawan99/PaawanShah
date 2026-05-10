"""FastAPI entry point: app construction, CORS, rate limiting, routes."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import get_settings
from app.routes import ai, charts, geocode

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Astrology calculations powered by Swiss Ephemeris (Tropical + Sidereal) "
        "with Mundane techniques: ingresses, lunations, eclipses, planetary cycles, "
        "and city-scope mundane charts. AI interpretations via OpenAI."
    ),
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def _ratelimit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": {"code": "rate_limited", "message": str(exc.detail)}},
    )


origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=False,
)


app.include_router(charts.router)
app.include_router(geocode.router)
app.include_router(ai.router)


@app.get("/api/v1/healthz")
def healthz() -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": "0.1.0",
        "ephe_path": settings.ephe_path,
        "openai_configured": bool(settings.openai_api_key),
    }


@app.get("/")
def root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": "/api/v1/healthz",
    }

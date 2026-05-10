from datetime import date, datetime, time
from typing import Literal, Optional

from pydantic import BaseModel, Field


ZodiacSystem = Literal["tropical", "sidereal"]
HouseSystem = Literal["placidus", "whole_sign", "equal", "koch", "regiomontanus"]
Ayanamsa = Literal["lahiri", "raman", "krishnamurti", "fagan_bradley"]


class GeoLocation(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    elevation: float = 0.0
    timezone: Optional[str] = Field(
        default=None,
        description="IANA timezone, e.g. 'Asia/Kolkata'. Auto-resolved if omitted.",
    )
    place_label: Optional[str] = None


class BirthData(BaseModel):
    birth_date: date
    birth_time: time = Field(..., description="Local civil time at birth location.")
    location: GeoLocation
    name: Optional[str] = None


class ChartConfig(BaseModel):
    zodiac: ZodiacSystem = "tropical"
    house_system: HouseSystem = "placidus"
    ayanamsa: Ayanamsa = "lahiri"


class NatalChartRequest(BaseModel):
    birth: BirthData
    config: ChartConfig = ChartConfig()


class PlanetPosition(BaseModel):
    name: str
    longitude: float
    latitude: float
    speed_long: float
    sign: str
    sign_degree: float
    house: Optional[int] = None
    retrograde: bool = False


class HouseCusps(BaseModel):
    cusps: list[float]
    ascendant: float
    midheaven: float
    armc: float
    vertex: float


class Aspect(BaseModel):
    body_a: str
    body_b: str
    aspect: str
    angle: float
    orb: float
    applying: bool


class NatalChartResponse(BaseModel):
    birth: BirthData
    config: ChartConfig
    julian_day_ut: float
    planets: list[PlanetPosition]
    houses: HouseCusps
    aspects: list[Aspect]


class IngressRequest(BaseModel):
    year: int = Field(..., ge=1800, le=2400)
    location: GeoLocation
    config: ChartConfig = ChartConfig()


class IngressEvent(BaseModel):
    sign: str
    timestamp_utc: datetime
    chart: NatalChartResponse


class IngressResponse(BaseModel):
    year: int
    events: list[IngressEvent]


class LunationsRequest(BaseModel):
    start_date: date
    end_date: date
    location: GeoLocation
    config: ChartConfig = ChartConfig()


class LunationEvent(BaseModel):
    kind: Literal["new_moon", "full_moon"]
    timestamp_utc: datetime
    sun_longitude: float
    moon_longitude: float
    sign: str


class EclipseEvent(BaseModel):
    kind: Literal["solar", "lunar"]
    timestamp_utc: datetime
    eclipse_type: str
    magnitude: Optional[float] = None
    sun_longitude: float
    moon_longitude: float
    sign: str
    visible_at_location: bool


class LunationsResponse(BaseModel):
    start_date: date
    end_date: date
    lunations: list[LunationEvent]
    eclipses: list[EclipseEvent]


class CyclesRequest(BaseModel):
    start_date: date
    end_date: date
    pairs: Optional[list[tuple[str, str]]] = None
    config: ChartConfig = ChartConfig()


class CycleAspect(BaseModel):
    body_a: str
    body_b: str
    aspect: str
    angle: float
    timestamp_utc: datetime
    longitude_a: float
    longitude_b: float


class CyclesResponse(BaseModel):
    start_date: date
    end_date: date
    aspects: list[CycleAspect]


class GeocodeRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=200)


class GeocodeResult(BaseModel):
    name: str
    country: Optional[str] = None
    admin1: Optional[str] = None
    latitude: float
    longitude: float
    timezone: Optional[str] = None
    elevation: float = 0.0


class GeocodeResponse(BaseModel):
    results: list[GeocodeResult]


class InterpretRequest(BaseModel):
    chart: NatalChartResponse
    focus: Literal["overview", "career", "relationships", "spiritual", "mundane"] = (
        "overview"
    )


class InterpretResponse(BaseModel):
    focus: str
    interpretation: str
    model: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    chart: Optional[NatalChartResponse] = None

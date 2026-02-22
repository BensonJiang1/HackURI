"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Common
# ---------------------------------------------------------------------------

class Coordinates(BaseModel):
    """A latitude/longitude pair."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


# ---------------------------------------------------------------------------
# Geocoding
# ---------------------------------------------------------------------------

class GeocodeRequest(BaseModel):
    address: str = Field(..., min_length=1, description="Free-form address string")


class GeocodeResponse(BaseModel):
    address: str
    lat: float
    lng: float
    display_name: str


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------

class RouteRequest(BaseModel):
    origin: Coordinates
    destination: Coordinates


class RouteResponse(BaseModel):
    distance_km: float = Field(..., description="Walking distance in kilometres")
    duration_min: float = Field(..., description="Estimated walk time in minutes")
    geometry: list | None = Field(
        None, description="Polyline coordinates for map display"
    )


# ---------------------------------------------------------------------------
# Amenities
# ---------------------------------------------------------------------------

class AmenitySearchRequest(BaseModel):
    location: Coordinates
    amenity_type: str = Field(
        ...,
        description="OSM amenity tag, e.g. 'gym', 'cafe', 'supermarket'",
    )
    radius_m: int = Field(
        2000, ge=100, le=10000, description="Search radius in metres"
    )


class AmenityResult(BaseModel):
    name: str
    lat: float
    lng: float
    amenity_type: str
    distance_m: float | None = None


class AmenitySearchResponse(BaseModel):
    results: list[AmenityResult]


# ---------------------------------------------------------------------------
# Score
# ---------------------------------------------------------------------------

class AmenityInput(BaseModel):
    """A single amenity the user wants near their home."""
    amenity_type: str
    visits_per_week: int = Field(3, ge=1, le=14)


class ScoreRequest(BaseModel):
    home: Coordinates
    work: Coordinates | None = None
    amenities: list[AmenityInput] = []
    work_days_per_week: int = Field(5, ge=0, le=7)


class WalkBreakdown(BaseModel):
    label: str
    distance_km: float
    one_way_min: float
    round_trips_per_week: int
    weekly_minutes: float


class ScoreResponse(BaseModel):
    total_weekly_walk_min: float
    total_weekly_calories: float
    who_guideline_pct: float = Field(
        ..., description="Percentage of WHO 150 min/week guideline met"
    )
    grade: str = Field(..., description="A–F letter grade")
    breakdown: list[WalkBreakdown]

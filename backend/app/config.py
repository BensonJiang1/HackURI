"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Central config — values come from .env or fall back to free public endpoints."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

    # --- External service URLs ---
    NOMINATIM_BASE_URL = os.getenv(
        "NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org"
    )
    OSRM_BASE_URL = os.getenv(
        "OSRM_BASE_URL", "https://router.project-osrm.org"
    )
    OVERPASS_BASE_URL = os.getenv(
        "OVERPASS_BASE_URL", "https://overpass-api.de/api/interpreter"
    )
    ORS_API_KEY = os.getenv("ORS_API_KEY", "")
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

    # --- Score calculation defaults ---
    # Average walking speed in km/h (brisk walk)
    WALKING_SPEED_KMH = float(os.getenv("WALKING_SPEED_KMH", "5.0"))
    # Calories burned per minute of walking (average adult, ~3.5 METs)
    CALORIES_PER_MINUTE_WALKING = float(
        os.getenv("CALORIES_PER_MINUTE_WALKING", "4.0")
    )
    # WHO recommended moderate-exercise minutes per week
    WHO_WEEKLY_MINUTES = 150

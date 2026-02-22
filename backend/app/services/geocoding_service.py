"""Geocoding service — converts addresses ↔ coordinates using Nominatim (OSM)."""

import time
import requests
from flask import current_app

# Nominatim requires a descriptive User-Agent (not blank/generic).
_USER_AGENT = "HackURI-WalkScore/1.0"

# Simple in-memory cache to respect Nominatim's 1-req/sec policy.
_last_request_time: float = 0.0


def _throttle():
    """Ensure at least 1 second between Nominatim requests."""
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_request_time = time.time()


def geocode_address(address: str) -> dict:
    """Forward-geocode a free-form address string.

    Returns dict with keys: address, lat, lng, display_name
    Raises ValueError if the address cannot be resolved.
    """
    base = current_app.config["NOMINATIM_BASE_URL"]
    _throttle()
    resp = requests.get(
        f"{base}/search",
        params={"q": address, "format": "jsonv2", "limit": 1},
        headers={"User-Agent": _USER_AGENT},
        timeout=10,
    )
    resp.raise_for_status()
    results = resp.json()
    if not results:
        raise ValueError(f"Could not geocode address: {address}")

    hit = results[0]
    return {
        "address": address,
        "lat": float(hit["lat"]),
        "lng": float(hit["lon"]),
        "display_name": hit.get("display_name", address),
    }


def reverse_geocode(lat: float, lng: float) -> dict:
    """Reverse-geocode coordinates to an address string."""
    base = current_app.config["NOMINATIM_BASE_URL"]
    _throttle()
    resp = requests.get(
        f"{base}/reverse",
        params={"lat": lat, "lon": lng, "format": "jsonv2"},
        headers={"User-Agent": _USER_AGENT},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        "address": data.get("display_name", ""),
        "lat": lat,
        "lng": lng,
        "display_name": data.get("display_name", ""),
    }

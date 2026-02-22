"""Routing service — calculates walking distance & time.

Primary: OpenRouteService (foot-walking profile, free 2000 req/day).
Fallback: OSRM distance + estimated walk time at 5 km/h.
"""

import requests
from flask import current_app


def get_walking_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> dict | None:
    """Get walking route between two points.

    Tries OpenRouteService first (accurate foot-walking profile).
    Falls back to OSRM car distance + estimated walk time if ORS key is missing.

    Returns dict with: distance_km, duration_min, geometry (list of [lat,lng]),
    or None if no route found.
    """
    api_key = current_app.config.get("ORS_API_KEY", "").strip()
    if api_key:
        return _ors_walking_route(origin_lat, origin_lng, dest_lat, dest_lng, api_key)
    else:
        return _osrm_estimated_walk(origin_lat, origin_lng, dest_lat, dest_lng)


def _ors_walking_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    api_key: str,
) -> dict | None:
    """Query OpenRouteService for a foot-walking route."""
    url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

    resp = requests.post(
        url,
        json={
            "coordinates": [
                [origin_lng, origin_lat],
                [dest_lng, dest_lat],
            ],
        },
        headers={
            "Authorization": api_key,
            "Content-Type": "application/json",
        },
        timeout=15,
    )

    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()

    feature = data["features"][0]
    props = feature["properties"]["summary"]
    geometry_coords = feature["geometry"]["coordinates"]  # [[lng, lat, alt?], ...]

    # Flip to [lat, lng] for Leaflet
    geometry_latlng = [[pt[1], pt[0]] for pt in geometry_coords]

    return {
        "distance_km": round(props["distance"] / 1000, 2),
        "duration_min": round(props["duration"] / 60, 1),
        "geometry": geometry_latlng,
        "source": "openrouteservice",
    }


def _osrm_estimated_walk(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> dict | None:
    """
    Fallback: Use OSRM for the *road distance* but estimate walking time
    at WALKING_SPEED_KMH (default 5 km/h) since the OSRM public demo
    only has the car profile.
    """
    base = current_app.config["OSRM_BASE_URL"]
    coords = f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
    url = f"{base}/route/v1/driving/{coords}"

    resp = requests.get(
        url,
        params={
            "overview": "full",
            "geometries": "geojson",
            "steps": "false",
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        return None

    route = data["routes"][0]
    distance_m = route["distance"]
    geometry = route["geometry"]["coordinates"]

    # Flip to [lat, lng] for Leaflet
    geometry_latlng = [[pt[1], pt[0]] for pt in geometry]

    # Estimate walking time from distance
    walk_speed = current_app.config.get("WALKING_SPEED_KMH", 5.0)
    distance_km = distance_m / 1000
    duration_min = (distance_km / walk_speed) * 60

    return {
        "distance_km": round(distance_km, 2),
        "duration_min": round(duration_min, 1),
        "geometry": geometry_latlng,
        "source": "osrm_estimated",
    }

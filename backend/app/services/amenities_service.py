"""Amenities service — finds nearby points of interest via Overpass (OSM)."""

import math
import time
import requests
from flask import current_app

# Throttle Overpass requests — the public server rate-limits aggressively.
_last_overpass_time: float = 0.0
_OVERPASS_MIN_INTERVAL = 2.0  # seconds between requests


def _throttle_overpass():
    """Ensure a minimum gap between Overpass API calls."""
    global _last_overpass_time
    elapsed = time.time() - _last_overpass_time
    if elapsed < _OVERPASS_MIN_INTERVAL:
        time.sleep(_OVERPASS_MIN_INTERVAL - elapsed)
    _last_overpass_time = time.time()

# Map user-friendly names → OSM Overpass tag filters.
# Each value is one or more Overpass tag clauses. For more precise results,
# combine tags (e.g. require cuisine=coffee_shop for cafes).
AMENITY_TAG_MAP: dict[str, list[list[str]]] = {
    # Gyms / fitness
    "gym":           [['"leisure"="fitness_centre"']],
    "fitness":       [['"leisure"="fitness_centre"']],
    # Coffee — strict: amenity=cafe AND (cuisine=coffee_shop OR has no cuisine tag)
    # This excludes dining halls / canteens tagged as cafe
    "cafe":          [['"amenity"="cafe"']],
    "coffee":        [['"amenity"="cafe"', '"cuisine"="coffee_shop"']],
    "coffee shop":   [['"amenity"="cafe"', '"cuisine"="coffee_shop"']],
    # Restaurants
    "restaurant":    [['"amenity"="restaurant"']],
    # Grocery
    "supermarket":   [['"shop"="supermarket"']],
    "grocery":       [['"shop"="supermarket"'], ['"shop"="convenience"']],
    "grocery store": [['"shop"="supermarket"'], ['"shop"="convenience"']],
    # Other
    "pharmacy":      [['"amenity"="pharmacy"']],
    "park":          [['"leisure"="park"']],
    "library":       [['"amenity"="library"']],
    "bar":           [['"amenity"="bar"']],
    "bank":          [['"amenity"="bank"']],
    "hospital":      [['"amenity"="hospital"']],
    "school":        [['"amenity"="school"']],
    "bakery":        [['"shop"="bakery"']],
}

# Exclude results whose name contains these keywords (case-insensitive).
# Helps filter out misclassified OSM entries.
EXCLUDE_KEYWORDS: dict[str, list[str]] = {
    "coffee":      ["dining hall", "canteen", "cafeteria", "food court", "food hall"],
    "coffee shop": ["dining hall", "canteen", "cafeteria", "food court", "food hall"],
    "cafe":        ["dining hall", "canteen", "cafeteria"],
}


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in metres between two points (Haversine formula)."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _resolve_tag(amenity_type: str) -> list[list[str]]:
    """Resolve a user-friendly amenity name to Overpass tag filter groups.

    Returns a list of tag groups. Each group is a list of Overpass clauses
    that must ALL match (AND). Multiple groups are combined with OR.
    """
    key = amenity_type.lower().strip()
    if key in AMENITY_TAG_MAP:
        return AMENITY_TAG_MAP[key]
    # Fallback: assume it's a raw OSM amenity=<value>
    return [[f'"amenity"="{key}"']]


def search_amenities(
    lat: float, lng: float, amenity_type: str, radius_m: int = 2000
) -> list[dict]:
    """Search for amenities near a location using the Overpass API.

    Returns a list of dicts with: name, lat, lng, amenity_type, distance_m
    """
    tag_groups = _resolve_tag(amenity_type)

    # Build Overpass union query — each tag group becomes a node+way pair
    union_parts = []
    for group in tag_groups:
        tag_filter = "".join(f"[{clause}]" for clause in group)
        union_parts.append(f"node{tag_filter}(around:{radius_m},{lat},{lng});")
        union_parts.append(f"way{tag_filter}(around:{radius_m},{lat},{lng});")

    query = f"""
    [out:json][timeout:10];
    (
      {chr(10).join('      ' + p for p in union_parts)}
    );
    out center body;
    """

    overpass_url = current_app.config["OVERPASS_BASE_URL"]

    # Throttle + retry with back-off on 429
    max_retries = 3
    for attempt in range(max_retries):
        _throttle_overpass()
        resp = requests.post(overpass_url, data={"data": query}, timeout=15)
        if resp.status_code == 429:
            wait = _OVERPASS_MIN_INTERVAL * (attempt + 2)
            time.sleep(wait)
            continue
        resp.raise_for_status()
        break
    else:
        resp.raise_for_status()  # raise the last 429 if all retries failed

    elements = resp.json().get("elements", [])

    results = []
    for el in elements:
        # Ways use 'center' for lat/lon
        el_lat = el.get("lat") or el.get("center", {}).get("lat")
        el_lng = el.get("lon") or el.get("center", {}).get("lon")
        if el_lat is None or el_lng is None:
            continue

        name = el.get("tags", {}).get("name", "Unnamed")

        # Keyword exclusion filter
        excludes = EXCLUDE_KEYWORDS.get(amenity_type.lower(), [])
        if any(kw.lower() in name.lower() for kw in excludes):
            continue

        dist = _haversine(lat, lng, el_lat, el_lng)
        results.append(
            {
                "name": name,
                "lat": el_lat,
                "lng": el_lng,
                "amenity_type": amenity_type,
                "distance_m": round(dist, 0),
            }
        )

    # Sort by distance
    results.sort(key=lambda r: r["distance_m"])
    return results

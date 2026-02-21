"""Transit service — finds nearby transit stops and computes walk-to-transit commutes."""

import time
import math
import requests
from flask import current_app

# Reuse the Overpass throttle from amenities_service
from app.services.amenities_service import _throttle_overpass, _haversine, _OVERPASS_MIN_INTERVAL


def find_nearest_transit_stops(
    lat: float, lng: float, radius_m: int = 2000, limit: int = 5
) -> list[dict]:
    """
    Find the nearest public transit stops (bus stops, train stations, tram stops)
    within *radius_m* of (lat, lng) using the Overpass API.

    Returns a list of dicts: {"name", "lat", "lng", "type", "distance_m"}.
    """
    overpass_url = current_app.config["OVERPASS_BASE_URL"]

    # Query for common transit stop types in OSM
    query = f"""
    [out:json][timeout:10];
    (
      node["public_transport"="stop_position"](around:{radius_m},{lat},{lng});
      node["public_transport"="platform"](around:{radius_m},{lat},{lng});
      node["railway"="station"](around:{radius_m},{lat},{lng});
      node["railway"="halt"](around:{radius_m},{lat},{lng});
      node["railway"="tram_stop"](around:{radius_m},{lat},{lng});
      node["highway"="bus_stop"](around:{radius_m},{lat},{lng});
      node["amenity"="bus_station"](around:{radius_m},{lat},{lng});
      node["amenity"="ferry_terminal"](around:{radius_m},{lat},{lng});
    );
    out body;
    """

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
        resp.raise_for_status()

    elements = resp.json().get("elements", [])

    results = []
    seen_coords = set()  # deduplicate stops at same location
    for el in elements:
        el_lat = el.get("lat")
        el_lng = el.get("lon")
        if el_lat is None or el_lng is None:
            continue

        # Deduplicate: many stops share the same physical location
        coord_key = (round(el_lat, 5), round(el_lng, 5))
        if coord_key in seen_coords:
            continue
        seen_coords.add(coord_key)

        tags = el.get("tags", {})
        name = tags.get("name", "Unnamed stop")

        # Determine stop type
        if tags.get("railway") in ("station", "halt"):
            stop_type = "train_station"
        elif tags.get("railway") == "tram_stop":
            stop_type = "tram_stop"
        elif tags.get("amenity") == "ferry_terminal":
            stop_type = "ferry_terminal"
        else:
            stop_type = "bus_stop"

        dist = _haversine(lat, lng, el_lat, el_lng)
        results.append({
            "name": name,
            "lat": el_lat,
            "lng": el_lng,
            "type": stop_type,
            "distance_m": round(dist, 0),
        })

    results.sort(key=lambda r: r["distance_m"])
    return results[:limit]


def get_commute_walk_legs(
    home_lat: float,
    home_lng: float,
    work_lat: float,
    work_lng: float,
    transit_radius_m: int = 2000,
) -> dict | None:
    """
    Compute the walking portions of a transit commute.

    Finds nearest transit stop to home and to work, then returns the walking
    route for each leg. If walking the full distance is shorter than walking
    to transit + from transit, returns the direct walk instead.

    Returns dict with:
        mode: "direct_walk" | "transit"
        home_to_transit: {stop_name, stop_type, distance_km, duration_min, geometry} | None
        transit_to_work: {stop_name, stop_type, distance_km, duration_min, geometry} | None
        total_walk_min: float   (one-way total for the walking portions)
        total_walk_km: float
    """
    from app.services.routing_service import get_walking_route

    # 1. Get the direct walk for comparison
    direct = get_walking_route(home_lat, home_lng, work_lat, work_lng)
    if direct is None:
        return None

    # 2. Find nearest transit stops to home and work
    home_stops = find_nearest_transit_stops(home_lat, home_lng, transit_radius_m)
    work_stops = find_nearest_transit_stops(work_lat, work_lng, transit_radius_m)

    if not home_stops or not work_stops:
        # No transit available — fall back to direct walk
        return {
            "mode": "direct_walk",
            "home_to_transit": None,
            "transit_to_work": None,
            "total_walk_min": direct["duration_min"],
            "total_walk_km": direct["distance_km"],
            "direct_walk_min": direct["duration_min"],
            "direct_walk_km": direct["distance_km"],
        }

    # 3. Walk from home to nearest transit stop
    home_stop = home_stops[0]
    leg1 = get_walking_route(home_lat, home_lng, home_stop["lat"], home_stop["lng"])

    # 4. Walk from nearest transit stop to work
    work_stop = work_stops[0]
    leg2 = get_walking_route(work_stop["lat"], work_stop["lng"], work_lat, work_lng)

    if leg1 is None or leg2 is None:
        return {
            "mode": "direct_walk",
            "home_to_transit": None,
            "transit_to_work": None,
            "total_walk_min": direct["duration_min"],
            "total_walk_km": direct["distance_km"],
            "direct_walk_min": direct["duration_min"],
            "direct_walk_km": direct["distance_km"],
        }

    transit_walk_min = leg1["duration_min"] + leg2["duration_min"]
    transit_walk_km = leg1["distance_km"] + leg2["distance_km"]

    # 5. If direct walk is shorter, just walk the whole thing
    if direct["duration_min"] <= transit_walk_min:
        return {
            "mode": "direct_walk",
            "home_to_transit": None,
            "transit_to_work": None,
            "total_walk_min": direct["duration_min"],
            "total_walk_km": direct["distance_km"],
            "direct_walk_min": direct["duration_min"],
            "direct_walk_km": direct["distance_km"],
        }

    return {
        "mode": "transit",
        "home_to_transit": {
            "stop_name": home_stop["name"],
            "stop_type": home_stop["type"],
            "distance_km": leg1["distance_km"],
            "duration_min": leg1["duration_min"],
            "geometry": leg1.get("geometry"),
        },
        "transit_to_work": {
            "stop_name": work_stop["name"],
            "stop_type": work_stop["type"],
            "distance_km": leg2["distance_km"],
            "duration_min": leg2["duration_min"],
            "geometry": leg2.get("geometry"),
        },
        "total_walk_min": round(transit_walk_min, 1),
        "total_walk_km": round(transit_walk_km, 2),
        "direct_walk_min": direct["duration_min"],
        "direct_walk_km": direct["distance_km"],
    }

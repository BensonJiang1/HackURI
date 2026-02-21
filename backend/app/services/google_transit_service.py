"""Google Routes API transit service — real transit routing with accurate walk legs."""

import requests
from flask import current_app


def _get_api_key() -> str:
    key = current_app.config.get("GOOGLE_MAPS_API_KEY", "")
    if not key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not set in .env")
    return key


def get_transit_route(
    home_lat: float,
    home_lng: float,
    work_lat: float,
    work_lng: float,
) -> dict | None:
    """
    Call the Google Routes API with travelMode=TRANSIT to get a real
    transit itinerary, then extract the walking legs.

    Returns
    -------
    dict with:
        mode: "transit" | "walk_only"
        steps: list of step dicts (each has travelMode, distanceMeters, duration, etc.)
        walk_legs: list of WALK step dicts
        transit_legs: list of TRANSIT step dicts with line/stop info
        total_walk_min: float   (sum of walk-leg durations)
        total_walk_km: float
        total_duration_min: float  (entire trip including transit)
        total_distance_km: float
        home_to_transit: dict | None  (first walk leg details)
        transit_to_work: dict | None  (last walk leg details)
        direct_walk_min: float | None
        direct_walk_km: float | None
    """
    api_key = _get_api_key()

    url = "https://routes.googleapis.com/directions/v2:computeRoutes"

    body = {
        "origin": {
            "location": {
                "latLng": {"latitude": home_lat, "longitude": home_lng}
            }
        },
        "destination": {
            "location": {
                "latLng": {"latitude": work_lat, "longitude": work_lng}
            }
        },
        "travelMode": "TRANSIT",
        "computeAlternativeRoutes": False,
    }

    # Field mask controls which fields are returned (and billing tier).
    # We request step-level detail for walk/transit breakdown.
    field_mask = ",".join([
        "routes.legs.steps.travelMode",
        "routes.legs.steps.staticDuration",
        "routes.legs.steps.distanceMeters",
        "routes.legs.steps.startLocation",
        "routes.legs.steps.endLocation",
        "routes.legs.steps.transitDetails",
        "routes.legs.steps.polyline",
        "routes.legs.duration",
        "routes.legs.distanceMeters",
        "routes.legs.polyline",
        "routes.distanceMeters",
        "routes.duration",
        "routes.polyline",
    ])

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": field_mask,
    }

    resp = requests.post(url, json=body, headers=headers, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    # ── Debug: log raw Google response ──────────────────
    import json as _json
    current_app.logger.debug(
        "Google Routes API raw response:\n%s",
        _json.dumps(data, indent=2, default=str)[:5000],
    )

    routes = data.get("routes", [])
    if not routes:
        current_app.logger.warning("Google Routes API returned no routes")
        return None

    route = routes[0]
    leg = route["legs"][0]
    steps = leg.get("steps", [])

    # Log step summary
    for i, s in enumerate(steps):
        mode = s.get("travelMode", "?")
        dist = s.get("distanceMeters", 0)
        dur = s.get("staticDuration", "0s")
        td = s.get("transitDetails", {})
        line_name = td.get("transitLine", {}).get("nameShort", "")
        dep = td.get("stopDetails", {}).get("departureStop", {}).get("name", "")
        arr = td.get("stopDetails", {}).get("arrivalStop", {}).get("name", "")
        current_app.logger.info(
            "  Step %d: %s | %dm | %s%s",
            i, mode, dist, dur,
            f" | {line_name}: {dep} → {arr}" if dep else "",
        )

    # Separate walk and transit steps, preserving order
    all_steps = []
    walk_legs = []
    transit_legs = []

    for step in steps:
        mode = step.get("travelMode", "")
        duration_str = step.get("staticDuration", "0s")
        duration_s = _parse_duration(duration_str)
        dist_m = step.get("distanceMeters", 0)

        step_info = {
            "travelMode": mode,
            "distance_m": dist_m,
            "distance_km": round(dist_m / 1000, 2),
            "duration_s": duration_s,
            "duration_min": round(duration_s / 60, 1),
            "start": _extract_latlng(step.get("startLocation")),
            "end": _extract_latlng(step.get("endLocation")),
        }

        # Decode polyline if present
        polyline = step.get("polyline", {}).get("encodedPolyline")
        if polyline:
            step_info["geometry"] = _decode_polyline(polyline)

        if mode == "WALK":
            walk_legs.append(step_info)
        elif mode == "TRANSIT":
            td = step.get("transitDetails", {})
            step_info["transit_info"] = _parse_transit_details(td)
            transit_legs.append(step_info)

        all_steps.append(step_info)

    total_walk_s = sum(w["duration_s"] for w in walk_legs)
    total_walk_m = sum(w["distance_m"] for w in walk_legs)

    total_dur_str = leg.get("duration") or route.get("duration", "0s")
    total_dur_s = _parse_duration(total_dur_str)
    total_dist_m = leg.get("distanceMeters") or route.get("distanceMeters", 0)

    # ── Build home_to_transit / transit_to_work ──────────────────────
    # Aggregate ALL walk segments before the first transit leg into one
    # "home_to_transit" leg, and ALL walk segments after the last transit
    # leg into one "transit_to_work" leg.
    home_to_transit = None
    transit_to_work = None

    if transit_legs:
        # Find index of first and last transit step in the ordered list
        first_transit_idx = next(
            i for i, s in enumerate(all_steps) if s.get("travelMode") == "TRANSIT"
        )
        last_transit_idx = next(
            i for i in range(len(all_steps) - 1, -1, -1)
            if all_steps[i].get("travelMode") == "TRANSIT"
        )

        # Walk legs before first transit
        pre_walks = [s for s in all_steps[:first_transit_idx] if s["travelMode"] == "WALK"]
        if pre_walks:
            home_to_transit = _merge_walk_legs(
                pre_walks,
                stop_name=_get_stop_name(transit_legs, 0, "start"),
                stop_type=_get_transit_type(transit_legs, 0),
            )

        # Walk legs after last transit
        post_walks = [s for s in all_steps[last_transit_idx + 1:] if s["travelMode"] == "WALK"]
        if post_walks:
            transit_to_work = _merge_walk_legs(
                post_walks,
                stop_name=_get_stop_name(transit_legs, -1, "end"),
                stop_type=_get_transit_type(transit_legs, -1),
            )
    elif walk_legs:
        # All-walk route (no transit legs)
        home_to_transit = _merge_walk_legs(
            walk_legs,
            stop_name="Destination",
            stop_type="walk",
        )

    # Also get a direct-walk estimate for comparison
    direct_walk = _get_direct_walk(home_lat, home_lng, work_lat, work_lng)

    result = {
        "mode": "transit" if transit_legs else "direct_walk",
        "home_to_transit": home_to_transit if transit_legs else None,
        "transit_to_work": transit_to_work if transit_legs else None,
        "total_walk_min": round(total_walk_s / 60, 1),
        "total_walk_km": round(total_walk_m / 1000, 2),
        "total_duration_min": round(total_dur_s / 60, 1),
        "total_distance_km": round(total_dist_m / 1000, 2),
        "walk_legs": walk_legs,
        "transit_legs": transit_legs,
        "source": "google_routes_api",
    }

    if direct_walk:
        result["direct_walk_min"] = direct_walk["duration_min"]
        result["direct_walk_km"] = direct_walk["distance_km"]

    return result


# ── Helpers ──────────────────────────────────────────────────────────


def _merge_walk_legs(legs: list[dict], stop_name: str, stop_type: str) -> dict:
    """Merge multiple consecutive walk-leg dicts into one combined leg.

    Concatenates geometries, sums distances/durations.
    """
    total_m = sum(l["distance_m"] for l in legs)
    total_s = sum(l["duration_s"] for l in legs)
    merged_geom = []
    for l in legs:
        geom = l.get("geometry", [])
        # Avoid duplicate join-points when concatenating
        if merged_geom and geom and merged_geom[-1] == geom[0]:
            geom = geom[1:]
        merged_geom.extend(geom)

    return {
        "stop_name": stop_name,
        "stop_type": stop_type,
        "distance_km": round(total_m / 1000, 2),
        "duration_min": round(total_s / 60, 1),
        "geometry": merged_geom,
    }


def _parse_duration(duration_str: str) -> float:
    """Parse a Google duration string like '1234s' to seconds."""
    if not duration_str:
        return 0.0
    return float(duration_str.rstrip("s"))


def _extract_latlng(location: dict | None) -> dict | None:
    """Extract lat/lng from a Google location object."""
    if not location:
        return None
    ll = location.get("latLng", {})
    return {"lat": ll.get("latitude"), "lng": ll.get("longitude")}


def _get_stop_name(transit_legs: list, index: int, which: str) -> str:
    """Get the stop name from a transit leg (start or end)."""
    if not transit_legs:
        return "Transit stop"
    try:
        leg = transit_legs[index]
        info = leg.get("transit_info", {})
        if which == "start":
            return info.get("departure_stop", "Transit stop")
        return info.get("arrival_stop", "Transit stop")
    except (IndexError, KeyError):
        return "Transit stop"


def _get_transit_type(transit_legs: list, index: int) -> str:
    """Get the transit type (bus, rail, etc.) from a transit leg."""
    if not transit_legs:
        return "transit"
    try:
        return transit_legs[index].get("transit_info", {}).get("type", "transit")
    except (IndexError, KeyError):
        return "transit"


def _parse_transit_details(td: dict) -> dict:
    """Parse Google transitDetails into a simpler dict."""
    stop_details = td.get("stopDetails", {})
    departure = stop_details.get("departureStop", {})
    arrival = stop_details.get("arrivalStop", {})

    line = td.get("transitLine", {})
    vehicle = line.get("vehicle", {})

    return {
        "departure_stop": departure.get("name", "Unknown"),
        "arrival_stop": arrival.get("name", "Unknown"),
        "line_name": line.get("name", ""),
        "line_short_name": line.get("nameShort", ""),
        "type": vehicle.get("type", "BUS").lower(),
        "agency": line.get("agencies", [{}])[0].get("name", "") if line.get("agencies") else "",
        "headsign": td.get("headsign", ""),
        "num_stops": td.get("stopCount", 0),
    }


def _decode_polyline(encoded: str) -> list[list[float]]:
    """Decode a Google encoded polyline into [[lat, lng], ...] for Leaflet."""
    result = []
    index = 0
    lat = 0
    lng = 0

    while index < len(encoded):
        # Latitude
        shift = 0
        value = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            value |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        lat += (~(value >> 1) if (value & 1) else (value >> 1))

        # Longitude
        shift = 0
        value = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            value |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        lng += (~(value >> 1) if (value & 1) else (value >> 1))

        # Leaflet expects [lat, lng] — NOT GeoJSON [lng, lat]
        result.append([lat / 1e5, lng / 1e5])

    return result


def _get_direct_walk(
    home_lat: float, home_lng: float, work_lat: float, work_lng: float
) -> dict | None:
    """Get direct walk route for comparison (reuse existing routing service)."""
    try:
        from app.services.routing_service import get_walking_route
        return get_walking_route(home_lat, home_lng, work_lat, work_lng)
    except Exception:
        return None

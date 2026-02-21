"""Routing API endpoints — walking directions between two points."""

from flask import Blueprint, jsonify, request
from app.services.routing_service import get_walking_route
from app.services.transit_service import get_commute_walk_legs, find_nearest_transit_stops

routing_bp = Blueprint("routing", __name__)


@routing_bp.route("/walk", methods=["POST"])
def walk():
    """
    POST {
      "origin":      {"lat": ..., "lng": ...},
      "destination": {"lat": ..., "lng": ...}
    }
    → {distance_km, duration_min, geometry}
    """
    body = request.get_json(force=True)

    origin = body.get("origin", {})
    dest = body.get("destination", {})

    try:
        o_lat, o_lng = float(origin["lat"]), float(origin["lng"])
        d_lat, d_lng = float(dest["lat"]), float(dest["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "origin and destination must have lat/lng"}), 400

    try:
        route = get_walking_route(o_lat, o_lng, d_lat, d_lng)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    if route is None:
        return jsonify({"error": "No walking route found"}), 404
    return jsonify(route)


@routing_bp.route("/commute", methods=["POST"])
def commute():
    """
    Compute the walking portions of a transit commute.

    POST {
      "origin":      {"lat": ..., "lng": ...},
      "destination": {"lat": ..., "lng": ...},
      "transit_radius_m": 2000   (optional)
    }
    → {
        "mode": "transit" | "direct_walk",
        "home_to_transit": {stop_name, stop_type, distance_km, duration_min, geometry} | null,
        "transit_to_work": {stop_name, stop_type, distance_km, duration_min, geometry} | null,
        "total_walk_min": ...,
        "total_walk_km": ...,
        "direct_walk_min": ...,
        "direct_walk_km": ...
      }
    """
    body = request.get_json(force=True)

    origin = body.get("origin", {})
    dest = body.get("destination", {})

    try:
        o_lat, o_lng = float(origin["lat"]), float(origin["lng"])
        d_lat, d_lng = float(dest["lat"]), float(dest["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "origin and destination must have lat/lng"}), 400

    radius = int(body.get("transit_radius_m", 2000))

    try:
        result = get_commute_walk_legs(o_lat, o_lng, d_lat, d_lng, radius)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    if result is None:
        return jsonify({"error": "Could not compute commute"}), 404
    return jsonify(result)


@routing_bp.route("/debug", methods=["POST"])
def debug():
    """
    Debug endpoint — returns the raw OSRM response so you can inspect
    what profile is being used and whether times make sense.
    """
    import requests as _req
    body = request.get_json(force=True)
    origin = body.get("origin", {})
    dest = body.get("destination", {})
    try:
        o_lat, o_lng = float(origin["lat"]), float(origin["lng"])
        d_lat, d_lng = float(dest["lat"]), float(dest["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "origin and destination must have lat/lng"}), 400

    from flask import current_app
    base = current_app.config["OSRM_BASE_URL"]
    coords = f"{o_lng},{o_lat};{d_lng},{d_lat}"
    foot_url = f"{base}/route/v1/foot/{coords}"
    car_url = f"{base}/route/v1/driving/{coords}"

    results = {"osrm_base": base}

    # Try foot profile
    try:
        r = _req.get(foot_url, params={"overview": "false"}, timeout=10)
        foot_data = r.json()
        results["foot"] = {
            "url": foot_url,
            "status": r.status_code,
            "code": foot_data.get("code"),
            "message": foot_data.get("message"),
        }
        if foot_data.get("routes"):
            rt = foot_data["routes"][0]
            results["foot"]["distance_m"] = rt["distance"]
            results["foot"]["duration_s"] = rt["duration"]
            results["foot"]["duration_min"] = round(rt["duration"] / 60, 1)
            results["foot"]["speed_kmh"] = round((rt["distance"] / 1000) / (rt["duration"] / 3600), 1) if rt["duration"] else None
    except Exception as e:
        results["foot"] = {"error": str(e)}

    # Try car profile for comparison
    try:
        r = _req.get(car_url, params={"overview": "false"}, timeout=10)
        car_data = r.json()
        results["car"] = {
            "url": car_url,
            "status": r.status_code,
            "code": car_data.get("code"),
        }
        if car_data.get("routes"):
            rt = car_data["routes"][0]
            results["car"]["distance_m"] = rt["distance"]
            results["car"]["duration_s"] = rt["duration"]
            results["car"]["duration_min"] = round(rt["duration"] / 60, 1)
            results["car"]["speed_kmh"] = round((rt["distance"] / 1000) / (rt["duration"] / 3600), 1) if rt["duration"] else None
    except Exception as e:
        results["car"] = {"error": str(e)}

    # Check if foot and car give same duration (means foot profile not loaded)
    foot_dur = results.get("foot", {}).get("duration_s")
    car_dur = results.get("car", {}).get("duration_s")
    if foot_dur and car_dur and abs(foot_dur - car_dur) < 1:
        results["warning"] = "foot and car durations are identical — OSRM likely only has car profile loaded!"
    elif foot_dur:
        speed = results["foot"].get("speed_kmh", 0)
        if speed and speed > 8:
            results["warning"] = f"foot speed is {speed} km/h — too fast for walking (expect ~5 km/h). OSRM may be using car profile."

    # Also test the actual get_walking_route function to show what the app would use
    try:
        from app.services.routing_service import get_walking_route
        actual = get_walking_route(o_lat, o_lng, d_lat, d_lng)
        if actual:
            results["app_would_use"] = {
                "source": actual.get("source", "unknown"),
                "distance_km": actual["distance_km"],
                "duration_min": actual["duration_min"],
                "speed_kmh": round(actual["distance_km"] / (actual["duration_min"] / 60), 1) if actual["duration_min"] else None,
            }
    except Exception as e:
        results["app_would_use"] = {"error": str(e)}

    return jsonify(results)


@routing_bp.route("/transit-stops", methods=["POST"])
def transit_stops():
    """
    Find nearby transit stops.

    POST {"location": {"lat": ..., "lng": ...}, "radius_m": 2000}
    → {"stops": [{name, lat, lng, type, distance_m}, ...]}
    """
    body = request.get_json(force=True)
    loc = body.get("location", {})

    try:
        lat = float(loc["lat"])
        lng = float(loc["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "location.lat and location.lng are required"}), 400

    radius = int(body.get("radius_m", 2000))

    try:
        stops = find_nearest_transit_stops(lat, lng, radius)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify({"stops": stops})

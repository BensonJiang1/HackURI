"""Amenity search API endpoints."""

from flask import Blueprint, jsonify, request
from app.services.amenities_service import search_amenities, AMENITY_TAG_MAP

amenities_bp = Blueprint("amenities", __name__)


@amenities_bp.route("/search", methods=["POST"])
def search():
    """
    POST {
      "location":     {"lat": ..., "lng": ...},
      "amenity_type": "gym",
      "radius_m":     2000          (optional, default 2000)
    }
    → {"results": [{name, lat, lng, amenity_type, distance_m}, ...]}
    """
    body = request.get_json(force=True)

    loc = body.get("location", {})
    try:
        lat = float(loc["lat"])
        lng = float(loc["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "location.lat and location.lng are required"}), 400

    amenity_type = body.get("amenity_type", "").strip()
    if not amenity_type:
        return jsonify({"error": "amenity_type is required"}), 400

    radius_m = int(body.get("radius_m", 2000))
    radius_m = max(100, min(radius_m, 10000))

    try:
        results = search_amenities(lat, lng, amenity_type, radius_m)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify({"results": results})


@amenities_bp.route("/types", methods=["GET"])
def list_types():
    """Return the list of supported amenity types."""
    return jsonify({"types": sorted(AMENITY_TAG_MAP.keys())})

"""Score calculation endpoint — the main aggregation API."""

from flask import Blueprint, jsonify, request
from app.services.score_service import calculate_score

score_bp = Blueprint("score", __name__)


@score_bp.route("/calculate", methods=["POST"])
def calculate():
    """
    POST {
      "home":               {"lat": ..., "lng": ...},
      "work":               {"lat": ..., "lng": ...}   (optional),
      "amenities":          [{"amenity_type": "gym", "visits_per_week": 3}, ...],
      "work_days_per_week": 5
    }
    → {
        "total_weekly_walk_min": ...,
        "total_weekly_calories": ...,
        "who_guideline_pct": ...,
        "grade": "B",
        "breakdown": [...]
      }
    """
    body = request.get_json(force=True)

    # --- Home (required) ---
    home = body.get("home", {})
    try:
        home_lat = float(home["lat"])
        home_lng = float(home["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "home.lat and home.lng are required"}), 400

    # --- Work (optional) ---
    work = body.get("work")
    work_lat = work_lng = None
    if work:
        try:
            work_lat = float(work["lat"])
            work_lng = float(work["lng"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "work must have lat and lng"}), 400

    # --- Amenities list (optional) ---
    amenities = body.get("amenities", [])
    work_days = int(body.get("work_days_per_week", 5))
    commute_mode = body.get("commute_mode", "transit")  # "transit" or "walk"

    try:
        result = calculate_score(
            home_lat=home_lat,
            home_lng=home_lng,
            work_lat=work_lat,
            work_lng=work_lng,
            amenities=amenities,
            work_days_per_week=work_days,
            commute_mode=commute_mode,
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(result)

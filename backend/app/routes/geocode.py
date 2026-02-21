"""Geocoding API endpoints."""

from flask import Blueprint, jsonify, request
from app.services.geocoding_service import geocode_address, reverse_geocode

geocode_bp = Blueprint("geocode", __name__)


@geocode_bp.route("/forward", methods=["POST"])
def forward():
    """POST {"address": "123 Main St"} → {lat, lng, display_name}"""
    body = request.get_json(force=True)
    address = body.get("address", "").strip()
    if not address:
        return jsonify({"error": "address is required"}), 400

    try:
        result = geocode_address(address)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    if result is None:
        return jsonify({"error": "Address not found"}), 404
    return jsonify(result)


@geocode_bp.route("/reverse", methods=["POST"])
def reverse():
    """POST {"lat": ..., "lng": ...} → {address, display_name}"""
    body = request.get_json(force=True)
    lat = body.get("lat")
    lng = body.get("lng")
    if lat is None or lng is None:
        return jsonify({"error": "lat and lng are required"}), 400

    try:
        result = reverse_geocode(float(lat), float(lng))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    if result is None:
        return jsonify({"error": "Could not reverse-geocode"}), 404
    return jsonify(result)

"""Score calculation service — aggregates walking data into exercise metrics."""

from flask import current_app
from app.services.routing_service import get_walking_route
from app.services.amenities_service import search_amenities
from app.services.transit_service import get_commute_walk_legs


def _letter_grade(pct: float) -> str:
    """Map WHO-guideline percentage to a letter grade."""
    if pct >= 150:
        return "A+"
    if pct >= 100:
        return "A"
    if pct >= 75:
        return "B"
    if pct >= 50:
        return "C"
    if pct >= 25:
        return "D"
    return "F"


def calculate_score(
    home_lat: float,
    home_lng: float,
    work_lat: float | None = None,
    work_lng: float | None = None,
    amenities: list[dict] | None = None,
    work_days_per_week: int = 5,
    commute_mode: str = "transit",
) -> dict:
    """
    Compute an overall exercise score.

    Parameters
    ----------
    home_lat, home_lng : location of the user's home
    work_lat, work_lng : location of their workplace (optional)
    amenities : list of {"amenity_type": str, "visits_per_week": int}
    work_days_per_week : how many days they commute on foot
    commute_mode : "transit" (walk to/from station) or "walk" (entire distance)

    Returns
    -------
    dict with total_weekly_walk_min, total_weekly_calories,
    who_guideline_pct, grade, and a per-item breakdown.
    """
    cal_per_min = current_app.config["CALORIES_PER_MINUTE_WALKING"]
    who_min = current_app.config["WHO_WEEKLY_MINUTES"]
    breakdown: list[dict] = []

    # ------------------------------------------------------------------
    # 1. Work commute
    # ------------------------------------------------------------------
    if work_lat is not None and work_lng is not None:
        if commute_mode == "transit":
            # Realistic: walk to transit stop + walk from transit stop to work
            commute = get_commute_walk_legs(
                home_lat, home_lng, work_lat, work_lng
            )
            if commute:
                walk_min = commute["total_walk_min"]
                walk_km = commute["total_walk_km"]
                weekly_min = walk_min * 2 * work_days_per_week

                label = "Work commute"
                if commute["mode"] == "transit":
                    h2t = commute["home_to_transit"]
                    t2w = commute["transit_to_work"]
                    label = (
                        f"Walk to {h2t['stop_name']} "
                        f"+ walk from {t2w['stop_name']} to work"
                    )

                breakdown.append({
                    "label": label,
                    "distance_km": walk_km,
                    "one_way_min": walk_min,
                    "round_trips_per_week": work_days_per_week,
                    "weekly_minutes": round(weekly_min, 1),
                    "commute_mode": commute["mode"],
                    "commute_detail": commute,
                })
        else:
            # Legacy: walk the entire distance
            route = get_walking_route(home_lat, home_lng, work_lat, work_lng)
            if route:
                weekly_min = route["duration_min"] * 2 * work_days_per_week
                breakdown.append({
                    "label": "Work commute (full walk)",
                    "distance_km": route["distance_km"],
                    "one_way_min": route["duration_min"],
                    "round_trips_per_week": work_days_per_week,
                    "weekly_minutes": round(weekly_min, 1),
                    "commute_mode": "walk",
                })

    # ------------------------------------------------------------------
    # 2. Amenity trips
    # ------------------------------------------------------------------
    for item in amenities or []:
        amenity_type = item["amenity_type"]
        visits = item.get("visits_per_week", 3)

        # Find the nearest amenity of this type
        results = search_amenities(home_lat, home_lng, amenity_type, radius_m=3000)
        if not results:
            continue

        nearest = results[0]
        route = get_walking_route(
            home_lat, home_lng, nearest["lat"], nearest["lng"]
        )
        if route is None:
            continue

        weekly_min = route["duration_min"] * 2 * visits
        breakdown.append(
            {
                "label": f"{amenity_type.title()} ({nearest['name']})",
                "distance_km": route["distance_km"],
                "one_way_min": route["duration_min"],
                "round_trips_per_week": visits,
                "weekly_minutes": round(weekly_min, 1),
            }
        )

    # ------------------------------------------------------------------
    # 3. Aggregate
    # ------------------------------------------------------------------
    total_min = sum(b["weekly_minutes"] for b in breakdown)
    total_cal = round(total_min * cal_per_min, 0)
    who_pct = round((total_min / who_min) * 100, 1) if who_min else 0

    return {
        "total_weekly_walk_min": round(total_min, 1),
        "total_weekly_calories": total_cal,
        "who_guideline_pct": who_pct,
        "grade": _letter_grade(who_pct),
        "breakdown": breakdown,
    }

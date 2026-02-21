"""Smoke-test script — exercises every API endpoint against the running server.

Usage:
    1. Start the server:  python run.py
    2. In a separate terminal:  python test_api.py
"""

import json
import sys
import time
import requests

BASE = "http://localhost:5000"

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

passed = 0
failed = 0


def test(name: str, method: str, path: str, json_body=None, expect_status=200):
    global passed, failed
    url = f"{BASE}{path}"
    try:
        if method == "GET":
            resp = requests.get(url, timeout=30)
        else:
            resp = requests.post(url, json=json_body, timeout=30)

        data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text

        if resp.status_code == expect_status:
            print(f"  {GREEN}PASS{RESET}  {name}  ({resp.status_code})")
            print(f"        Response: {json.dumps(data, indent=2)[:300]}")
            passed += 1
        else:
            print(f"  {RED}FAIL{RESET}  {name}  (expected {expect_status}, got {resp.status_code})")
            print(f"        Response: {json.dumps(data, indent=2)[:300]}")
            failed += 1
    except requests.ConnectionError as e:
        print(f"  {RED}FAIL{RESET}  {name}  — Could not connect. Is the server running?")
        failed += 1
    except Exception as e:
        print(f"  {RED}FAIL{RESET}  {name}  — {e}")
        failed += 1
    print()


# ────────────────────────────────────────────────────
print("=" * 60)
print("  HackURI API Smoke Tests")
print("=" * 60)
print()

# 1. Health check
print(f"{YELLOW}--- Health ---{RESET}")
test("Health check", "GET", "/api/health")

# 2. Geocoding
time.sleep(1)
print(f"{YELLOW}--- Geocoding ---{RESET}")
test(
    "Forward geocode (valid address)",
    "POST", "/api/geocode/forward",
    {"address": "80 Brown St, Providence, RI"},
)
test(
    "Forward geocode (empty → 400)",
    "POST", "/api/geocode/forward",
    {"address": ""},
    expect_status=400,
)
test(
    "Reverse geocode",
    "POST", "/api/geocode/reverse",
    {"lat": 41.8268, "lng": -71.4029},
)

# 3. Routing
time.sleep(2)
print(f"{YELLOW}--- Walking Route ---{RESET}")
test(
    "Walk route (Providence)",
    "POST", "/api/route/walk",
    {
        "origin": {"lat": 41.8268, "lng": -71.4029},
        "destination": {"lat": 41.8240, "lng": -71.4128},
    },
)
test(
    "Walk route (missing fields → 400)",
    "POST", "/api/route/walk",
    {"origin": {"lat": 41.8268}},
    expect_status=400,
)

time.sleep(3)
print(f"{YELLOW}--- Transit / Commute ---{RESET}")
test(
    "Find transit stops near Providence",
    "POST", "/api/route/transit-stops",
    {"location": {"lat": 41.8268, "lng": -71.4029}, "radius_m": 2000},
)
time.sleep(3)
test(
    "Commute walk legs (transit mode)",
    "POST", "/api/route/commute",
    {
        "origin": {"lat": 41.8268, "lng": -71.4029},
        "destination": {"lat": 41.8240, "lng": -71.4128},
    },
)

# 4. Amenities — add delays to avoid Overpass 429 rate limits
time.sleep(2)
print(f"{YELLOW}--- Amenities ---{RESET}")
test("List amenity types", "GET", "/api/amenities/types")
test(
    "Search gyms near Providence",
    "POST", "/api/amenities/search",
    {
        "location": {"lat": 41.8268, "lng": -71.4029},
        "amenity_type": "gym",
        "radius_m": 2000,
    },
)
time.sleep(3)
test(
    "Search cafes near Providence",
    "POST", "/api/amenities/search",
    {
        "location": {"lat": 41.8268, "lng": -71.4029},
        "amenity_type": "coffee",
    },
)
time.sleep(3)
test(
    "Search grocery near Providence",
    "POST", "/api/amenities/search",
    {
        "location": {"lat": 41.8268, "lng": -71.4029},
        "amenity_type": "grocery",
    },
)

# 5. Score calculation
time.sleep(3)
print(f"{YELLOW}--- Score Calculation ---{RESET}")
test(
    "Full score (transit commute mode)",
    "POST", "/api/score/calculate",
    {
        "home": {"lat": 41.8268, "lng": -71.4029},
        "work": {"lat": 41.8240, "lng": -71.4128},
        "amenities": [
            {"amenity_type": "gym", "visits_per_week": 4},
            {"amenity_type": "grocery", "visits_per_week": 2},
        ],
        "work_days_per_week": 5,
        "commute_mode": "transit",
    },
)
time.sleep(3)
test(
    "Full score (direct walk mode)",
    "POST", "/api/score/calculate",
    {
        "home": {"lat": 41.8268, "lng": -71.4029},
        "work": {"lat": 41.8240, "lng": -71.4128},
        "amenities": [],
        "work_days_per_week": 5,
        "commute_mode": "walk",
    },
)
test(
    "Score (home only, no work/amenities)",
    "POST", "/api/score/calculate",
    {
        "home": {"lat": 41.8268, "lng": -71.4029},
        "amenities": [],
    },
)
test(
    "Score (missing home → 400)",
    "POST", "/api/score/calculate",
    {"amenities": []},
    expect_status=400,
)

# ────────────────────────────────────────────────────
print("=" * 60)
total = passed + failed
print(f"  Results: {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET} / {total} total")
print("=" * 60)
sys.exit(1 if failed else 0)

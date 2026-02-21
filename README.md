# HackURI — WalkScore

Choose a home location based on how much exercise (walking) your daily routine would give you.

## Project Structure

```
HackURI/
├── backend/                   Flask API server
│   ├── run.py                 Entry point (python run.py)
│   ├── requirements.txt       Python dependencies
│   ├── .env / .env.example    Environment config
│   └── app/
│       ├── __init__.py        App factory + blueprint registration
│       ├── config.py          Centralised settings
│       ├── models/            Pydantic request/response schemas
│       ├── routes/            Flask blueprints (HTTP layer)
│       │   ├── geocode.py     /api/geocode/*
│       │   ├── routing.py     /api/route/*
│       │   ├── amenities.py   /api/amenities/*
│       │   └── score.py       /api/score/*
│       └── services/          Business logic (calls external APIs)
│           ├── geocoding_service.py   Nominatim (OSM)
│           ├── routing_service.py     OSRM / OpenRouteService
│           ├── amenities_service.py   Overpass API (OSM)
│           └── score_service.py       Aggregation + scoring
├── frontend/                  Next.js placeholder (WIP)
│   ├── src/app/               App Router pages
│   └── src/components/        React component stubs
├── .gitignore
└── README.md
```

## Quick Start — Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # edit if you have an ORS key
python run.py                 # → http://localhost:5000
```

## API Endpoints

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | /api/geocode/forward  | Address → lat/lng                    |
| POST   | /api/geocode/reverse  | lat/lng → address                    |
| POST   | /api/route/walk       | Walking route between two points     |
| POST   | /api/amenities/search | Find nearby amenities (gym, café…)   |
| GET    | /api/amenities/types  | List supported amenity types         |
| POST   | /api/score/calculate  | Full score calculation                |
| GET    | /api/health           | Health check                         |

### Example — Calculate Score

```bash
curl -X POST http://localhost:5000/api/score/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "home": {"lat": 41.8268, "lng": -71.4029},
    "work": {"lat": 41.8240, "lng": -71.4128},
    "amenities": [
      {"amenity_type": "gym", "visits_per_week": 4},
      {"amenity_type": "grocery", "visits_per_week": 2}
    ],
    "work_days_per_week": 5
  }'
```

## External Services (all free)

| Service              | Purpose                | Limits / Notes                     |
|----------------------|------------------------|------------------------------------|
| **Nominatim**        | Geocoding              | 1 req/sec, needs User-Agent        |
| **OSRM (demo)**      | Walking routes         | Fair use; self-host for production |
| **Overpass API**     | Amenity search (OSM)   | Fair use                           |
| **OpenRouteService** | Routing fallback       | 2000 req/day (free API key)        |

## Score Methodology

1. **Work commute**: OSRM walking route (home → work), doubled for round trip, × workdays/week.
2. **Amenity trips**: For each amenity type, find the nearest one via Overpass, get OSRM walking route, × visits/week.
3. **Aggregate**: Sum all weekly walking minutes → calories (≈ 4 cal/min), compare to WHO 150 min/week guideline → letter grade A+ through F.
The repository for the URI Hackathon.

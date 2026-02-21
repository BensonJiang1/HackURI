/** Server-side config — reads from process.env (Next.js .env.local) */

export const config = {
  NOMINATIM_BASE_URL: process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org",
  OSRM_BASE_URL: process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org",
  OVERPASS_BASE_URL: process.env.OVERPASS_BASE_URL ?? "https://overpass-api.de/api/interpreter",
  ORS_API_KEY: process.env.ORS_API_KEY ?? "",
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? "",
  WALKING_SPEED_KMH: parseFloat(process.env.WALKING_SPEED_KMH ?? "5.0"),
  CALORIES_PER_MINUTE_WALKING: parseFloat(process.env.CALORIES_PER_MINUTE_WALKING ?? "4.0"),
  WHO_WEEKLY_MINUTES: 150,
}

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const bus = new Hono();

const BUS_API_URL =
  "https://tcgbusfs.blob.core.windows.net/blobbus/GetEstimateTime.gz";

const CACHE_TTL_MS = 10_000; // 10 seconds

interface RawBusAPI {
  RouteID: number;
  StopID: number;
  EstimateTime: string; // seconds as string, or negative codes
  GoBack: string; // "0" = outbound, "1" = inbound
}

type RouteNames = Record<string, string>; // key is routeId, value is name

interface Location {
  longitude: number;
  latitude: number;
  stopIds: number[];
}
type Locations = Record<string, Location>; // key is stopLocationId

interface Stop {
  Id: number;
  routeId: number;
  nameZh: string;
  nameEn: string;
  location: number; // stopLocationId
}
type Stops = Record<string, Stop>; // key is stopId

interface BusData {
  routeNames: RouteNames;
  locations: Locations;
  stops: Stops;
}

// ── ETA entry returned to clients ──────────────────────────────────────────

export interface BusETA {
  stopId: number;
  routeId: number;
  routeName: string;
  direction: "inbound" | "outbound";
  estimateSeconds: number; // raw value; negative = special code
  label: string; // human-readable
}

// ── Cache ──────────────────────────────────────────────────────────────────

let etaCache: RawBusAPI[] | null = null;
let etaCachedAt = 0;

// ── Helpers ────────────────────────────────────────────────────────────────

const SPECIAL_LABELS: Record<number, string> = {
  [-1]: "尚未發車",
  [-2]: "交管不停靠",
  [-3]: "末班車已過",
  [-4]: "今日未營運",
};

function etaLabel(seconds: number): string {
  if (seconds < 0) return SPECIAL_LABELS[seconds] ?? "未知";
  if (seconds === 0) return "進站中";
  if (seconds < 60) return `${seconds} 秒`;
  const mins = Math.floor(seconds / 60);
  return `${mins} 分鐘`;
}

// ── Static data load ───────────────────────────────────────────────────────

const { routeNames, locations, stops } = await loadBusStops();
const stopIds = new Set(Object.keys(stops).map((s) => Number(s)));

async function loadBusStops(): Promise<BusData> {
  const file = Bun.file("./src/assets/busData.json");
  if (await file.exists()) {
    return (await file.json()) as BusData;
  }
  return { routeNames: {}, locations: {}, stops: {} };
}

// ── Live ETA fetch (with cache) ────────────────────────────────────────────

async function fetchETA(): Promise<RawBusAPI[]> {
  if (etaCache && Date.now() - etaCachedAt < CACHE_TTL_MS) {
    return etaCache;
  }

  const response = await fetch(BUS_API_URL);
  const arrayBuf = await response.arrayBuffer();
  const decomp = Bun.gunzipSync(new Uint8Array(arrayBuf));
  const text = new TextDecoder().decode(decomp);
  const rawObject = JSON.parse(text)["BusInfo"] as RawBusAPI[];

  etaCache = rawObject.filter((raw) => stopIds.has(raw.StopID));
  etaCachedAt = Date.now();
  return etaCache;
}

function buildETA(raw: RawBusAPI): BusETA | null {
  const stop = stops[String(raw.StopID)];
  if (!stop) return null;

  const routeName = routeNames[String(raw.RouteID)] ?? String(raw.RouteID);
  const estimateSeconds = Number(raw.EstimateTime);

  return {
    stopId: raw.StopID,
    routeId: raw.RouteID,
    routeName,
    direction: raw.GoBack === "1" ? "inbound" : "outbound",
    estimateSeconds,
    label: etaLabel(estimateSeconds),
  };
}

// ── Route: GET /locations ──────────────────────────────────────────────────
// Returns all stop locations with their coordinates and associated stopIds.

bus.get("/locations", async (c) => {
  const locationList = Object.entries(locations).map(([id, loc]) => ({
    id,
    latitude: loc.latitude,
    longitude: loc.longitude,
    stopIds: loc.stopIds,
    // Collect unique station names from stops at this location
    names: [
      ...new Set(
        loc.stopIds
          .map((sid) => stops[String(sid)]?.nameZh)
          .filter(Boolean) as string[]
      ),
    ],
  }));

  return c.json({
    locations: locationList,
    count: locationList.length,
    cachedAt: new Date().toISOString(),
  });
});

// ── Route: GET /stops ──────────────────────────────────────────────────────
// Returns all individual stops (each stop belongs to one route + location).

bus.get("/stops", async (c) => {
  const stopList = Object.entries(stops).map(([id, stop]) => ({
    id: Number(id),
    routeId: stop.routeId,
    routeName: routeNames[String(stop.routeId)] ?? String(stop.routeId),
    nameZh: stop.nameZh,
    nameEn: stop.nameEn,
    locationId: stop.location,
    latitude: locations[String(stop.location)]?.latitude,
    longitude: locations[String(stop.location)]?.longitude,
  }));

  return c.json({ stops: stopList, count: stopList.length });
});

// ── Route: GET /eta ────────────────────────────────────────────────────────
// Returns all ETA entries (optionally filtered by stopId or locationId).

const etaQuerySchema = z.object({
  stopId: z.coerce.number().int().optional(),
  locationId: z.coerce.number().int().optional(),
  routeId: z.coerce.number().int().optional(),
});

bus.get("/eta", zValidator("query", etaQuerySchema), async (c) => {
  const { stopId, locationId, routeId } = c.req.valid("query");
  const rawData = await fetchETA();

  let filtered = rawData;

  if (stopId !== undefined) {
    filtered = filtered.filter((r) => r.StopID === stopId);
  }

  if (locationId !== undefined) {
    const locStopIds = new Set(locations[String(locationId)]?.stopIds ?? []);
    filtered = filtered.filter((r) => locStopIds.has(r.StopID));
  }

  if (routeId !== undefined) {
    filtered = filtered.filter((r) => r.RouteID === routeId);
  }

  const etas = filtered.map(buildETA).filter(Boolean) as BusETA[];

  // Sort: active arrivals first (by seconds asc), then special codes last
  etas.sort((a, b) => {
    const aActive = a.estimateSeconds >= 0;
    const bActive = b.estimateSeconds >= 0;
    if (aActive && bActive) return a.estimateSeconds - b.estimateSeconds;
    if (aActive) return -1;
    if (bActive) return 1;
    return a.estimateSeconds - b.estimateSeconds;
  });

  return c.json({
    etas,
    count: etas.length,
    cachedAt: new Date(etaCachedAt).toISOString(),
  });
});

// ── Route: GET /eta/location/:locationId ──────────────────────────────────
// Convenience endpoint: all ETAs for every stop at a given location,
// grouped by routeName for easy sidebar display.

bus.get("/eta/location/:locationId", async (c) => {
  const locationId = c.req.param("locationId");
  const location = locations[locationId];

  if (!location) {
    return c.json({ error: "Location not found" }, 404);
  }

  const rawData = await fetchETA();
  const locStopIds = new Set(location.stopIds);

  const etas = rawData
    .filter((r) => locStopIds.has(r.StopID))
    .map(buildETA)
    .filter(Boolean) as BusETA[];

  // Deduplicate: keep lowest estimateSeconds per (routeId, direction)
  const best = new Map<string, BusETA>();
  for (const eta of etas) {
    const key = `${eta.routeId}-${eta.direction}`;
    const existing = best.get(key);
    if (!existing) {
      best.set(key, eta);
    } else {
      // Prefer active arrivals; among active prefer smaller seconds
      const existActive = existing.estimateSeconds >= 0;
      const newActive = eta.estimateSeconds >= 0;
      if (newActive && (!existActive || eta.estimateSeconds < existing.estimateSeconds)) {
        best.set(key, eta);
      }
    }
  }

  const result = [...best.values()].sort((a, b) => {
    const aActive = a.estimateSeconds >= 0;
    const bActive = b.estimateSeconds >= 0;
    if (aActive && bActive) return a.estimateSeconds - b.estimateSeconds;
    if (aActive) return -1;
    if (bActive) return 1;
    return 0;
  });

  const locationNames = [
    ...new Set(
      location.stopIds
        .map((sid) => stops[String(sid)]?.nameZh)
        .filter(Boolean) as string[]
    ),
  ];

  return c.json({
    locationId,
    names: locationNames,
    latitude: location.latitude,
    longitude: location.longitude,
    etas: result,
    count: result.length,
    cachedAt: new Date(etaCachedAt).toISOString(),
  });
});
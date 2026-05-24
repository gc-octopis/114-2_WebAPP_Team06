import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const youbike = new Hono();

const YOUBIKE_API_URL =
  process.env.YOUBIKE_API_URL ??
  "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";
const CACHE_TTL_MS = 60_000;
const NTU_MAIN_GATE = { lat: 25.01734, lng: 121.53975 };

type RawYouBikeStation = {
  sno?: string;
  sna?: string;
  sarea?: string;
  mday?: string;
  ar?: string;
  total?: number | string;
  quantity?: number | string;
  Quantity?: number | string;
  available_rent_bikes?: number | string;
  available_return_bikes?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  act?: string | number;
  srcUpdateTime?: string;
  updateTime?: string;
  infoTime?: string;
};

type YouBikeStation = {
  id: string;
  name: string;
  area: string;
  address: string;
  totalDocks: number;
  availableBikes: number;
  availableReturns: number;
  latitude: number;
  longitude: number;
  isActive: boolean;
  updatedAt: string;
  distanceMeters?: number;
};

let cachedStations: YouBikeStation[] | null = null;
let cachedAt = 0;

const querySchema = z.object({
  q: z.string().trim().optional(),
  area: z.string().trim().optional(),
  near: z.enum(["ntu"]).optional(),
  north: z.coerce.number().min(-90).max(90).optional(),
  south: z.coerce.number().min(-90).max(90).optional(),
  east: z.coerce.number().min(-180).max(180).optional(),
  west: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});

function toNumber(value: number | string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeName(name = ""): string {
  return name.replace(/^YouBike2\.0_/, "").trim();
}

function distanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const radius = 6_371_000;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizeStation(station: RawYouBikeStation): YouBikeStation {
  const latitude = toNumber(station.latitude);
  const longitude = toNumber(station.longitude);

  return {
    id: station.sno ?? "",
    name: normalizeName(station.sna),
    area: station.sarea ?? "",
    address: station.ar ?? "",
    totalDocks: toNumber(station.quantity ?? station.Quantity ?? station.total),
    availableBikes: toNumber(station.available_rent_bikes),
    availableReturns: toNumber(station.available_return_bikes),
    latitude,
    longitude,
    isActive: String(station.act ?? "0") === "1",
    updatedAt:
      station.infoTime ??
      station.srcUpdateTime ??
      station.updateTime ??
      station.mday ??
      "",
  };
}

async function fetchYouBikeStations(): Promise<YouBikeStation[]> {
  if (cachedStations && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedStations;
  }

  try {
    const response = await fetch(YOUBIKE_API_URL);
    if (!response.ok) {
      throw new Error(`YouBike API failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("YouBike API returned an unexpected payload");
    }

    cachedStations = data.map((station) => normalizeStation(station));
    cachedAt = Date.now();
    return cachedStations;
  } catch (error) {
    if (cachedStations) {
      console.warn("Using stale YouBike cache:", error);
      return cachedStations;
    }

    throw error;
  }
}

youbike.get("/", zValidator("query", querySchema), async (c) => {
  const { q, area, near, north, south, east, west, limit } = c.req.valid("query");
  const keyword = q?.toLowerCase();
  let stations = await fetchYouBikeStations();
  const hasBounds =
    typeof north === "number" &&
    typeof south === "number" &&
    typeof east === "number" &&
    typeof west === "number" &&
    north >= south &&
    east >= west;

  if (area) {
    stations = stations.filter((station) => station.area === area);
  }

  if (hasBounds) {
    stations = stations.filter(
      (station) =>
        station.latitude >= south &&
        station.latitude <= north &&
        station.longitude >= west &&
        station.longitude <= east,
    );
  }

  if (keyword) {
    stations = stations.filter((station) =>
      `${station.name} ${station.area} ${station.address}`.toLowerCase().includes(keyword),
    );
  }

  stations = stations.map((station) => ({
    ...station,
    distanceMeters: distanceMeters(NTU_MAIN_GATE, {
      lat: station.latitude,
      lng: station.longitude,
    }),
  }));

  if (near === "ntu" || !hasBounds) {
    stations = stations.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }

  return c.json({
    stations: stations.slice(0, limit),
    count: stations.length,
    source: YOUBIKE_API_URL,
    cachedAt: new Date(cachedAt).toISOString(),
  });
});

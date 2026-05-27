export class BusAPI {
  static async getLocations(options = {}) {
    const response = await fetch("/api/bus/locations", {
      signal: options.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return {
      locations: data.locations || [],
      count: data.count || 0,
      cachedAt: data.cachedAt || "",
    };
  }

  static async getETAForLocation(locationId, options = {}) {
    const response = await fetch(`/api/bus/eta/location/${locationId}`, {
      signal: options.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return {
      locationId: data.locationId,
      names: data.names || [],
      latitude: data.latitude,
      longitude: data.longitude,
      etas: data.etas || [],
      count: data.count || 0,
      cachedAt: data.cachedAt || "",
    };
  }

  static async getAllETA(options = {}) {
    const params = new URLSearchParams();
    if (options.stopId) params.append("stopId", String(options.stopId));
    if (options.routeId) params.append("routeId", String(options.routeId));
    const query = params.toString();

    const response = await fetch(`/api/bus/eta${query ? `?${query}` : ""}`, {
      signal: options.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return {
      etas: data.etas || [],
      count: data.count || 0,
      cachedAt: data.cachedAt || "",
    };
  }
}

export class YouBikeAPI {
    static async getStations(options = {}) {
        const params = new URLSearchParams();

        if (options.q) {
            params.append("q", options.q);
        }
        if (options.area) {
            params.append("area", options.area);
        }
        if (options.near) {
            params.append("near", options.near);
        }
        if (options.bounds) {
            params.append("north", String(options.bounds.north));
            params.append("south", String(options.bounds.south));
            params.append("east", String(options.bounds.east));
            params.append("west", String(options.bounds.west));
        }
        if (options.limit) {
            params.append("limit", String(options.limit));
        }

        const query = params.toString();
        const response = await fetch(`/api/youbike/${query ? `?${query}` : ""}`, {
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
            stations: data.stations || [],
            count: data.count || 0,
            cachedAt: data.cachedAt || "",
            source: data.source || "",
        };
    }
}

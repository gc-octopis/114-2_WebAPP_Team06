import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { YouBikeAPI } from "./youbikeAPI";

const NTU_CENTER = [25.01734, 121.53975];
const DEFAULT_MAP_LIMIT = 250;
const LIST_PAGE_SIZE = 9;

function formatDistance(distanceMeters) {
    if (typeof distanceMeters !== "number") {
        return "";
    }

    if (distanceMeters >= 1000) {
        return `${(distanceMeters / 1000).toFixed(1)} km`;
    }

    return `${distanceMeters} m`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function YouBike() {
    const [stations, setStations] = useState([]);
    const [viewMode, setViewMode] = useState("map");
    const [selectedStationId, setSelectedStationId] = useState("");
    const [query, setQuery] = useState("");
    const [updatedAt, setUpdatedAt] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [visibleCount, setVisibleCount] = useState(0);
    const [listPage, setListPage] = useState(1);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef(null);
    const moveTimerRef = useRef(null);
    const requestSeqRef = useRef(0);
    const queryRef = useRef(query);
    const selectedStation =
        stations.find((station) => station.id === selectedStationId) || stations[0];
    const totalListPages = Math.max(1, Math.ceil(stations.length / LIST_PAGE_SIZE));
    const visibleListStations = stations.slice(
        (listPage - 1) * LIST_PAGE_SIZE,
        listPage * LIST_PAGE_SIZE,
    );

    useEffect(() => {
        queryRef.current = query;
        setListPage(1);
    }, [query]);

    useEffect(() => {
        setListPage((currentPage) => Math.min(currentPage, totalListPages));
    }, [totalListPages]);

    const loadStations = useCallback(async (options = {}) => {
        const requestId = requestSeqRef.current + 1;
        requestSeqRef.current = requestId;
        setIsLoading(true);
        setError("");

        try {
            const result = await YouBikeAPI.getStations({
                q: queryRef.current,
                near: options.bounds || queryRef.current ? undefined : "ntu",
                bounds: options.bounds,
                limit: options.bounds ? DEFAULT_MAP_LIMIT : 24,
                signal: options.signal,
            });

            if (requestSeqRef.current !== requestId) {
                return;
            }

            setStations(result.stations);
            setVisibleCount(result.count);
            setUpdatedAt(result.cachedAt);
            setSelectedStationId((currentId) => {
                if (result.stations.some((station) => station.id === currentId)) {
                    return currentId;
                }
                return result.stations[0]?.id || "";
            });
        } catch (err) {
            if (err?.name === "AbortError" || requestSeqRef.current !== requestId) {
                return;
            }

            setError("YouBike 資料讀取失敗，請稍後再試。");
            setStations([]);
            setVisibleCount(0);
        } finally {
            if (requestSeqRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, []);

    const getCurrentMapBounds = useCallback(() => {
        const map = mapRef.current;
        if (!map) {
            return null;
        }

        const bounds = map.getBounds();
        return {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            const bounds = getCurrentMapBounds();
            loadStations({ bounds, signal: controller.signal });
        }, 250);
        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [getCurrentMapBounds, loadStations, query]);

    useEffect(() => {
        if (viewMode !== "map" || !mapContainerRef.current) {
            return;
        }

        if (mapRef.current && mapRef.current.getContainer() !== mapContainerRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            markersRef.current = null;
        }

        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                center: NTU_CENTER,
                zoom: 17,
                scrollWheelZoom: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(mapRef.current);

            markersRef.current = L.layerGroup().addTo(mapRef.current);
            mapRef.current.on("moveend", () => {
                window.clearTimeout(moveTimerRef.current);
                moveTimerRef.current = window.setTimeout(() => {
                    const bounds = getCurrentMapBounds();
                    if (bounds) {
                        loadStations({ bounds });
                    }
                }, 350);
            });

            window.setTimeout(() => {
                const bounds = getCurrentMapBounds();
                if (bounds) {
                    loadStations({ bounds });
                }
            }, 0);
        }

        window.setTimeout(() => mapRef.current?.invalidateSize(), 0);
    }, [getCurrentMapBounds, loadStations, viewMode]);

    useEffect(() => {
        if (viewMode !== "map" || !mapRef.current || !markersRef.current) {
            return;
        }

        const map = mapRef.current;
        const markers = markersRef.current;
        markers.clearLayers();

        stations.forEach((station) => {
            const position = [station.latitude, station.longitude];

            const marker = L.marker(position, {
                icon: L.divIcon({
                    className: "",
                    html: `<div class="youbike-leaflet-marker ${station.id === selectedStationId ? "active" : ""}">${station.availableBikes}</div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                }),
                title: `${station.name}，可借 ${station.availableBikes}，可還 ${station.availableReturns}`,
            });

            marker.on("click", () => {
                setSelectedStationId(station.id);
            });

            marker.bindPopup(`
                <strong>${escapeHtml(station.name)}</strong><br>
                可借 ${station.availableBikes} / 可還 ${station.availableReturns}<br>
                ${escapeHtml(station.address)}
            `);

            marker.addTo(markers);
        });

        window.setTimeout(() => map.invalidateSize(), 0);
    }, [stations, selectedStationId, viewMode]);

    useEffect(() => {
        if (viewMode === "map") {
            return;
        }

        if (mapRef.current) {
            window.clearTimeout(moveTimerRef.current);
            mapRef.current.remove();
            mapRef.current = null;
            markersRef.current = null;
        }
    }, [viewMode]);

    useEffect(() => {
        return () => {
            window.clearTimeout(moveTimerRef.current);
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markersRef.current = null;
            }
        };
    }, []);

    return (
        <section className="general-section youbike-section">
            <div className="youbike-heading">
                <h2 className="section-title">🚲 YouBike 即時車況</h2>
                {updatedAt && (
                    <span className="youbike-updated">
                        顯示 {stations.length}/{visibleCount || stations.length} 站 · 更新 {new Date(updatedAt).toLocaleTimeString("zh-TW", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                )}
            </div>

            <div className="youbike-toolbar">
                <input
                    className="youbike-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜尋站名、行政區或地址"
                    aria-label="搜尋 YouBike 站點"
                />
                <div className="youbike-view-toggle" aria-label="切換 YouBike 顯示方式">
                    <button
                        type="button"
                        className={viewMode === "map" ? "active" : ""}
                        onClick={() => setViewMode("map")}
                    >
                        地圖
                    </button>
                    <button
                        type="button"
                        className={viewMode === "list" ? "active" : ""}
                        onClick={() => setViewMode("list")}
                    >
                        清單
                    </button>
                </div>
            </div>

            {error && <p className="youbike-message">{error}</p>}
            {isLoading && <p className="youbike-message">載入 YouBike 即時資料中...</p>}

            {!error && viewMode === "map" && (
                <div className="youbike-map-layout">
                    <div className="youbike-map" ref={mapContainerRef} aria-label="YouBike 站點地圖" />

                    {selectedStation && (
                        <article className="youbike-map-detail">
                            <h3 className="youbike-station-name">{selectedStation.name}</h3>
                            <p className="youbike-station-meta">
                                {selectedStation.area}
                                {selectedStation.distanceMeters
                                    ? ` · ${formatDistance(selectedStation.distanceMeters)}`
                                    : ""}
                            </p>
                            <div className="youbike-counts">
                                <div>
                                    <span className="youbike-count">{selectedStation.availableBikes}</span>
                                    <span className="youbike-label">可借</span>
                                </div>
                                <div>
                                    <span className="youbike-count">{selectedStation.availableReturns}</span>
                                    <span className="youbike-label">可還</span>
                                </div>
                            </div>
                            <p className="youbike-address">{selectedStation.address}</p>
                        </article>
                    )}
                </div>
            )}

            {!isLoading && !error && viewMode === "list" && (
                <>
                    <div className="youbike-grid">
                        {visibleListStations.map((station) => (
                            <article className="youbike-card" key={station.id}>
                                <div>
                                    <h3 className="youbike-station-name">{station.name}</h3>
                                    <p className="youbike-station-meta">
                                        {station.area}
                                        {station.distanceMeters ? ` · ${formatDistance(station.distanceMeters)}` : ""}
                                    </p>
                                </div>

                                <div className="youbike-counts">
                                    <div>
                                        <span className="youbike-count">{station.availableBikes}</span>
                                        <span className="youbike-label">可借</span>
                                    </div>
                                    <div>
                                        <span className="youbike-count">{station.availableReturns}</span>
                                        <span className="youbike-label">可還</span>
                                    </div>
                                </div>

                                <p className="youbike-address">{station.address}</p>
                            </article>
                        ))}
                    </div>

                    {totalListPages > 1 && (
                        <div className="youbike-pagination">
                            <button
                                type="button"
                                onClick={() => setListPage((page) => Math.max(1, page - 1))}
                                disabled={listPage === 1}
                            >
                                上一頁
                            </button>
                            <span>{listPage} / {totalListPages} · 共 {stations.length} 站</span>
                            <button
                                type="button"
                                onClick={() => setListPage((page) => Math.min(totalListPages, page + 1))}
                                disabled={listPage === totalListPages}
                            >
                                下一頁
                            </button>
                        </div>
                    )}
                </>
            )}

            {!isLoading && !error && stations.length === 0 && (
                <p className="youbike-message">找不到符合條件的 YouBike 站點。</p>
            )}
        </section>
    );
}

export default YouBike;

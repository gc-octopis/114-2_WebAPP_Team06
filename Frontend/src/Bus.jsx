import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { BusAPI } from "./busAPI";
import './bus.css';

const NTU_CENTER = [25.01734, 121.53975];
const ETA_REFRESH_MS = 10_000;

// ── Helpers ──────────────────────────────────────────────────────────────

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function etaColor(seconds) {
  if (seconds < 0) return "eta-special";
  if (seconds === 0) return "eta-arriving";
  if (seconds < 120) return "eta-soon";
  if (seconds < 300) return "eta-ok";
  return "eta-far";
}

// ── Component ─────────────────────────────────────────────────────────────

function Bus() {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [etas, setEtas] = useState([]);
  const [etaNames, setEtaNames] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [isLoadingETA, setIsLoadingETA] = useState(false);
  const [error, setError] = useState("");
  const [etaError, setEtaError] = useState("");
  const [query, setQuery] = useState("");
  const [countdown, setCountdown] = useState(ETA_REFRESH_MS / 1000);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const etaTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const selectedIdRef = useRef(selectedLocationId);

  useEffect(() => {
    selectedIdRef.current = selectedLocationId;
  }, [selectedLocationId]);

  // ── Load all stop locations once ────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingMap(true);

    BusAPI.getLocations({ signal: controller.signal })
      .then((result) => {
        setLocations(result.locations);
        setUpdatedAt(result.cachedAt);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setError("公車站點資料讀取失敗，請稍後再試。");
      })
      .finally(() => setIsLoadingMap(false));

    return () => controller.abort();
  }, []);

  // ── Fetch ETA for selected location ─────────────────────────────────────

  const fetchETA = useCallback(
    async (signal) => {
      const id = selectedIdRef.current;
      if (!id) return;
      setIsLoadingETA(true);
      setEtaError("");

      try {
        const result = await BusAPI.getETAForLocation(id, { signal });
        setEtas(result.etas);
        setEtaNames(result.names);
        setUpdatedAt(result.cachedAt);
        setCountdown(ETA_REFRESH_MS / 1000);
      } catch (err) {
        if (err?.name !== "AbortError") setEtaError("ETA 讀取失敗，請稍後再試。");
      } finally {
        setIsLoadingETA(false);
      }
    },
    [],
  );

  // ── Auto-refresh every 10 s ──────────────────────────────────────────────

  useEffect(() => {
    if (!selectedLocationId) return;

    const controller = new AbortController();
    fetchETA(controller.signal);

    etaTimerRef.current = window.setInterval(() => {
      fetchETA(undefined);
    }, ETA_REFRESH_MS);

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? ETA_REFRESH_MS / 1000 : prev - 1));
    }, 1000);

    return () => {
      controller.abort();
      window.clearInterval(etaTimerRef.current);
      window.clearInterval(countdownTimerRef.current);
    };
  }, [selectedLocationId, fetchETA]);

  // ── Initialise Leaflet map ───────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: NTU_CENTER,
      zoom: 16,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markersRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
      }
    };
  }, []);

  // ── Render markers whenever locations/selection/query change ────────────

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    const keyword = query.toLowerCase();
    const filtered = keyword
      ? locations.filter((loc) =>
          loc.names.some((n) => n.toLowerCase().includes(keyword)),
        )
      : locations;

    markersRef.current.clearLayers();

    filtered.forEach((loc) => {
      const isSelected = loc.id === selectedLocationId;

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: L.divIcon({
          className: "",
          html: `<div class="bus-leaflet-marker ${isSelected ? "active" : ""}">
                   <span class="bus-marker-icon">🚌</span>
                 </div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        }),
        title: loc.names.join(" / "),
      });

      marker.on("click", () => {
        setSelectedLocationId(loc.id);
      });

      marker.bindPopup(
        `<strong>${escapeHtml(loc.names[0] ?? "")}</strong><br>點擊查看到站時間`,
      );

      marker.addTo(markersRef.current);
    });

    window.setTimeout(() => mapRef.current?.invalidateSize(), 0);
  }, [locations, selectedLocationId, query]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const selectedName = etaNames[0] ?? "請選擇站點";

  return (
    <section className="general-section bus-section">
      {/* Header */}
      <div className="bus-heading">
        <h2 className="section-title">🚌 公車即時到站</h2>
        {updatedAt && (
          <span className="bus-updated">
            更新{" "}
            {new Date(updatedAt).toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="bus-toolbar">
        <input
          className="bus-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋站名"
          aria-label="搜尋公車站"
        />
      </div>

      {error && <p className="bus-message error">{error}</p>}
      {isLoadingMap && <p className="bus-message">載入公車站點資料中...</p>}

      {/* Map + ETA side-panel */}
      {!error && (
        <div className="bus-map-layout">
          {/* Leaflet map */}
          <div
            className="bus-map"
            ref={mapContainerRef}
            aria-label="公車站點地圖"
          />

          {/* ETA panel */}
          <aside className="bus-eta-panel">
            {!selectedLocationId ? (
              <div className="bus-eta-placeholder">
                <span className="bus-eta-placeholder-icon">👆</span>
                <p>點擊地圖上的站點</p>
                <p>查看即時到站時間</p>
              </div>
            ) : (
              <>
                <div className="bus-eta-header">
                  <h3 className="bus-eta-station-name">{selectedName}</h3>
                  {etaNames.length > 1 && (
                    <p className="bus-eta-aliases">{etaNames.slice(1).join(" · ")}</p>
                  )}
                  <div className="bus-eta-refresh-row">
                    <span className="bus-eta-countdown">
                      {isLoadingETA ? "更新中…" : `${countdown} 秒後自動更新`}
                    </span>
                    <button
                      className="bus-eta-refresh-btn"
                      onClick={() => fetchETA()}
                      disabled={isLoadingETA}
                      aria-label="立即重新整理"
                    >
                      ↺
                    </button>
                  </div>
                </div>

                {etaError && <p className="bus-message error">{etaError}</p>}

                {!etaError && etas.length === 0 && !isLoadingETA && (
                  <p className="bus-message">此站目前無班次資料。</p>
                )}

                <ul className="bus-eta-list">
                  {etas.map((eta, i) => (
                    <li key={`${eta.routeId}-${eta.direction}-${i}`} className="bus-eta-row">
                      <div className="bus-eta-route-info">
                        <span className="bus-eta-route-name">{eta.routeName}</span>
                        <span className="bus-eta-direction">
                          {eta.direction === "inbound" ? "返程" : "去程"}
                        </span>
                      </div>
                      <span className={`bus-eta-time ${etaColor(eta.estimateSeconds)}`}>
                        {eta.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

export default Bus;

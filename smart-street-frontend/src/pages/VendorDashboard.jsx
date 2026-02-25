import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import VendorSidebar from "../components/VendorSidebar.jsx";
import VendorActionBar from "../components/VendorActionBar.jsx";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import MapContainerFullscreen from "../components/MapContainerFullscreen.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import NotificationModal from "../components/NotificationModal.jsx";
import PermitQRModal from "../components/PermitQRModal.jsx";
import RequestDetailModal from "../components/RequestDetailModal.jsx";
import VoiceAssistant from "../components/VoiceAssistant.jsx";
import { parseBookingIntent } from "../utils/voiceUtils.js";
import ThemeToggle from "../components/ThemeToggle.jsx";

import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import UserDropdown from "../components/UserDropdown.jsx";
import VendorHome from "../components/vendor/VendorHome.jsx";
import VendorStorefront from "../components/vendor/VendorStorefront.jsx";
import WeatherWidget from "../components/WeatherWidget.jsx";
import {
  HomeIcon,
  MapIcon,
  BuildingStorefrontIcon
} from "@heroicons/react/24/outline";

const defaultCenter = [11.3410, 77.7172];

// Simple Haversine distance helper (meters)
const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapClickCatcher = ({ onClick, intent }) => {
  useMapEvents({
    click: e => {
      if (intent === "REQUEST_NEW") {
        // Allow click anywhere - auto-detection handles the rest
        onClick([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
};

const MapZoomToSpace = ({ lat, lng, radius }) => {
  const map = useMap();

  useEffect(() => {
    if (!lat || !lng || !map) return;

    const timer = setTimeout(() => {
      try {
        // Convert radius (meters) to approximate degrees for zoom bounds
        const latDegPerMeter = 1 / 111320;
        const zoomedRadius = (radius || 120) * latDegPerMeter * 2; // padding

        map.setView([lat, lng], map.getZoom(), { animate: true });

        const bounds = [
          [lat - zoomedRadius, lng - zoomedRadius],
          [lat + zoomedRadius, lng + zoomedRadius]
        ];
        map.fitBounds(bounds, {
          padding: [8, 8],
          maxZoom: 22,
          animate: true,
          duration: 1.0
        });
      } catch (err) {
        console.error("Error zooming to space:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [lat, lng, radius, map]);

  return null;
};

// New Component: Fly to specific coordinates on command
const MapFlyTo = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length === 2) {
      map.flyTo(coords, 16, { animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

const dimsFromRadius = radius => {
  // We store width/length in the API, but UX uses a single radius.
  // Choose square dims where half-diagonal == radius: side = radius * sqrt(2)
  const side = Number(radius) * Math.SQRT2;
  return { maxWidth: side, maxLength: side };
};

import { STATUS_COLORS } from "../utils/constants.js";

export default function VendorDashboard() {
  const { t } = useTranslation();
  const { user, logout, fetchNotifications } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [spaces, setSpaces] = useState([]);
  const [requests, setRequests] = useState([]);
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);

  const [intent, setIntent] = useState(null); // "OWNER_DEFINED" | "REQUEST_NEW"
  const [form, setForm] = useState({ startTime: "", endTime: "" });
  const [requestedRadius, setRequestedRadius] = useState(""); // meters (only for REQUEST_NEW)

  const [pin, setPin] = useState(null); // [lat, lng] only for REQUEST_NEW
  const [flyToCoords, setFlyToCoords] = useState(null); // For programmatic moves (voice)
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedPermitForQr, setSelectedPermitForQr] = useState(null);

  // Request Detail State
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(""); // "Processing...", "Locating...", etc.
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("HOME"); // "HOME", "MAP", "STOREFRONT"
  const [favorites, setFavorites] = useState([]);



  const handleVoiceCommand = (transcript) => {
    // If user closed manually (null transcript), clear status
    if (!transcript) {
      setVoiceStatus("");
      return;
    }

    setVoiceStatus("Processing...");
    const result = parseBookingIntent(transcript, spaces);

    // 1. Handle Space Selection or Search
    if (result.spaceId) {
      setIntent("OWNER_DEFINED");
      setSelectedSpaceId(result.spaceId);
      setVoiceStatus("Space identified: " + (result.spaceName || "Unknown"));
      setTimeout(() => completeVoiceAction(result), 800);
    } else if (result.searchQuery) {
      // Perform Geocoding Search
      setVoiceStatus(`Searching "${result.searchQuery}"...`);
      handleGeocodeSearch(result.searchQuery, result);
    } else if (result.missingFields.includes("location") && !selectedSpaceId) {
      setVoiceStatus("Location details missing.");
      showError("I heard clearly, but didn't catch a location. Try again?");
      setTimeout(() => setVoiceStatus(""), 3000);
    } else {
      // Maybe location is already selected manually
      setVoiceStatus("Using current selection...");
      completeVoiceAction(result);
    }
  };

  const handleGeocodeSearch = async (query, result) => {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await resp.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        // Select logic
        setIntent("REQUEST_NEW");
        handlePinSet([lat, lon]);
        setRequestedRadius(50);

        // Fly to location
        setFlyToCoords([lat, lon]);

        setVoiceStatus("Location found.");
        completeVoiceAction(result, `Found "${query}"`);
      } else {
        // Fallback: Fill search bar
        setVoiceStatus("Location not found.");
        setMapSearchQuery(query);
        showError(`Could not find "${query}". Please select from the search dropdown.`);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      setVoiceStatus("Search failed.");
      setMapSearchQuery(query);
      showError("Search failed. Please try the manual search bar.");
    }
  };

  const completeVoiceAction = (result, extraMsg = "") => {
    // 2. Handle Time Selection
    if (result.startTime && result.endTime) {
      setVoiceStatus(prev => "Updating dates...");

      const toLocalISO = (iso) => {
        const d = new Date(iso);
        const pad = n => n < 10 ? '0' + n : n;
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setForm(prev => ({
        ...prev,
        startTime: toLocalISO(result.startTime),
        endTime: toLocalISO(result.endTime)
      }));

      setTimeout(() => setVoiceStatus("Date & Time updated."), 600);
    } else {
      setVoiceStatus("Dates not found in speech.");
    }

    // 3. Feedback
    if (result.spaceName && result.startTime) {
      showSuccess(`Autofilled for ${result.spaceName}`);
    } else if (result.spaceName) {
      showSuccess(`Selected ${result.spaceName}. When?`);
    } else if (result.startTime) {
      if (extraMsg) {
        showSuccess(`${extraMsg}. Time set.`);
      } else {
        showSuccess("Time set. Where?");
      }
    } else if (extraMsg) {
      showSuccess(`${extraMsg}`);
    } else {
      if (!result.spaceId && !result.searchQuery) {
        showError("Could not understand command. Try 'Book near [Space] tomorrow 6pm to 8pm'");
      }
    }

    // Clear status after delay
    setTimeout(() => setVoiceStatus(""), 5000);
  };

  const handleOpenQr = (permit) => {
    setSelectedPermitForQr(permit);
    setShowQrModal(true);
  };

  // Auto-detect space for a given location
  const handlePinSet = ([lat, lng]) => {
    setPin([lat, lng]);

    // Find if this point is inside any owner space
    const matchedSpace = spaces.find(s => {
      const dist = getDistanceMeters(lat, lng, Number(s.lat), Number(s.lng));
      return dist <= Number(s.allowed_radius);
    });

    if (matchedSpace) {
      setSelectedSpaceId(matchedSpace.space_id);
    } else {
      // It's okay if no space matches - we allow custom locations now
      setSelectedSpaceId(null);
    }
  };

  const markerDragHandlers = useMemo(
    () => ({
      dragend(e) {
        const { lat, lng } = e.target.getLatLng();
        handlePinSet([lat, lng]);
      },
    }),
    [spaces], // Re-create if spaces change
  );

  const selectedSpace = useMemo(() => spaces.find(s => String(s.space_id) === String(selectedSpaceId)), [spaces, selectedSpaceId]);

  const ownerDefinedRadius = selectedSpace?.allowed_radius ? Number(selectedSpace.allowed_radius) : 0;
  const newRequestRadius = requestedRadius ? Number(requestedRadius) : 0;
  const previewRadius = intent === "OWNER_DEFINED" ? ownerDefinedRadius : newRequestRadius;

  const fetchSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/vendor/spaces");
      const spacesList = data.spaces || [];
      setSpaces(spacesList);
      if (spacesList.length === 0) {
        setError("No public spaces available. Ask an owner to create spaces first.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load spaces");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/vendor/requests");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  };

  const [analyticsData, setAnalyticsData] = useState([]);

  const fetchPermits = async () => {
    try {
      const { data } = await api.get("/vendor/permits");
      setPermits(data.permits || []);
    } catch (err) {
      console.error("Failed to load permits:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get("/vendor/analytics");
      setAnalyticsData(data.analytics || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get("/vendor/favorites");
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  };

  const handleToggleFavorite = async (spaceId) => {
    try {
      await api.post("/vendor/favorites", { spaceId });
      fetchFavorites();
    } catch (err) {
      showError("Failed to update favorites");
    }
  };

  useEffect(() => {
    fetchSpaces();
    fetchRequests();
    fetchPermits();
    fetchAnalytics();
    fetchFavorites();
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset state when intent changes (prevents the “pin always created” bug)
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setPin(null);
    setRequestedRadius("");
  }, [intent]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!intent) {
      showError("Choose an intent first: use an owner-defined location or request a new location.");
      return;
    }

    const startIso = new Date(form.startTime).toISOString();
    const endIso = new Date(form.endTime).toISOString();

    let lat = null;
    let lng = null;
    let radius = 0;

    if (intent === "OWNER_DEFINED") {
      if (!selectedSpaceId) {
        showError("Please select an owner space");
        return;
      }
      // ... existing validation
      if (!selectedSpace?.lat || !selectedSpace?.lng || !ownerDefinedRadius) {
        showError("Selected space is missing location data");
        return;
      }
      lat = Number(selectedSpace.lat);
      lng = Number(selectedSpace.lng);
      radius = ownerDefinedRadius; // locked

    } else if (intent === "REQUEST_NEW") {
      if (!pin) {
        showError("Tap on the map to place a pin for the new location");
        return;
      }
      if (!newRequestRadius || newRequestRadius <= 0) {
        showError("Choose a radius greater than 0 meters");
        return;
      }
      lat = pin[0];
      lng = pin[1];
      radius = newRequestRadius;

      // If we auto-detected a space, great. If not, submit as standalone (spaceId=null).
      // selectedSpaceId is already set/unset by handlePinSet
    } else {
      showError("Invalid intent");
      return;
    }

    const dims = dimsFromRadius(radius);
    const payload = {
      spaceId: selectedSpaceId,
      lat,
      lng,
      maxWidth: dims.maxWidth,
      maxLength: dims.maxLength,
      startTime: startIso,
      endTime: endIso
    };

    setSaving(true);
    try {
      await api.post("/vendor/requests", payload);
      showSuccess("Request submitted successfully!");
      setForm({ startTime: "", endTime: "" });
      setPin(null);
      setRequestedRadius("");
      setSelectedSpaceId(null);
      setIntent(null);
      fetchRequests();
      fetchPermits();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit request";
      showError(msg);
      if (err.response?.data?.conflicts) {
        console.error("Conflicts:", err.response.data.conflicts);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">


      <header className="flex-none bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-[5000]">
        <div className="relative px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="hidden lg:block">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-black tracking-widest">SMART STREET</p>
            </Link>

            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveSection("HOME")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "HOME" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                <HomeIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => setActiveSection("MAP")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "MAP" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                <MapIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Explore Map</span>
              </button>
              <button
                onClick={() => setActiveSection("STOREFRONT")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "STOREFRONT" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                <BuildingStorefrontIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Storefront</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3 text-sm md:text-lg text-slate-700 dark:text-slate-300">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <NotificationBell onClick={() => setShowNotificationModal(true)} />
            <UserDropdown />
          </div>
        </div>
      </header>



      <main className="flex-1 relative min-h-0">
        {activeSection === "HOME" && (
          <VendorHome
            analytics={analyticsData}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectSpace={(space) => {
              setSelectedSpaceId(space.space_id);
              if (space.lat) setFlyToCoords([Number(space.lat), Number(space.lng)]);
              setActiveSection("MAP");
              setIntent(space.space_id ? "OWNER_DEFINED" : "REQUEST_NEW");
            }}
          />
        )}

        {activeSection === "STOREFRONT" && <VendorStorefront />}

        {activeSection === "MAP" && (
          <MapContainerFullscreen
            center={selectedSpace ? [Number(selectedSpace.lat), Number(selectedSpace.lng)] : defaultCenter}
            zoom={selectedSpace ? 16 : 13}
            height="100%"
            onSearchSelect={(lat, lng) => {
              if (intent === "REQUEST_NEW") {
                handlePinSet([lat, lng]);
              }
            }}
            searchQuery={mapSearchQuery}
            searchPlaceholder={t('search_places')}
            isFullscreen={fullscreen}
            onToggleFullscreen={setFullscreen}
            showFullscreenButton={true}
            overlayContent={
              <>
                <WeatherWidget />
                <VendorSidebar
                  intent={intent}
                  setIntent={setIntent}
                  spaces={spaces}
                  selectedSpaceId={selectedSpaceId}
                  setSelectedSpaceId={setSelectedSpaceId}
                  loading={loading}
                  requests={requests}
                  permits={permits}
                  onOpenQr={handleOpenQr}
                  onRequestClick={setSelectedRequest}
                />
                {intent && (
                  <VendorActionBar
                    intent={intent}
                    form={form}
                    setForm={setForm}
                    requestedRadius={requestedRadius}
                    setRequestedRadius={setRequestedRadius}
                    ownerDefinedRadius={ownerDefinedRadius}
                    pricePerRadius={selectedSpace?.price_per_radius || 0}
                    handleSubmit={handleSubmit}
                    saving={saving}
                    isFavorite={favorites.some(f => f.space_id === selectedSpaceId)}
                    onToggleFavorite={() => handleToggleFavorite(selectedSpaceId)}
                    showFavorite={!!selectedSpaceId}
                  />
                )}
              </>
            }
          >
            {/* Owner-defined spaces with occupancy markers */}
            {spaces.map(space => {
              if (!space?.lat || !space?.lng) return null;
              const isSelected = space.space_id === selectedSpaceId;

              const dotColor = space.occupancy_status === 'RED' ? 'bg-red-500' :
                space.occupancy_status === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500';

              // custom icon for occupancy
              const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-8 h-8 ${dotColor} rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white scale-110">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 9.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-7.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                      </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });

              return (
                <Marker
                  key={space.space_id}
                  position={[Number(space.lat), Number(space.lng)]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedSpaceId(space.space_id)
                  }}
                >
                  <Popup>
                    <div className="text-sm p-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
                        <div className="font-black text-slate-800 uppercase tracking-tight">{space.space_name}</div>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{space.address}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Status</span>
                          <span className={`text-[10px] font-black ${space.occupancy_status === 'RED' ? 'text-red-500' : space.occupancy_status === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {space.occupancy_status === 'RED' ? 'OCCUPIED' : space.occupancy_status === 'YELLOW' ? 'EXPIRING SOON' : 'AVAILABLE'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Price</span>
                          <span className="text-[10px] font-black text-blue-600">₹{space.price_per_radius}/m</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Selected owner space boundary */}
            {selectedSpace?.lat && selectedSpace?.lng && selectedSpace?.allowed_radius && (
              <>
                <MapZoomToSpace
                  key={`zoom-${selectedSpace.space_id}`}
                  lat={Number(selectedSpace.lat)}
                  lng={Number(selectedSpace.lng)}
                  radius={Number(selectedSpace.allowed_radius)}
                />
                <Circle
                  center={[Number(selectedSpace.lat), Number(selectedSpace.lng)]}
                  radius={Number(selectedSpace.allowed_radius)}
                  pathOptions={{ color: "#22c55e", fillOpacity: 0.08, weight: 2 }}
                />
              </>
            )}

            <MapClickCatcher
              onClick={coord => handlePinSet(coord)}
              intent={intent}
            />

            {intent === "REQUEST_NEW" && pin && (
              <>
                <Marker
                  position={pin}
                  draggable={true}
                  eventHandlers={markerDragHandlers}
                >
                  <Popup>New requested location (Drag to move)</Popup>
                </Marker>
                {previewRadius > 0 && (
                  <Circle
                    center={pin}
                    radius={previewRadius}
                    pathOptions={{ color: "#2563eb", fillOpacity: 0.18, weight: 2 }}
                  />
                )}
              </>
            )}

            <MapFlyTo coords={flyToCoords} />
          </MapContainerFullscreen>
        )}
      </main>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNotificationClick={(notification) => {
          if (notification.related_request_id) {
            const req = requests.find(r => String(r.request_id) === String(notification.related_request_id));
            if (req) {
              setSelectedRequest(req);
              setActiveSection("MAP");
            }
            setShowNotificationModal(false);
          }
        }}
      />

      {/* Permit QR/Detail Modal */}
      <PermitQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        permit={selectedPermitForQr}
      />

      {/* Request Detail Modal */}
      <RequestDetailModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />

      {/* Voice Assistant Overlay */}
      <VoiceAssistant
        onCommand={handleVoiceCommand}
        isListening={isListening}
        setIsListening={setIsListening}
        status={voiceStatus}
      />
    </div>
  );
}

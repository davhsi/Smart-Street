import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle, ZoomControl } from "react-leaflet";
import MapContainerFullscreen from "../components/MapContainerFullscreen.jsx";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../services/api";

// Fix icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Helper Components ---

function LocationPicker({ setPin }) {
    useMapEvents({
        click(e) {
            setPin([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function OwnerAddSpace() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pin, setPin] = useState(null); // [lat, lng]
    const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showForm, setShowForm] = useState(true); // Toggle form visibility on mobile? Always true for now.

    const [form, setForm] = useState({
        spaceName: "",
        address: "",
        allowedRadius: 50,
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        // setPin([lat, lon]); // User requested to NOT pin automatically
        setMapCenter([lat, lon]);
        // setForm(prev => ({ ...prev, address: result.display_name })); // Don't autofill until pin is set
        setSearchResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pin) {
            alert("Please pin a location on the map.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/owner/spaces", {
                spaceName: form.spaceName,
                address: form.address,
                lat: pin[0],
                lng: pin[1],
                allowedRadius: form.allowedRadius,
            });
            // Redirect to spaces tab on dashboard
            // Wait, dashboard state management needs to know which tab. 
            // We can navigate to /owner, and owner dashboard defaults to dashboard tab.
            // Or pass state?
            // For now, just navigate to /owner. The default tab is dashboard. The user can click My Spaces.
            // Ideally navigate to /owner?tab=spaces
            navigate("/owner");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create space");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-900">
            {/* LEFT SIDEBAR: Form (Fixed width) */}
            <div className="w-full md:w-[400px] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl z-20 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <button
                        onClick={() => navigate("/owner")}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add New Space</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="add-space-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
                            <strong>Step 1:</strong> Locate your space on the map using search or zooming.<br />
                            <strong>Step 2:</strong> Click to drop a pin on the exact spot.<br />
                            <strong>Step 3:</strong> Fill in the details below.
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Space Name</label>
                            <input
                                type="text"
                                required
                                value={form.spaceName}
                                onChange={(e) => setForm({ ...form, spaceName: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                placeholder="e.g. Main Street Parking"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                            <textarea
                                required
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-shadow"
                                placeholder="Full address..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Allowed Radius (meters)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={form.allowedRadius}
                                onChange={(e) => setForm({ ...form, allowedRadius: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            />
                        </div>

                        {/* Selected Location Display */}
                        <div className="pt-2">
                            <p className="text-xs uppercase font-bold text-slate-500 mb-2">Pin Location</p>
                            {pin ? (
                                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm flex items-center gap-2 border border-green-100 dark:border-green-900">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                                    <span className="truncate">Lat: {pin[0].toFixed(5)}, Lng: {pin[1].toFixed(5)}</span>
                                </div>
                            ) : (
                                <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-3 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-center italic">
                                    Map pin not set
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        type="submit"
                        form="add-space-form"
                        disabled={loading || !pin}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                    >
                        {loading ? "Creating Space..." : "Create Space"}
                    </button>
                    <button
                        onClick={() => navigate("/owner")}
                        className="w-full mt-3 px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE: Full Map */}
            {/* RIGHT SIDE: Full Map */}
            <div className="flex-1 relative h-full">
                <MapContainerFullscreen
                    center={mapCenter}
                    zoom={13}
                    height="100%"
                    searchQuery={searchQuery}
                    onSearchSelect={(lat, lng) => {
                        selectSearchResult({ lat, lon: lng, display_name: "Selected Location" }); // Adapter
                    }}
                    showFullscreenButton={false}
                >
                    <LocationPicker setPin={setPin} />
                    <MapUpdater center={mapCenter} />
                    {pin && <Marker position={pin} />}
                    {pin && <Circle center={pin} radius={form.allowedRadius} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />}
                </MapContainerFullscreen>

                {/* Floating Hint */}
                {!pin && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-5 py-2.5 rounded-full shadow-lg z-[400] text-sm font-semibold text-slate-700 border border-slate-200 pointer-events-none animate-bounce">
                        Tap map to drop pin 📍
                    </div>
                )}
            </div>
        </div>
    );
}

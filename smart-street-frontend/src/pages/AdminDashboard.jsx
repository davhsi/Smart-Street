import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { QRCodeCanvas } from "qrcode.react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import MapContainerFullscreen from "../components/MapContainerFullscreen.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import NotificationModal from "../components/NotificationModal.jsx";
import { ConfirmModal } from "../components/Modal.jsx";
import MapSearchControl from "../components/MapSearchControl.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";


import AdminRequestDetail from "../components/AdminRequestDetail.jsx";
import AdminStatsCards from "../components/AdminStatsCards.jsx";
import AdminVendorList from "../components/AdminVendorList.jsx";
import AdminOwnerList from "../components/AdminOwnerList.jsx";
import { ChartBarSquareIcon, MapIcon, UserGroupIcon } from "@heroicons/react/24/outline";

import ThemeToggle from "../components/ThemeToggle.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import UserDropdown from "../components/UserDropdown.jsx";

const defaultCenter = [11.3410, 77.7172];

const radiusFromDims = (maxWidth, maxLength) => {
  return Math.sqrt(maxWidth ** 2 + maxLength ** 2) / 2;
};

import { STATUS_COLORS } from "../utils/constants.js";

export default function AdminDashboard() {
  const { user, logout, fetchNotifications } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [permits, setPermits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [viewMode, setViewMode] = useState("pending");
  const [activeTab, setActiveTab] = useState("overview"); // overview, map, vendors
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [owners, setOwners] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [statsRes, vendorsRes, ownersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/vendors"),
          api.get("/admin/owners")
        ]);
        setStats(statsRes.data.stats || statsRes.data);
        setVendors(vendorsRes.data.vendors || []);
        setOwners(ownersRes.data.owners || []);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === "history" ? "/admin/requests?history=true" : "/admin/requests";
      const { data } = await api.get(endpoint);
      setRequests(data.requests || []);
      if (!selectedId && data.requests?.length) setSelectedId(data.requests[0].request_id);
    } catch (err) {
      showError(err.response?.data?.message || "Unable to load requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermits = async () => {
    try {
      const { data } = await api.get("/admin/permits");
      setPermits(data.permits || []);
    } catch (err) {
      console.error("Failed to load permits", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data } = await api.get("/admin/audit-logs");
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchPermits();
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const selected = useMemo(
    () => requests.find(r => String(r.request_id) === String(selectedId)) || null,
    [requests, selectedId]
  );

  useEffect(() => {
    if (selected && selected.lat && selected.lng) {
      window.dispatchEvent(
        new CustomEvent("centerMap", {
          detail: { lat: selected.lat, lng: selected.lng, zoom: 20 }
        })
      );
    }
  }, [selected]);

  const handleApproveClick = () => {
    setShowApproveModal(true);
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/requests/${selected.request_id}/approve`, { remarks });
      showSuccess("Request approved and permit issued");
      setRemarks("");
      setShowApproveModal(false);
      await fetchRequests();
      await fetchPermits();
      await fetchAuditLogs();
    } catch (err) {
      showError(err.response?.data?.message || "Approval failed");
      if (err.response?.data?.conflicts) console.error("Conflicts:", err.response.data.conflicts);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/requests/${selected.request_id}/reject`, { remarks });
      showSuccess("Request rejected");
      setRemarks("");
      setShowRejectModal(false);
      await fetchRequests();
      await fetchAuditLogs();
    } catch (err) {
      showError(err.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const requestRadius = selected ? radiusFromDims(selected.max_width, selected.max_length) : 0;
  const conflictRadii = (selected?.conflicts || []).map(c => ({
    id: c.request_id,
    lat: c.lat,
    lng: c.lng,
    radius: radiusFromDims(c.max_width || 0, c.max_length || 0)
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">


      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-[3000]">
        <div className="px-4 md:px-6 py-4 flex flex-col items-center gap-3 min-h-[80px] xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center">

          {/* Left Tabs - Absolute on large desktop, hidden on smaller */}
          <div className="hidden xl:flex items-center gap-1 justify-self-start">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "overview" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <ChartBarSquareIcon className="w-5 h-5" />
              {t("overview")}
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "map" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <MapIcon className="w-5 h-5" />
              {t("map_and_requests")}
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "vendors" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              {t("vendors")}
            </button>
            <button
              onClick={() => setActiveTab("owners")}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "owners" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              {t("owners")}
            </button>
          </div>

          {/* Centered Title */}
          <div className="text-center z-10 mb-4 xl:mb-0 justify-self-center">
            <Link to="/" className="block">
              <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400 font-bold tracking-[0.25em] hover:opacity-80 transition-opacity mb-1">{t("smart_street")}</p>
            </Link>
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">{t("admin_console")}</h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">{t("review_requests_permits")}</p>
          </div>

          {/* Right Controls - Absolute on desktop */}
          <div className="flex items-center gap-3 md:gap-5 justify-self-end">
            <div className="transform scale-110">
              <LanguageSwitcher />
            </div>
            <div className="transform scale-110">
              <ThemeToggle />
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>


            <div className="transform scale-110">
              <NotificationBell onClick={() => setShowNotificationModal(true)} />
            </div>

            <UserDropdown />
          </div>
        </div>

        {/* Navigation Tabs - Mobile/Tablet Only (below XL) */}
        <div className="w-full xl:hidden border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex gap-2 justify-center px-4 py-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-base font-bold rounded-lg transition-all ${activeTab === "overview" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <ChartBarSquareIcon className="w-5 h-5" />
              {t("overview")}
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-base font-bold rounded-lg transition-all ${activeTab === "map" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <MapIcon className="w-5 h-5" />
              {t("map_and_requests")}
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-base font-bold rounded-lg transition-all ${activeTab === "vendors" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              {t("vendors")}
            </button>
            <button
              onClick={() => setActiveTab("owners")}
              className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-base font-bold rounded-lg transition-all ${activeTab === "owners" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              {t("owners")}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative h-[calc(100vh-140px)] overflow-hidden">

        {activeTab === "overview" && (
          <div className="h-full overflow-y-auto p-6 md:p-10 max-w-[1920px] mx-auto w-full">

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t("dashboard_overview")}</h2>
            <AdminStatsCards stats={stats} loading={statsLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Quick Actions or Recent Logs? For now recent logs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wide">{t("recent_audit_logs")}</h3>
                <div className="space-y-4">
                  {logs.slice(0, 8).map((log, i) => (
                    <div key={i} className="flex gap-4 text-base pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <div className="text-sm text-slate-400 whitespace-nowrap font-mono">{new Date(log.created_at).toLocaleTimeString()}</div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{log.action}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("by_admin", { id: log.admin_id?.slice(0, 6) })}</p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-base text-slate-400 italic">{t("no_logs_found")}</p>}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="p-5 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-5">
                  <MapIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t("review_pending_requests")}</h3>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-3 mb-8">
                  {t("pending_requests_count", { count: stats?.pending_requests || 0 })}
                </p>
                <button
                  onClick={() => setActiveTab("map")}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold transition-colors shadow-lg shadow-blue-500/20"
                >
                  {t("go_to_map")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "vendors" && (
          <div className="h-full overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full">
            <AdminVendorList vendors={vendors} loading={statsLoading} />
          </div>
        )}

        {activeTab === "owners" && (
          <div className="h-full overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full">
            <AdminOwnerList owners={owners} loading={statsLoading} />
          </div>
        )}

        {activeTab === "map" && (

          <MapContainerFullscreen
            center={selected ? [selected.lat, selected.lng] : defaultCenter}
            zoom={selected ? 16 : 13}
            height="100vh"
            showFullscreenButton={false}
            overlayContent={
              <>
                {/* LEFT SIDEBAR: List */}
                <AdminSidebar
                  requests={requests}
                  loading={loading}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  fetchRequests={fetchRequests}
                  statusColors={STATUS_COLORS}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />

                {/* RIGHT SIDEBAR: Detail (Conditionally rendered) */}
                {selected && (
                  <div className="absolute top-4 right-4 z-[2000]">
                    <AdminRequestDetail
                      selected={selected}
                      requestRadius={requestRadius}
                      remarks={remarks}
                      setRemarks={setRemarks}
                      handleApproveClick={handleApproveClick}
                      handleRejectClick={handleRejectClick}
                      actionLoading={actionLoading}
                    />
                  </div>
                )}

                {!selected && requests.length > 0 && (
                  <div className="absolute top-4 right-4 z-[2000]">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-6 max-w-4xl w-full transition-colors duration-300">
                      <div className="text-center py-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>👆 {t("select_request_hint")}</strong><br />
                            {t("select_request_detail")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            }
          >
            {selected && (
              <>
                {/* Space circle - only if space exists */}
                {selected.space_id && selected.space_lat && selected.space_lng && (
                  <Circle
                    center={[selected.space_lat, selected.space_lng]}
                    radius={selected.allowed_radius || 50}
                    pathOptions={{ color: "#22c55e", weight: 2, fillOpacity: 0.08 }}
                  >
                    <Popup>{t("space_boundary", { radius: selected.allowed_radius })}</Popup>
                  </Circle>
                )}
                {/* Request pin + circle */}
                <Marker position={[selected.lat, selected.lng]}>
                  <Popup>{t("request_location")}</Popup>
                </Marker>
                {requestRadius > 0 && (
                  <Circle
                    center={[selected.lat, selected.lng]}
                    radius={requestRadius}
                    pathOptions={{ color: "#2563eb", weight: 3, fillOpacity: 0.18 }}
                  >
                    <Popup>{t("request_area", { width: selected.max_width, length: selected.max_length })}</Popup>
                  </Circle>
                )}
                {/* Conflict circles */}
                {conflictRadii.map(c =>
                  c.lat && c.lng && c.radius > 0 ? (
                    <Circle
                      key={`conflict-${c.lat}-${c.lng}`}
                      center={[c.lat, c.lng]}
                      radius={c.radius}
                      pathOptions={{ color: "#ef4444", weight: 1, fillOpacity: 0.3 }}
                    >
                      <Popup>{t("conflict_region")}</Popup>
                    </Circle>
                  ) : null
                )}
              </>
            )}

          </MapContainerFullscreen>
        )}

        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onNotificationClick={(notification) => {
            if (notification.related_request_id) {
              setActiveTab("map");
              setSelectedId(notification.related_request_id);
              setShowNotificationModal(false);
            }
          }}
        />
        <ConfirmModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
          title={t("reject_request")}
          message={t("reject_request_msg", { id: selected?.request_id })}
          confirmText={t("reject_request")}
          confirmVariant="danger"
          loading={actionLoading}
        />

        <ConfirmModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onConfirm={handleApprove}
          title={t("approve_request")}
          message={t("approve_request_msg", { id: selected?.request_id })}
          confirmText={t("approve_and_issue")}
          confirmVariant="primary"
          loading={actionLoading}
        />
      </main>
    </div>
  );
}


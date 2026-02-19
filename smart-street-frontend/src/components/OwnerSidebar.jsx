import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRightIcon, ChevronLeftIcon, PlusCircleIcon, ListBulletIcon } from "@heroicons/react/24/outline";

export default function OwnerSidebar({
  spaces,
  loading,
  fetchSpaces,
  form,
  setForm,
  pin,
  setPin,
  handleSubmit,
  saving,
  className = ""
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("list"); // "list", "create"
  const { t } = useTranslation();

  return (
    <div
      className={`fixed transition-all duration-300 shadow-xl border border-slate-200 dark:border-slate-800 z-[30]
        ${collapsed
          ? "w-12 h-12 rounded-full overflow-hidden bg-white/90 dark:bg-slate-900/90 top-28 left-4 md:top-28 md:left-4"
          : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl md:rounded-xl flex flex-col"
        }
        ${!collapsed && `
          bottom-0 left-0 right-0 w-full max-h-[50vh] 
          md:top-28 md:left-4 md:bottom-auto md:right-auto md:w-[clamp(320px,30vw,400px)] md:max-h-[calc(100vh-8rem)]
        `}
        ${className}
      `}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute z-[31] p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all ${collapsed
          ? "inset-0 flex items-center justify-center w-full h-full border-none"
          : "right-4 top-[-1.5rem] md:-right-4 md:top-2 w-8 h-8 flex items-center justify-center transform hover:scale-105"
          }`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRightIcon className="w-5 h-5 md:rotate-0 -rotate-90" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 md:rotate-0 -rotate-90" />
        )}
      </button>

      {!collapsed && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1 shrink-0">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-lg font-semibold rounded-lg transition-all ${activeTab === "list" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <ListBulletIcon className="w-6 h-6" />
              <span className="hidden sm:inline">{t("my_spaces")}</span>
              <span className="sm:hidden">{t("spaces")}</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-lg font-semibold rounded-lg transition-all ${activeTab === "create" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <PlusCircleIcon className="w-6 h-6" />
              <span className="hidden sm:inline">{t("create_new")}</span>
              <span className="sm:hidden">{t("create")}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">

            {/* --- TAB: LIST --- */}
            {activeTab === "list" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t("your_spaces")}</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400">{t("manage_locations")}</p>
                  </div>
                  <button onClick={fetchSpaces} disabled={loading} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                    {t("refresh")}
                  </button>
                </div>

                {loading ? (
                  <p className="text-sm text-slate-400 italic">{t("loading_text")}</p>
                ) : spaces.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t("no_spaces_created")}</p>
                    <button onClick={() => setActiveTab("create")} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      {t("create_first_space")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {spaces.map(space => (
                      <div
                        key={space.space_id}
                        className="p-4 bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('centerMap', {
                            detail: { lat: Number(space.lat), lng: Number(space.lng), zoom: 18 }
                          }));
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-lg text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{space.space_name}</span>
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs px-2 py-1 rounded font-mono">
                            {space.allowed_radius}m
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate font-medium">{space.address}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("active_space")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {spaces.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2.5 rounded text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                    <span>💡</span> {t("tip_click_space")}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: CREATE --- */}
            {activeTab === "create" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t("create_space")}</h2>
                  <p className="text-base text-slate-500 dark:text-slate-400">{t("define_zone")}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("space_name")}</label>
                    <input
                      type="text"
                      value={form.spaceName}
                      onChange={e => setForm({ ...form, spaceName: e.target.value })}
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-shadow"
                      placeholder="e.g. Central Park Lot"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("address")}</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-shadow"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      {t("location_and_radius")} {pin && <span className="text-green-600 dark:text-green-400 font-normal ml-1 text-xs bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{t("pin_set")}</span>}
                    </label>

                    {!pin && (
                      <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 p-2.5 rounded mb-3 flex items-start gap-2">
                        <span>📍</span> {t("tap_map_set_center")}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={form.allowedRadius}
                        onChange={e => setForm({ ...form, allowedRadius: e.target.value })}
                        required
                        min="1"
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-shadow"
                        placeholder="Radius (m)"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t("meters")}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {saving ? t("creating_space") : t("create_space")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

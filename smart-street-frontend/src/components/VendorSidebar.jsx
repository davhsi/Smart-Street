import React, { useState } from "react";
import { ChevronRightIcon, ChevronLeftIcon, PlusCircleIcon, ClockIcon, DocumentCheckIcon, ArrowRightIcon, QrCodeIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import AnalyticsChart from "./AnalyticsChart";
import { useTranslation } from "react-i18next";
import { STATUS_COLORS } from "../utils/constants";
import SearchableSelect from "./SearchableSelect";

export default function VendorSidebar({
  intent,
  setIntent,
  spaces,
  selectedSpaceId,
  setSelectedSpaceId,
  loading,
  requests,
  permits,
  onOpenQr,
  onRequestClick,
  className = ""
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("new"); // "new", "history", "permits"


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
          // Different icons based on screen size could be good, but keeping simple for now
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
              onClick={() => setActiveTab("new")}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === "new" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <PlusCircleIcon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{t('tab_new')}</span>
              <span className="sm:hidden">{t('tab_new')}</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === "history" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <ClockIcon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{t('tab_history')}</span>
              <span className="sm:hidden">{t('tab_history')}</span>
            </button>
            <button
              onClick={() => setActiveTab("permits")}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === "permits" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <DocumentCheckIcon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{t('tab_permits')}</span>
              <span className="sm:hidden">{t('tab_permits')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">

            {/* --- TAB: NEW REQUEST --- */}
            {activeTab === "new" && (
              <>
                {/* Header */}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t('new_request_title')}</h2>
                  <p className="text-base text-slate-500 dark:text-slate-400">{t('new_request_subtitle')}</p>
                </div>

                {/* 1. Intent Selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{t('request_type')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIntent("OWNER_DEFINED")}
                      className={`py-3 px-2 text-sm font-medium rounded-lg border transition-all leading-tight text-center ${intent === "OWNER_DEFINED"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                    >
                      {t('owner_location')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntent("REQUEST_NEW")}
                      className={`py-3 px-2 text-sm font-medium rounded-lg border transition-all leading-tight text-center ${intent === "REQUEST_NEW"
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                    >
                      {t('new_request_button')}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                {/* 2. Content based on selection */}
                <div className="mt-4">
                  {!intent && (
                    <div className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      {t('select_request_type_hint')}
                    </div>
                  )}

                  {intent === "OWNER_DEFINED" && (
                    <div className="space-y-2 animate-fadeIn">
                      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{t('select_space')}</h3>
                      {loading ? (
                        <div className="text-xs text-slate-400 italic">{t('loading_spaces')}</div>
                      ) : spaces.length === 0 ? (
                        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                          {t('no_spaces_available')}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <SearchableSelect
                            options={spaces.map(s => ({ value: s.space_id, label: s.space_name }))}
                            value={selectedSpaceId}
                            onChange={(val) => setSelectedSpaceId(val)}
                            placeholder={t('search_spaces_placeholder')}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {intent === "REQUEST_NEW" && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800 animate-fadeIn">
                      <h3 className="text-base font-bold text-purple-900 dark:text-purple-300 mb-2">{t('select_location')}</h3>
                      <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                        <span className="font-semibold">{t('tap_on_map')}</span> {t('tap_map_hint')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-400">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        {t('map_interaction_enabled')}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- TAB: HISTORY --- */}
            {activeTab === "history" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t('request_history_title')}</h2>
                  <p className="text-base text-slate-500 dark:text-slate-400">{t('request_history_subtitle')}</p>
                </div>
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <p className="text-base text-slate-400 italic">{t('no_requests_found')}</p>
                  ) : (
                    requests.map(r => (
                      <div
                        key={r.request_id}
                        onClick={() => onRequestClick && onRequestClick(r)}
                        className="p-4 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-lg text-base hover:border-blue-200 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-lg text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">#{r.request_id.slice(0, 6)}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${STATUS_COLORS[r.status] || STATUS_COLORS.PENDING
                              }`}>{r.status}</span>
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 truncate text-base font-medium">{r.space_name || t('custom_location')}</p>
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-sm text-slate-400">{new Date(r.submitted_at).toLocaleDateString()}</p>
                          <span className="text-sm text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{t('view_details')} →</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: PERMITS --- */}
            {activeTab === "permits" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">{t('my_permits_title')}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('my_permits_subtitle')}</p>
                </div>
                <div className="space-y-2">
                  {permits.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">{t('no_active_permits')}</p>
                  ) : (
                    permits.map((p, index) => (
                      <div key={p.permit_id} className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-lg text-green-900 dark:text-green-300 border-b border-green-200 dark:border-green-800 pb-0.5">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => onOpenQr && onOpenQr(p)}
                            className="text-sm bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 px-4 py-2 rounded-lg hover:bg-green-300 dark:hover:bg-green-800 transition-colors font-bold shadow-sm"
                          >
                            {t('view_permit')}
                          </button>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs font-semibold text-green-700 dark:text-green-400">
                          <span>{t('valid_from')}: {new Date(p.valid_from).toLocaleDateString()}</span>
                          <span>{t('valid_to')}: {new Date(p.valid_to).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

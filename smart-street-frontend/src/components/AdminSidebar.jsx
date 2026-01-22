import React, { useState } from "react";
import { ChevronRightIcon, ChevronLeftIcon, InboxIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";

export default function AdminSidebar({
  requests,
  loading,
  selectedId,
  setSelectedId,
  fetchRequests,
  statusColors,
  viewMode,
  setViewMode,
  className = ""
}) {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div
      className={`absolute top-4 left-4 z-[2000] flex flex-col transition-all duration-300 ${
        collapsed ? "w-12 h-12 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-full overflow-hidden" : "w-80 md:w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl rounded-xl border border-slate-200 dark:border-slate-800"
      } ${className}`}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute z-[1010] p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all ${
           collapsed ? "inset-0 flex items-center justify-center w-full h-full border-none" : "right-2 top-2 w-8 h-8 flex items-center justify-center"
        }`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <div className="flex flex-col h-full overflow-hidden">
           {/* Tab Navigation */}
           <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1">
              <button
                onClick={() => setViewMode("pending")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-all ${
                  viewMode === "pending" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <InboxIcon className="w-4 h-4" />
                Pending
              </button>
              <button
                onClick={() => setViewMode("history")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-all ${
                  viewMode === "history" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <ArchiveBoxIcon className="w-4 h-4" />
                History
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                    {viewMode === "pending" ? "Tasks" : "Archive"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {viewMode === "pending" ? "Incoming requests" : "Past decisions"}
                  </p>
                </div>
                <button 
                  onClick={fetchRequests} 
                  disabled={loading} 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  {loading ? "..." : "Refresh"}
                </button>
              </div>

              {loading ? (
                <p className="text-xs text-slate-400 italic">Loading requests...</p>
              ) : requests.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg text-center">
                   <p className="text-xs text-slate-500 dark:text-slate-400">No {viewMode} requests found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map(request => (
                    <div
                      key={request.request_id}
                      onClick={() => setSelectedId(request.request_id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        String(request.request_id) === String(selectedId)
                          ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-900"
                          : "border-slate-200 dark:border-slate-700 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          #{request.request_id.slice(0, 8)}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[request.status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
                        {request.space_name || "Custom Location"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                         by <span className="font-semibold">{request.vendor_name}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(request.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

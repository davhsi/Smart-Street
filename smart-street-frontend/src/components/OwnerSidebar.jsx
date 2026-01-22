import React, { useState } from "react";
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
                onClick={() => setActiveTab("list")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "list" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                My Spaces ({spaces.length})
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "create" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <PlusCircleIcon className="w-4 h-4" />
                Create New
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* --- TAB: LIST --- */}
              {activeTab === "list" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Your Spaces</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Manage your locations</p>
                    </div>
                    <button onClick={fetchSpaces} disabled={loading} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      Refresh
                    </button>
                  </div>
                  
                  {loading ? (
                    <p className="text-xs text-slate-400 italic">Loading...</p>
                  ) : spaces.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg text-center">
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">You haven't created any spaces yet.</p>
                       <button onClick={() => setActiveTab("create")} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                         Create your first space
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
                            <span className="font-semibold text-slate-800 dark:text-white text-base group-hover:text-blue-700 dark:group-hover:text-blue-400">{space.space_name}</span>
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs px-2 py-1 rounded">
                              r: {space.allowed_radius}m
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{space.address}</p>
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                             Active Space
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {spaces.length > 0 && (
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2 rounded text-[10px] text-blue-700 dark:text-blue-300">
                       💡 Click a space card to center the map on it.
                     </div>
                  )}
                </div>
              )}

              {/* --- TAB: CREATE --- */}
              {activeTab === "create" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Create Space</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Define a new zone for vendors</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Space Name</label>
                      <input
                        type="text"
                        value={form.spaceName}
                        onChange={e => setForm({ ...form, spaceName: e.target.value })}
                        required
                        className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="e.g. Central Park Lot"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        required
                        className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="Street address"
                      />
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                       <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                         Location & Radius {pin && <span className="text-green-600 dark:text-green-400 font-normal ml-1">(Pin Set ✓)</span>}
                       </label>
                       
                       {!pin && (
                         <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 p-2 rounded mb-2">
                           📍 Tap on the map to set the space center.
                         </div>
                       )}
                       
                       <div className="flex items-center gap-2">
                         <input
                           type="number"
                           value={form.allowedRadius}
                           onChange={e => setForm({ ...form, allowedRadius: e.target.value })}
                           required
                           min="1"
                           className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                           placeholder="Radius (m)"
                         />
                         <span className="text-xs text-slate-500 dark:text-slate-400">meters</span>
                       </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Creating..." : "Create Space"}
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

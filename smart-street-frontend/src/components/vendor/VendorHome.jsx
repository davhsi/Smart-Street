import React, { useState, useEffect } from "react";
import {
    TrophyIcon,
    ClockIcon,
    CurrencyRupeeIcon,
    HeartIcon,
    ArrowPathIcon,
    MapPinIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function VendorHome({ onSelectSpace, analytics, favorites, onToggleFavorite }) {
    const [loading, setLoading] = useState(!analytics);

    useEffect(() => {
        if (analytics) setLoading(false);
    }, [analytics]);

    const handleToggleFavorite = async (spaceId) => {
        if (onToggleFavorite) {
            onToggleFavorite(spaceId);
        }
    };

    if (loading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />)}
            </div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
    );

    const stats = analytics?.summary || { total_permits: 0, pending_requests: 0, total_spent: 0 };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Vendor Central</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your permits and optimize your street presence.</p>
                </div>
                <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-3">
                    <ClockIcon className="w-6 h-6" />
                    <div>
                        <p className="text-[10px] uppercase font-bold opacity-80">Active Time Today</p>
                        <p className="text-lg font-bold">4h 12m</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={<TrophyIcon className="w-8 h-8 text-emerald-500" />}
                    label="Permits Issued"
                    value={stats.total_permits}
                    color="emerald"
                />
                <StatCard
                    icon={<ArrowPathIcon className="w-8 h-8 text-blue-500" />}
                    label="Pending Review"
                    value={stats.pending_requests}
                    color="blue"
                />
                <StatCard
                    icon={<CurrencyRupeeIcon className="w-8 h-8 text-amber-500" />}
                    label="Total Investment"
                    value={`₹${Number(stats.total_spent).toLocaleString()}`}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Successful Spots */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-blue-500" />
                            Recent Re-request
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {analytics?.recentRequests?.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {analytics.recentRequests.map(req => (
                                    <div key={req.request_id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                                                <MapPinIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{req.space_name || "Custom Point"}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{req.address}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onSelectSpace(req)}
                                            className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white p-2.5 rounded-xl transition-all group-hover:scale-105"
                                        >
                                            <ArrowPathIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">No recent approved permits.</div>
                        )}
                    </div>
                </section>

                {/* Favorite Places */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <HeartIconSolid className="w-5 h-5 text-rose-500" />
                            Favorite Places
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {favorites.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {favorites.map(fav => (
                                    <div key={fav.space_id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center">
                                                <HeartIconSolid className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{fav.space_name}</p>
                                                <p className="text-xs text-slate-500">₹{fav.price_per_radius}/m • {fav.allowed_radius}m</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleFavorite(fav.space_id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                                            >
                                                <HeartIconSolid className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onSelectSpace(fav)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                            >
                                                Book
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 italic text-sm">You haven't added any favorites yet. Heart a space on the map to see it here!</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    const colorMap = {
        emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
        amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 group hover:shadow-md transition-shadow">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-left">{value}</p>
            </div>
        </div>
    );
}

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import {
    CurrencyRupeeIcon,
    BuildingStorefrontIcon,
    ClockIcon,
    ChartBarIcon
} from "@heroicons/react/24/outline";

export default function OwnerAnalytics({ spaces, requests, loading, onNavigate }) {
    const { t } = useTranslation();

    // Metrics Calculation
    const metrics = useMemo(() => {
        if (loading) return { earnings: 0, occupancy: 0, pending: 0, activeSpaces: 0 };

        const activeSpaces = spaces.length;

        // Filter approved requests for earnings
        const approvedRequests = requests.filter(r => r.status === "APPROVED" || r.status === "COMPLETED");
        const pendingRequests = requests.filter(r => r.status === "OWNER_PENDING");

        // Mock earning calculation: Area * Duration * Rate (avg 50/hr)
        const totalEarnings = approvedRequests.reduce((acc, req) => {
            const start = new Date(req.start_time);
            const end = new Date(req.end_time);
            const durationHours = (end - start) / (1000 * 60 * 60);
            const area = (req.max_width || 2) * (req.max_length || 2);
            // Mock rate: 10 per sq m per hour
            const cost = Math.round(area * durationHours * 10);
            return acc + cost;
        }, 0);

        // Mock occupancy: just a placeholder logic for now
        const occupancy = spaces.length > 0 ? Math.round((approvedRequests.length / (spaces.length * 5)) * 100) : 0;

        return {
            earnings: totalEarnings,
            occupancy: Math.min(occupancy, 100),
            pending: pendingRequests.length,
            activeSpaces
        };
    }, [spaces, requests, loading]);

    // Chart Data Preparation
    const chartData = useMemo(() => {
        // Group earnings by date
        const data = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString("en-US", { weekday: 'short' });

            // Random variance for demo if no real data
            const val = metrics.earnings > 0 ? Math.round(metrics.earnings / 7) + Math.random() * 500 : Math.round(Math.random() * 1000);

            data.push({ name: dateStr, value: val });
        }
        return data;
    }, [metrics.earnings]);

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Overview</h2>
                <p className="text-slate-500 dark:text-slate-400">Welcome back! Here's what's happening with your spaces.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Total Earnings (Est.)"
                    value={`₹${metrics.earnings.toLocaleString()}`}
                    icon={CurrencyRupeeIcon}
                    trend="+12%"
                    color="text-green-600"
                    bgColor="bg-green-50 dark:bg-green-900/20"
                />
                <KpiCard
                    title="Occupancy Rate"
                    value={`${metrics.occupancy}%`}
                    icon={ChartBarIcon}
                    trend="+5%"
                    color="text-blue-600"
                    bgColor="bg-blue-50 dark:bg-blue-900/20"
                />
                <KpiCard
                    title="Pending Requests"
                    value={metrics.pending}
                    icon={ClockIcon}
                    color="text-orange-600"
                    bgColor="bg-orange-50 dark:bg-orange-900/20"
                    alert={metrics.pending > 0}
                    onClick={() => onNavigate && onNavigate("requests")}
                />
                <KpiCard
                    title="Active Spaces"
                    value={metrics.activeSpaces}
                    icon={BuildingStorefrontIcon}
                    color="text-purple-600"
                    bgColor="bg-purple-50 dark:bg-purple-900/20"
                    onClick={() => onNavigate && onNavigate("spaces")}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Revenue Trend</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={100}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity / Quick Actions */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {requests.slice(0, 5).map(req => (
                            <div
                                key={req.request_id}
                                onClick={() => onNavigate && onNavigate("requests", req.request_id)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                            >
                                <div className={`w-2 h-2 rounded-full ${req.status === 'APPROVED' ? 'bg-green-500' : req.status === 'OWNER_PENDING' ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                                        {req.vendor_name || "Vendor"}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {req.status_label || req.status} • {req.space_name}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {new Date(req.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                        {requests.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, trend, color, bgColor, alert, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-slate-900 p-6 rounded-xl border transition-all ${alert ? 'border-orange-300 ring-4 ring-orange-50 dark:ring-orange-900/10' : 'border-slate-200 dark:border-slate-800'} 
            ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700' : ''} shadow-sm flex items-start justify-between group`}
        >
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{value}</p>
                {trend && <p className="text-xs font-medium text-green-600 mt-1">{trend} from last month</p>}
            </div>
            <div className={`p-3 rounded-lg transition-colors ${bgColor} ${onClick ? 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40' : ''}`}>
                <Icon className={`w-6 h-6 ${color} ${onClick ? 'group-hover:text-blue-600' : ''}`} />
            </div>
        </div>
    );
}

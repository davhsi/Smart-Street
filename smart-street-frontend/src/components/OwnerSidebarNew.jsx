import React from "react";
import { useTranslation } from "react-i18next";
import {
    HomeIcon,
    MapIcon,
    CalendarIcon,
    InboxStackIcon,
    BuildingStorefrontIcon,
    Cog6ToothIcon
} from "@heroicons/react/24/outline";

export default function OwnerSidebarNew({ activeTab, setActiveTab }) {
    const { t } = useTranslation();

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: HomeIcon },
        { id: "spaces", label: "My Spaces", icon: BuildingStorefrontIcon },
        { id: "requests", label: "Requests", icon: InboxStackIcon },
        { id: "calendar", label: "Calendar", icon: CalendarIcon },
        { id: "map", label: "Map View", icon: MapIcon },
    ];

    return (
        <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0">
            {/* Brand */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Owner Portal
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

        </div>
    );
}

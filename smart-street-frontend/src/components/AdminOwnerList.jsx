import React from "react";

export default function AdminOwnerList({ owners, loading }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!owners || owners.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Owners Found</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">There are currently no registered property owners.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registered Owners</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage property owners and spaces</p>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
          Total: {owners.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Owner Details</th>
              <th className="px-6 py-4">Contact Info</th>
              <th className="px-6 py-4 text-center">Total Spaces</th>
              <th className="px-6 py-4 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {owners.map((owner) => (
              <tr
                key={owner.owner_id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-bold text-lg text-slate-900 dark:text-white">{owner.owner_name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">
                        {owner.phone_number || "No Phone"}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                      {owner.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${owner.total_spaces > 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                    {owner.total_spaces} Spaces
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap text-sm font-medium">
                  {new Date(owner.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

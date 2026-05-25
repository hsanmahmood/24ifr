import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadLeaderboard } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const TotalClearancesSkeleton = () => (
    <div className="bg-surface-dark border border-border-dark p-6 rounded-lg shadow-sm relative overflow-hidden group">
        <div className="skeleton h-3 w-32 rounded mb-3"></div>
        <div className="skeleton h-9 w-28 rounded"></div>
    </div>
);

const LeaderboardTableSkeleton = () => (
    <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border-dark">
            <div className="skeleton h-6 w-44 rounded"></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900/50 text-xs uppercase font-bold text-zinc-500">
                    <tr>
                        <th className="px-6 py-4 tracking-wider">Rank</th>
                        <th className="px-6 py-4 tracking-wider">Controller</th>
                        <th className="px-6 py-4 tracking-wider text-right">Clearances</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                            <td className="px-6 py-4">
                                <div className="skeleton h-5 w-10 rounded"></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="skeleton h-8 w-8 rounded-full"></div>
                                    <div className="skeleton h-5 w-36 rounded"></div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="inline-block skeleton h-5 w-14 rounded"></div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const LeaderboardPage = () => {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [data, setData] = useState({ total_clearances: 0, leaderboard: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await loadLeaderboard();
                setData(res || { total_clearances: 0, leaderboard: [] });
            } catch (_) {
                notify.error('Failed to load leaderboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const topUsers = (data.leaderboard || []).slice(0, 10);

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <header>
                <h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-wide">Leaderboard</h1>
                {!user && <p className="text-zinc-500">Login to be on the leaderboard.</p>}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? <TotalClearancesSkeleton /> : (
                    <div className="bg-surface-dark border border-border-dark p-6 rounded-lg shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-primary">analytics</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Clearances</p>
                        <p className="font-display text-3xl font-bold text-white">{data.total_clearances.toLocaleString()}</p>
                    </div>
                )}
            </div>

            {loading ? <LeaderboardTableSkeleton /> : (
                <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-border-dark">
                        <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Top 10</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-900/50 text-xs uppercase font-bold text-zinc-500">
                                <tr>
                                    <th className="px-6 py-4 tracking-wider">Rank</th>
                                    <th className="px-6 py-4 tracking-wider">User</th>
                                    <th className="px-6 py-4 tracking-wider text-right">Clearances</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {topUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-zinc-600">
                                            No data available yet.
                                        </td>
                                    </tr>
                                ) : (
                                    topUsers.map((u, index) => (
                                        <tr key={u.user_id || index} className="hover:bg-zinc-900/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {`#${index + 1}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={u.avatar}
                                                        alt={u.username}
                                                        className="w-8 h-8 rounded-full border border-zinc-700"
                                                        onError={(e) => { e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                                    />
                                                    <span className="font-medium text-white">{u.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-display font-medium text-primary">
                                                {u.total_generations}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
};

export default LeaderboardPage;

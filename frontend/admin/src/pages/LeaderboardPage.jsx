import React, { useEffect, useState } from 'react';
import { loadLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeaderboardSkeleton = () => {
    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <header>
                <div className="skeleton h-9 w-56 rounded mb-2"></div>
                <div className="skeleton h-4 w-72 rounded"></div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-dark border border-border-dark p-6 rounded-lg shadow-sm">
                    <div className="skeleton h-3 w-32 rounded mb-3"></div>
                    <div className="skeleton h-9 w-28 rounded"></div>
                </div>
            </div>

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
                            {Array.from({ length: 8 }).map((_, index) => (
                                <tr key={index}>
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
        </main>
    );
};

const LeaderboardPage = () => {
    const [data, setData] = useState({ leaderboard: [], total_clearances: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await loadLeaderboard();
                setData({
                    leaderboard: Array.isArray(result?.leaderboard) ? result.leaderboard : [],
                    total_clearances: Number(result?.total_clearances) || 0,
                });
            } catch (err) {
                console.error("Failed to load leaderboard:", err);
                setError("Failed to load leaderboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <LeaderboardSkeleton />;
    }

    if (error) {
        return (
            <main className="flex-1 p-8 flex flex-col items-center justify-center text-center pt-20 lg:pt-8">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                <p className="text-zinc-400">{error}</p>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <header>
                <h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-wide">Leaderboard</h1>
                {!user && <p className="text-zinc-500">Login to be on the leaderboard.</p>}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-dark border border-border-dark p-6 rounded-lg shadow-sm relative overflow-hidden group">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Clearances</p>
                        <div className="inline-flex h-12 min-w-12 items-center justify-center rounded-md bg-zinc-900 border border-zinc-700 px-4 text-2xl font-bold text-white">
                            {data.total_clearances.toLocaleString()}
                        </div>
                </div>
            </div>

            <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border-dark">
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Top Controllers</h2>
                </div>
                <div className="p-4 space-y-3">
                    {data.leaderboard.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 bg-card-bg px-6 py-8 text-center text-zinc-600">
                            No data available yet.
                        </div>
                    ) : (
                        data.leaderboard.map((u, index) => (
                            <div key={u.user_id || index} className="rounded-lg border border-zinc-800 bg-card-bg px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white border border-zinc-700">
                                            #{index + 1}
                                        </div>
                                        <img
                                            src={u.avatar}
                                            alt={u.username}
                                            className="w-9 h-9 rounded-full border border-zinc-700 flex-shrink-0"
                                            onError={(e) => { e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                        />
                                        <div className="min-w-0">
                                            <span className="block font-medium text-white truncate">{u.username}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex min-w-14 items-center justify-center rounded-md bg-zinc-900 border border-zinc-700 px-3 py-1 text-lg font-bold text-primary">
                                            {u.total_generations}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
};

export default LeaderboardPage;

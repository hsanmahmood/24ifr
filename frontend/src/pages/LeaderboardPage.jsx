import React, { useEffect, useState } from 'react';
import { loadLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeaderboardPage = () => {
    const [data, setData] = useState({ leaderboard: [], total_clearances: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await loadLeaderboard();
                setData(result);
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
        return (
            <main className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                <p className="text-zinc-400">{error}</p>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8">
            <header>
                <h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-wide">Leaderboard</h1>
                {!user && <p className="text-zinc-500">Login to be on the leaderboard.</p>}
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-dark border border-border-dark p-6 rounded-lg shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">analytics</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Clearances</p>
                    <p className="font-display text-3xl font-bold text-white">{data.total_clearances.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border-dark">
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Top Controllers</h2>
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
                            {data.leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-zinc-600">
                                        No data available yet.
                                    </td>
                                </tr>
                            ) : (
                                data.leaderboard.map((user, index) => (
                                    <tr key={user.user_id || index} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar}
                                                    alt={user.username}
                                                    className="w-8 h-8 rounded-full border border-zinc-700"
                                                    onError={(e) => { e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                                />
                                                <span className="font-medium text-white">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-display font-medium text-primary">
                                            {user.total_generations}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default LeaderboardPage;

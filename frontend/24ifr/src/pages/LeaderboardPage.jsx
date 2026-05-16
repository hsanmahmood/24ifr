import React, { useState, useEffect } from 'react';
import { loadLeaderboard } from '../services/api';

const LeaderboardPage = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await loadLeaderboard();
                setStats(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="page-loading-skeleton" />;

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
            <header className="mb-8">
                <h1 className="font-display text-3xl font-bold text-white uppercase tracking-wide">Leaderboard</h1>
            </header>
            <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900/50 border-b border-border-dark">
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Controller</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Clearances</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                        {stats.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 text-sm font-bold text-zinc-500 group-hover:text-primary">#{i + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={row.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-8 h-8 rounded-full border border-border-dark" alt="" />
                                        <span className="text-sm font-medium text-zinc-200">{row.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-white text-right">{row.clearance_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default LeaderboardPage;

import React, { useState, useEffect } from 'react';
import { loadLeaderboard } from '../services/api';

const LeaderboardSkeleton = () => (
    <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm animate-fadeIn">
        <div className="bg-zinc-900/50 border-b border-border-dark px-6 py-4">
            <div className="flex gap-4">
                <div className="skeleton h-4 w-12"></div>
                <div className="skeleton h-4 w-40"></div>
                <div className="skeleton h-4 w-20 ml-auto"></div>
            </div>
        </div>
        <div className="divide-y divide-border-dark">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="skeleton h-6 w-8"></div>
                    <div className="skeleton h-10 w-10 rounded-full"></div>
                    <div className="skeleton h-6 w-32"></div>
                    <div className="skeleton h-6 w-16 ml-auto"></div>
                </div>
            ))}
        </div>
    </div>
);

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

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 animate-fadeIn">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight">
                        Controller <span className="text-primary">Leaderboard</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-medium">Top Clearance Delivery Rankings</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-zinc-500 text-[10px] uppercase tracking-tighter font-bold">Total Clearances Tracked</div>
                    <div className="text-2xl font-display font-bold text-white leading-none">
                        {stats.reduce((acc, row) => acc + (row.clearance_count || 0), 0)}
                    </div>
                </div>
            </header>

            {loading ? (
                <LeaderboardSkeleton />
            ) : stats.length === 0 ? (
                <div className="bg-surface-dark border border-border-dark rounded-lg p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-zinc-700 mb-4">leaderboard</span>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">No ranking data available yet</p>
                </div>
            ) : (
                <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/80 border-b border-border-dark">
                                <th className="px-6 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Rank</th>
                                <th className="px-6 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Controller Name</th>
                                <th className="px-6 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Clearance Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark/50">
                            {stats.map((row, i) => {
                                const isTop3 = i < 3;
                                const rankColors = [
                                    'text-[#FACC15]', // Gold
                                    'text-[#E2E2E2]', // Silver
                                    'text-[#CD7F32]', // Bronze
                                ];
                                
                                return (
                                    <tr key={i} className="hover:bg-primary/[0.03] transition-all duration-150 group cursor-default">
                                        <td className="px-6 py-4">
                                            <div className={`font-display text-xl font-black ${isTop3 ? rankColors[i] : 'text-zinc-700'} transition-colors group-hover:text-primary/80`}>
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img 
                                                        src={row.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                                                        className={`w-10 h-10 rounded-full border-2 ${isTop3 ? 'border-primary/20' : 'border-zinc-800'} transition-transform group-hover:scale-105 duration-200`} 
                                                        alt="" 
                                                    />
                                                    {isTop3 && (
                                                        <div className="absolute -top-1 -right-1 bg-primary text-black rounded-full p-0.5 shadow-lg">
                                                            <span className="material-symbols-outlined text-[10px] font-bold">star</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors">{row.username}</span>
                                                    <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-black leading-none">Verified Controller</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xl font-display font-black text-white group-hover:text-primary transition-colors">
                                                    {row.clearance_count}
                                                </span>
                                                <div className="h-1.5 w-24 bg-zinc-900 rounded-full mt-1 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary/40 group-hover:bg-primary transition-all duration-500 ease-out"
                                                        style={{ width: `${(row.clearance_count / stats[0].clearance_count) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            
            <footer className="mt-8 text-center">
                <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-bold">
                    Ranking based on real-time clearance generations since launch
                </p>
            </footer>
        </main>
    );
};

export default LeaderboardPage;

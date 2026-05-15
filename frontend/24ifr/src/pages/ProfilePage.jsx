import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadUserClearances } from '../services/api';

const ProfilePage = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await loadUserClearances();
                setHistory(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="page-loading-skeleton" />;

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
            <header className="mb-8">
                <h1 className="font-display text-3xl font-bold text-white uppercase tracking-wide">User Profile</h1>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <div className="bg-surface-dark border border-border-dark rounded-lg p-8 flex flex-col items-center text-center shadow-sm">
                        <img src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-24 h-24 rounded-full border-2 border-primary/20 mb-4 p-1" alt="" />
                        <h2 className="text-xl font-bold text-white">{user?.username}</h2>
                        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-semibold">ATC Controller</p>
                        <div className="mt-8 pt-8 border-t border-border-dark w-full grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Clearances</p>
                                <p className="text-2xl font-mono text-white">{history.length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                                <p className="text-2xl font-mono text-emerald-500">Active</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-8">
                    <div className="bg-surface-dark border border-border-dark rounded-lg flex flex-col shadow-sm">
                        <div className="px-6 py-4 border-b border-border-dark">
                            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">Recent Clearances</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-900/30 border-b border-border-dark">
                                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Callsign</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Destination</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-dark">
                                    {history.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-xs text-zinc-400 font-mono">{new Date(row.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-white group-hover:text-primary">{row.callsign}</td>
                                            <td className="px-6 py-4 text-sm text-zinc-300">{row.destination}</td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr><td colSpan="3" className="px-6 py-10 text-center text-zinc-600 italic">No clearances generated yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;

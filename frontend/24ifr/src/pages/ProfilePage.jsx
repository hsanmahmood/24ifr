import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadUserClearances } from '../services/api';

const ProfilePage = () => {
    const { user, loading: authLoading } = useAuth();
    const [clearances, setClearances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClearances = async () => {
            if (user) {
                try {
                    const data = await loadUserClearances();
                    setClearances(data);
                } catch (error) {
                    console.error("Failed to load clearances:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchClearances();
        }
    }, [user, authLoading]);

    if (authLoading || (user && loading)) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center pt-20 lg:pt-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </main>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    <img
                        src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt={user.username}
                        className="w-24 h-24 rounded-full border-4 border-zinc-800 shadow-xl"
                        onError={(e) => { e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                    />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-surface-dark"></div>
                </div>
                <div className="text-center md:text-left flex-1">
                    <h1 className="font-display text-3xl font-bold text-white mb-1">{user.username}</h1>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="bg-zinc-900/50 px-4 py-2 rounded border border-zinc-800">
                            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Clearances</span>
                            <span className="block text-xl font-display font-bold text-primary">{clearances.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center">
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Recent Activity</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-900/50 text-xs uppercase font-bold text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 tracking-wider">Date</th>
                                <th className="px-6 py-4 tracking-wider">Callsign</th>
                                <th className="px-6 py-4 tracking-wider">Destination</th>
                                <th className="px-6 py-4 tracking-wider">Clearance Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {clearances.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-zinc-600">
                                        No clearances generated yet.
                                    </td>
                                </tr>
                            ) : (
                                clearances.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleDateString()} <span className="text-zinc-600 text-xs ml-1">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white font-display">
                                            {item.callsign}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs bg-zinc-900/50 rounded px-2 py-1 w-fit">
                                            {item.destination}
                                        </td>
                                        <td className="px-6 py-4 truncate max-w-xs text-xs italic text-zinc-500">
                                            "{item.clearance_text}"
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

export default ProfilePage;

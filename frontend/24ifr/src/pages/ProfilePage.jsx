import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadUserClearances, loginWithDiscord } from '../services/api';

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
        return (
            <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6 pt-20 lg:pt-8">
                <div className="bg-surface-dark border border-border-dark p-8 rounded-lg max-w-md w-full shadow-lg">
                    <span className="material-symbols-outlined text-6xl text-zinc-600 mb-4">lock</span>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Access Restricted</h2>
                    <p className="text-zinc-400 mb-8">Please log in to view your profile and clearance history.</p>
                    <button
                        onClick={loginWithDiscord}
                        className="w-full bg-primary hover:bg-primary-dim text-black font-bold uppercase tracking-widest py-3 px-4 rounded transition-all text-sm flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(250,204,21,0.1)] hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                    >
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-1.65-.6304-2.29-.6304-2.29-.6304a.077.077 0 01-.01-.0051 13.2515 13.2515 0 011.02-.5114.0776.0776 0 00.0263-.105c-.0017-.0023-.0017-.0023 0 0 3.6309 1.761 7.6432 1.761 11.2335 0 .028.0028.028.0028.0263.105a13.2515 13.2515 0 011.02.5114.077.077 0 01-.01.005s-2.922 1.2655-4.572 1.2655a.076.076 0 00-.0416.1057c.3658.699.7773 1.3638 1.226 1.9942a.0777.0777 0 00.0842.0276c1.9616-.6066 3.9401-1.5218 6.0029-3.0294a.077.077 0 00.0312-.0561c.5334-5.5947-.9623-10.1583-3.4116-13.6603a.0741.0741 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                        </svg>
                        Login with Discord
                    </button>
                </div>
            </main>
        );
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

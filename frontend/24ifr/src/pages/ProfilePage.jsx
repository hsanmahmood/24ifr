import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { loadUserClearances, loginWithDiscord } from '../services/api';

const ProfileSkeleton = () => (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="skeleton h-24 w-24 rounded-full"></div>
            <div className="flex-1 w-full space-y-3 text-center md:text-left">
                <div className="skeleton h-8 w-48 rounded mx-auto md:mx-0"></div>
                <div className="skeleton h-4 w-40 rounded mx-auto md:mx-0"></div>
                <div className="flex justify-center md:justify-start">
                    <div className="skeleton h-12 w-32 rounded"></div>
                </div>
            </div>
        </div>

        <div className="bg-surface-dark border border-border-dark rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center">
                <div className="skeleton h-6 w-40 rounded"></div>
            </div>
            <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="rounded-lg border border-zinc-800 bg-card-bg px-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="skeleton h-4 w-24 rounded"></div>
                            <div className="skeleton h-4 w-28 rounded"></div>
                            <div className="skeleton h-4 w-20 rounded ml-auto"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </main>
);

const ClearancePopup = ({ clearance, onClose }) => {
    if (!clearance) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-border-dark bg-surface-dark shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">Clearance</p>
                        <h2 className="mt-1 text-xl font-bold text-white">{clearance.callsign || 'Generated Clearance'}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-primary hover:text-white"
                    >
                        Close
                    </button>
                </div>
                <div className="space-y-4 px-5 py-6 text-sm leading-7 text-zinc-300">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-zinc-800 bg-card-bg px-4 py-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Date</span>
                            <span className="block text-white">{new Date(clearance.created_at).toLocaleString()}</span>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-card-bg px-4 py-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Destination</span>
                            <span className="block text-white">{clearance.destination || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-[#050505] px-4 py-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Clearance Text</p>
                        <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-200">{clearance.clearance_text || 'No clearance text available.'}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const { user, loading: authLoading } = useAuth();
    const { notify } = useNotification();
    const [clearances, setClearances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClearance, setSelectedClearance] = useState(null);

    useEffect(() => {
        const fetchClearances = async () => {
            if (user) {
                try {
                    const data = await loadUserClearances();
                    setClearances(Array.isArray(data) ? data : (data?.clearances || []));
                } catch (error) {
                    console.error("Failed to load clearances:", error);
                    notify.error('Failed to load your clearances.');
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
        return <ProfileSkeleton />;
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
                    <h1 className="font-display text-3xl font-bold text-white mb-1">{user.username || 'Guest User'}</h1>
                    <p className="text-zinc-500 text-sm">Welcome to your profile</p>
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
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Clearances</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-900/50 text-xs uppercase font-bold text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 tracking-wider">Date</th>
                                <th className="px-6 py-4 tracking-wider">Callsign</th>
                                <th className="px-6 py-4 tracking-wider">Destination</th>
                                <th className="px-6 py-4 tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {clearances.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-zinc-600">
                                        No clearances generated yet. Start by visiting the main page and generating a clearance!
                                    </td>
                                </tr>
                            ) : (
                                clearances.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-white">
                                            {new Date(item.created_at).toLocaleDateString()}
                                            <span className="text-zinc-600 text-xs ml-1">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white font-display">
                                            {item.callsign}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs bg-zinc-900/50 rounded px-2 py-1 w-fit text-zinc-300">
                                            {item.destination}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedClearance(item)}
                                                className="rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:brightness-95"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ClearancePopup clearance={selectedClearance} onClose={() => setSelectedClearance(null)} />
        </main>
    );
};

export default ProfilePage;

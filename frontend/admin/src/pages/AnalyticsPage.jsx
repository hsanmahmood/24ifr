import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { loadAdminDailyClearances, loadAdminUserGrowth } from '../services/api';

const SimpleChart = ({ title, series }) => {
    const max = series.length ? Math.max(...series.map(s => s.count || 0)) : 1;
    return (
        <section className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">{title}</h2>
            <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-4">
                <div className="flex h-40 items-end gap-2">
                    {series.map((item) => {
                        const heightPct = max ? Math.max((item.count / max) * 100, item.count > 0 ? 8 : 3) : 3;
                        const label = item.date ? item.date.slice(5) : item.label || '';
                        return (
                            <div key={item.date || item.label} className="flex flex-1 flex-col items-center gap-2">
                                <span className="text-[10px] text-zinc-500">{item.count}</span>
                                <div className="relative flex h-28 w-full items-end">
                                    <div className="w-full rounded-t bg-primary/90" style={{ height: `${heightPct}%` }} title={`${item.date || item.label}: ${item.count}`} />
                                </div>
                                <span className="text-[10px] text-zinc-600">{label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const AnalyticsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const { notify } = useNotification();

    const [loading, setLoading] = useState(true);
    const [series7, setSeries7] = useState([]);
    const [series30, setSeries30] = useState([]);
    const [userGrowth, setUserGrowth] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            if (!user) { setLoading(false); return; }
            setLoading(true);
            try {
                const [s7, s30, ug] = await Promise.all([
                    loadAdminDailyClearances(7),
                    loadAdminDailyClearances(30),
                    loadAdminUserGrowth(30),
                ]);
                setSeries7(s7.series || []);
                setSeries30(s30.series || []);
                setUserGrowth(ug.series || []);
            } catch (err) {
                console.error('Failed to load analytics:', err);
                notify.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [user, notify]);

    if (authLoading || loading) return <div className="page-loading-skeleton" />;
    if (!user) return <div className="p-8">Please login to view analytics.</div>;

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 pt-20 lg:pt-8">
            <header className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Analytics</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-white uppercase tracking-wide">Analytics</h1>
                <p className="mt-2 text-sm text-zinc-400">Clearance and user growth metrics.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleChart title="Clearances - Last 7 days" series={series7} />
                <SimpleChart title="Clearances - Last 30 days" series={series30} />
                <SimpleChart title="User growth (30 days)" series={userGrowth} />
            </div>
        </main>
    );
};

export default AnalyticsPage;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { loadClearancesPerDay, loadClearancesLast7, loadClearancesLast30, loadAdminUserGrowth } from '../services/api';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

const ChartCard = ({ title, children }) => (
    <section className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">{title}</h2>
        <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-4 h-64">
            {children}
        </div>
    </section>
);

const AnalyticsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const { notify } = useNotification();

    const [loadingPerDay, setLoadingPerDay] = useState(true);
    const [dataPerDay, setDataPerDay] = useState([]);
    const [errorPerDay, setErrorPerDay] = useState(null);

    const [loading7, setLoading7] = useState(true);
    const [series7, setSeries7] = useState([]);
    const [error7, setError7] = useState(null);

    const [loading30, setLoading30] = useState(true);
    const [series30, setSeries30] = useState([]);
    const [error30, setError30] = useState(null);

    const [loadingGrowth, setLoadingGrowth] = useState(true);
    const [userGrowth, setUserGrowth] = useState([]);
    const [errorGrowth, setErrorGrowth] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            if (!user) {
                setLoadingPerDay(false);
                setLoading7(false);
                setLoading30(false);
                setLoadingGrowth(false);
                return;
            }

            // per-day
            setLoadingPerDay(true);
            loadClearancesPerDay()
                .then((d) => setDataPerDay(d || []))
                .catch((e) => { console.error(e); setErrorPerDay(String(e)); })
                .finally(() => setLoadingPerDay(false));

            // last 7
            setLoading7(true);
            loadClearancesLast7()
                .then((d) => setSeries7(d || []))
                .catch((e) => { console.error(e); setError7(String(e)); })
                .finally(() => setLoading7(false));

            // last 30
            setLoading30(true);
            loadClearancesLast30()
                .then((d) => setSeries30(d || []))
                .catch((e) => { console.error(e); setError30(String(e)); })
                .finally(() => setLoading30(false));

            // user growth
            setLoadingGrowth(true);
            loadAdminUserGrowth(30)
                .then((d) => setUserGrowth(d || []))
                .catch((e) => { console.error(e); setErrorGrowth(String(e)); })
                .finally(() => setLoadingGrowth(false));
        };
        fetchAll();
    }, [user, notify]);

    if (authLoading) return <div className="page-loading-skeleton" />;
    if (!user) return <div className="p-8">Please login to view analytics.</div>;

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 pt-20 lg:pt-8">
            <header className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Analytics</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-white uppercase tracking-wide">Analytics</h1>
                <p className="mt-2 text-sm text-zinc-400">Clearance and user growth metrics.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Clearances Per Day">
                    {loadingPerDay ? (
                        <div className="h-44 skeleton rounded" />
                    ) : errorPerDay ? (
                        <div className="text-sm text-red-400">{errorPerDay}</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataPerDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip formatter={(value) => [value, 'Clearances']} />
                                    <Bar dataKey="count" fill="#f5c518" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-2 text-xs text-zinc-500">X: Date • Y: Clearances</div>
                        </>
                    )}
                </ChartCard>

                <ChartCard title="Clearances - Last 7 days">
                    {loading7 ? (
                        <div className="h-44 skeleton rounded" />
                    ) : error7 ? (
                        <div className="text-sm text-red-400">{error7}</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={series7} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip formatter={(value) => [value, 'Clearances']} />
                                    <Bar dataKey="count" fill="#f5c518" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-2 text-xs text-zinc-500">X: Date • Y: Clearances</div>
                        </>
                    )}
                </ChartCard>

                <ChartCard title="Clearances - Last 30 days">
                    {loading30 ? (
                        <div className="h-44 skeleton rounded" />
                    ) : error30 ? (
                        <div className="text-sm text-red-400">{error30}</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={series30} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip formatter={(value) => [value, 'Clearances']} />
                                    <Bar dataKey="count" fill="#60a5fa" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-2 text-xs text-zinc-500">X: Date • Y: Clearances</div>
                        </>
                    )}
                </ChartCard>

                <ChartCard title="User growth (30 days)">
                    {loadingGrowth ? (
                        <div className="h-44 skeleton rounded" />
                    ) : errorGrowth ? (
                        <div className="text-sm text-red-400">{errorGrowth}</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip formatter={(value) => [value, 'Users']} />
                                    <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="mt-2 text-xs text-zinc-500">X: Date • Y: Cumulative users</div>
                        </>
                    )}
                </ChartCard>
            </div>
        </main>
    );
};

export default AnalyticsPage;

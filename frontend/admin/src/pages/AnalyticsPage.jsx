import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { loadAdminAnalyticsOverview } from '../services/api';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const parseDate = (value) => new Date(`${value}T00:00:00Z`);

const formatDate = (value) => value.toISOString().slice(0, 10);

const addDays = (date, amount) => {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + amount);
    return next;
};

const buildDateRange = (startDate, endDate) => {
    const dates = [];
    let current = parseDate(startDate);
    const end = parseDate(endDate);

    while (current <= end) {
        dates.push(formatDate(current));
        current = addDays(current, 1);
    }

    return dates;
};

const fillDailySeries = (series, carryForward = false) => {
    if (!series || series.length === 0) {
        return [];
    }

    const normalized = [...series]
        .map((item) => ({
            date: String(item?.date || '').slice(0, 10),
            count: Number(item?.count) || 0,
        }))
        .filter((item) => item.date)
        .sort((left, right) => left.date.localeCompare(right.date));

    if (normalized.length === 0) {
        return [];
    }

    const dateMap = new Map(normalized.map((item) => [item.date, item.count]));
    const startDate = normalized[0].date;
    const endDate = formatDate(new Date());
    const dateRange = buildDateRange(startDate, endDate);
    const output = [];
    let lastValue = 0;

    for (const date of dateRange) {
        if (dateMap.has(date)) {
            lastValue = dateMap.get(date);
        }

        output.push({
            date,
            count: carryForward ? lastValue : (dateMap.get(date) || 0),
        });
    }

    return output;
};

const formatTrend = (value) => {
    if (value === null) {
        return '';
    }

    const sign = value > 0 ? '+' : '';
    return `${sign}${PERCENT_FORMATTER.format(value)}%`;
};

const formatDateTick = (value) => String(value || '').slice(5);

const CustomTooltip = ({ active, payload, label, unit }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const entry = payload[0];
    return (
        <div className="rounded-lg border border-border-dark bg-surface-dark px-3 py-2 shadow-lg">
                <div className="analytics-label-font text-[10px] uppercase text-zinc-500">
                {label}
            </div>
            <div className="mt-1 analytics-value-font text-sm text-white tabular-nums">
                {NUMBER_FORMATTER.format(Number(entry?.value) || 0)} {unit}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, trend, accent = false }) => (
    <div className="rounded-[10px] border border-border-dark bg-surface-dark p-4">
        <div className="flex items-start justify-between gap-3">
            <div>
                <div className="analytics-label-font text-[10px] font-semibold uppercase text-zinc-500">
                    {label}
                </div>
                <div className="analytics-value-font mt-3 text-3xl font-semibold leading-none text-white tabular-nums">
                    {NUMBER_FORMATTER.format(value)}
                </div>
            </div>
            <div className={`analytics-label-font text-[10px] font-semibold uppercase ${accent ? 'text-[#FFD700]' : 'text-zinc-500'}`}>
                {trend}
            </div>
        </div>
    </div>
);

const ChartShell = ({ title, children }) => (
    <section className="rounded-[10px] border border-border-dark bg-surface-dark p-4 md:p-5">
        <div className="analytics-label-font text-[10px] font-semibold uppercase text-zinc-500">
            {title}
        </div>
        <div className="mt-4 h-[300px] rounded-[8px] border border-border-dark bg-card-bg p-3 md:p-4">
            {children}
        </div>
    </section>
);

const AnalyticsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const { notify } = useNotification();

    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState({ metrics: {}, charts: {} });

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await loadAdminAnalyticsOverview();
                setOverview(response || { metrics: {}, charts: {} });
            } catch (err) {
                notify.error('Failed to load analytics data.');
                setOverview({ metrics: {}, charts: {} });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user, notify]);

    const clearancesSeries = useMemo(
        () => fillDailySeries(overview?.charts?.clearances_per_day || [], false),
        [overview],
    );
    const growthSeries = useMemo(
        () => fillDailySeries(overview?.charts?.user_growth || [], true),
        [overview],
    );

    const throughputSeries = useMemo(() => clearancesSeries.slice(-30), [clearancesSeries]);

    const totalClearances = overview?.metrics?.total_clearances || 0;
    const todayClearances = overview?.metrics?.today_clearances || 0;
    const last7Clearances = overview?.metrics?.last7_clearances || 0;
    const last15Clearances = overview?.metrics?.last15_clearances || 0;
    const last30Clearances = overview?.metrics?.last30_clearances || 0;
    const totalUsers = overview?.metrics?.total_users || 0;
    const hasAnalyticsData = Boolean(
        overview?.metrics &&
        Object.keys(overview.metrics).length > 0 &&
        overview?.charts &&
        (overview.charts.clearances_per_day?.length || overview.charts.user_growth?.length)
    );

    const trends = overview?.metrics?.trends || {};

    const metricCards = [
        {
            label: 'TOTAL CLEARANCES',
            value: totalClearances,
            trend: formatTrend(trends.total_clearances),
        },
        {
            label: 'TODAY\'S CLEARANCES',
            value: todayClearances,
            trend: formatTrend(trends.today_clearances),
        },
        {
            label: 'LAST 7 DAYS',
            value: last7Clearances,
            trend: formatTrend(trends.last7_clearances),
        },
        {
            label: '15 DAY VOLUME',
            value: last15Clearances,
            trend: formatTrend(trends.last15_clearances),
        },
        {
            label: '30 DAY VOLUME',
            value: last30Clearances,
            trend: formatTrend(trends.last30_clearances),
            accent: true,
        },
        {
            label: 'TOTAL USERS',
            value: totalUsers,
            trend: formatTrend(trends.total_users),
        },
    ];

    if (authLoading) {
        return <div className="page-loading-skeleton" />;
    }

    if (!user) {
        return <main className="flex h-full items-center justify-center bg-[#131313]" />;
    }

    if (loading) {
        return (
            <main className="h-full overflow-y-auto bg-background-dark p-4 md:p-5 lg:p-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-[118px] rounded-[10px] border border-border-dark bg-surface-dark p-4">
                            <div className="skeleton h-3 w-28 rounded" />
                            <div className="skeleton mt-4 h-10 w-24 rounded" />
                        </div>
                    ))}
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="h-[360px] rounded-[10px] border border-border-dark bg-surface-dark p-4" />
                    <div className="h-[360px] rounded-[10px] border border-border-dark bg-surface-dark p-4" />
                </div>
            </main>
        );
    }

    return (
        <main className="h-full overflow-y-auto bg-background-dark p-4 md:p-5 lg:p-6">
            {!hasAnalyticsData && (
                <div className="mb-4 rounded-[10px] border border-border-dark bg-surface-dark px-4 py-3 text-sm text-zinc-400">
                    No analytics data is available yet.
                </div>
            )}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {metricCards.map((card) => (
                    <StatCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        trend={card.trend}
                        accent={card.accent}
                    />
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <ChartShell title="USER GROWTH">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#393939" strokeDasharray="2 2" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDateTick}
                                tick={{ fill: '#8f8f8f', fontSize: 11, fontFamily: 'Hanken Grotesk, sans-serif' }}
                                tickLine={false}
                                axisLine={{ stroke: '#393939' }}
                                minTickGap={24}
                            />
                            <YAxis
                                tick={{ fill: '#8f8f8f', fontSize: 11, fontFamily: 'Hanken Grotesk, sans-serif' }}
                                tickLine={false}
                                axisLine={{ stroke: '#393939' }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip unit="users" />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#FFD700"
                                strokeWidth={2}
                                fill="url(#growthFill)"
                                dot={false}
                                activeDot={{ r: 3 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartShell>

                <ChartShell title="CLEARANCES">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={throughputSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#393939" strokeDasharray="2 2" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDateTick}
                                tick={{ fill: '#8f8f8f', fontSize: 11, fontFamily: 'Hanken Grotesk, sans-serif' }}
                                tickLine={false}
                                axisLine={{ stroke: '#393939' }}
                                minTickGap={20}
                            />
                            <YAxis
                                tick={{ fill: '#8f8f8f', fontSize: 11, fontFamily: 'Hanken Grotesk, sans-serif' }}
                                tickLine={false}
                                axisLine={{ stroke: '#393939' }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip unit="clearances" />} />
                            <Bar dataKey="count" fill="#FFD700" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartShell>
            </div>
        </main>
    );
};

export default AnalyticsPage;

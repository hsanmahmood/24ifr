import React, { useState, useRef, useEffect } from 'react';
import { useFlightData } from '../hooks/useFlightData';
import FlightPlanList from '../components/FlightPlanList';
import AtcSettings from '../components/AtcSettings';
import GeneratedClearance from '../components/GeneratedClearance';
import * as api from '../services/api';
import { buildClearanceText, normalizeSettings } from '../services/clearance';
import { useAuth } from '../context/AuthContext';

const MainPage = () => {
    const { flightPlans, controllers, atis, selectedFlightPlan, loading, error, selectFlightPlan, refreshData } = useFlightData();
    const { user } = useAuth();
    const mainRef = useRef(null);

    const generateSquawk = () => {
    const { flightPlans, controllers, atis, selectedFlightPlan, loading, refreshing, error, selectFlightPlan, refreshData } = useFlightData();
        const { min, max, exclude } = squawkRanges;
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
        let code;
    const clearanceRef = useRef(null);
        const advancedSettings = normalizeSettings(api.loadUserSettings() || {});
    const handleGenerateClearance = async () => {
            flightPlan: selectedFlightPlan,
            formSettings: settings,
            advancedSettings,
        });

        const storedSettings = api.loadUserSettings() || {};
        setGenerating(true);
        const clearanceData = {
        try {
            const result = await api.generateClearance({
                callsign: selectedFlightPlan.callsign,
                template: storedSettings.clearanceTemplate || undefined,
                event: false,
            });
            callsign: selectedFlightPlan.callsign,
            setGeneratedClearance(result.clearance);
            setCopied(false);
        };
            if (storedSettings.autoCopyClearance && navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(result.clearance);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
            }
            console.error("Failed to track clearance:", error);
            setTimeout(() => {
                clearanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            <div className="lg:col-span-8 flex flex-col gap-6">
            console.error('Failed to generate clearance:', error);
        } finally {
            setGenerating(false);
                    <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-surface-dark z-10 rounded-t-lg">
                        <div>

    const handleCopyClearance = async () => {
        if (!generatedClearance || !navigator?.clipboard?.writeText) {
            return;
        }

        await navigator.clipboard.writeText(generatedClearance);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };
                            <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Active Flight Plans</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Select a flight to generate clearance</p>
        <main className="flex-1 overflow-y-auto px-4 py-4 pt-20 text-white md:px-6 lg:px-6 lg:pt-0">
            <div className="grid min-h-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <section className="min-w-0 space-y-5">
                    <div className="border border-[#1a1a1a] bg-[#111111] rounded-[6px]">
                        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
                        <div>
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white">Active Flight Plans</h2>
                            <p className="mt-1 text-[12px] text-[#888888]">Live relay traffic, updated silently in the background.</p>
                        </div>
                        <button
                            onClick={refreshData}
                            className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#1a1a1a] bg-[#0f0f0f] px-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#888888] transition-[150ms] ease-out hover:border-[#333333] hover:text-white"
                        >
                            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                            Refresh
                        </button>
                    </div>
                    <FlightPlanList
                        flightPlans={flightPlans}
                        selectedFlightPlan={selectedFlightPlan}
                        onSelectFlightPlan={selectFlightPlan}
                        loading={loading}
                        error={error}
                    />
                </div>
            </section>

            <aside className="xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
                <AtcSettings
                    atis={atis}
                    controllers={controllers}
                    onGenerateClearance={handleGenerateClearance}
                    generatedClearance={generatedClearance}
                    onCopyClearance={handleCopyClearance}
                    copied={copied}
                    clearanceRef={clearanceRef}
                    generating={generating}
                />
                <footer className="mt-4 text-center text-[10px] uppercase tracking-[0.18em] text-[#333333]">
                    All rights reserved, Hasan Mahmood ©
                </footer>
            </aside>

        </div>
        </main>
    );
};
export default MainPage;
export default MainPage;

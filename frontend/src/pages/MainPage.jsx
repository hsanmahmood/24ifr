import React, { useState, useRef } from 'react';
import { useFlightData } from '../hooks/useFlightData';
import FlightPlanList from '../components/FlightPlanList';
import AtcSettings from '../components/AtcSettings';
import GeneratedClearance from '../components/GeneratedClearance';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MainPage = () => {
    const { flightPlans, controllers, atis, selectedFlightPlan, loading, error, selectFlightPlan, refreshData } = useFlightData();
    const [generatedClearance, setGeneratedClearance] = useState('');
    const { user } = useAuth();
    const clearanceRef = useRef(null);
    const mainRef = useRef(null);

    const generateSquawk = () => {
        const squawkRanges = { min: 1000, max: 7777, exclude: [7500, 7600, 7700] };
        const { min, max, exclude } = squawkRanges;
        let code;
        do {
            code = Math.floor(min + Math.random() * (max - min + 1));
        } while (exclude.includes(code) || /[89]/.test(code.toString()));
        return code.toString().padStart(4, '0');
    }

    const handleGenerateClearance = async (settings) => {
        if (!selectedFlightPlan) {
            alert('Please select a flight plan first.');
            return;
        }

        const userSettings = api.loadUserSettings();
        const template = userSettings?.clearanceTemplate || "{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} is correct. Cleared to {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb {INITIAL_ALT}FT, expect further climb to Flight Level {FLIGHT_LEVEL}. Squawk {SQUAWK}.";

        const clearance = template
            .replace('{CALLSIGN}', selectedFlightPlan.callsign)
            .replace('{ATC_STATION}', settings.station)
            .replace('{ATIS}', settings.atisLetter || 'A')
            .replace('{DESTINATION}', selectedFlightPlan.arriving)
            .replace('{ROUTE}', settings.routing === 'As Filed' ? (selectedFlightPlan.route || 'as filed') : settings.routing)
            .replace('{RUNWAY}', settings.runway)
            .replace('{INITIAL_ALT}', settings.initialClimb)
            .replace('{FLIGHT_LEVEL}', selectedFlightPlan.flightlevel ? selectedFlightPlan.flightlevel.toString().padStart(3, '0') : 'XXX')
            .replace('{SQUAWK}', generateSquawk());

        setGeneratedClearance(clearance);

        setTimeout(() => {
            clearanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        const clearanceData = {
            clearance_text: clearance,
            user_id: user?.id,
            discord_username: user?.username,
        };

        try {
            await api.trackClearanceGeneration(clearanceData);
        } catch (error) {
            console.error("Failed to track clearance:", error);
        }
    };

    return (
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-surface-dark border border-border-dark rounded-lg flex flex-col shadow-sm">
                    <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-surface-dark z-10 rounded-t-lg">
                        <div>
                            <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Active Flight Plans</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Select a flight to generate clearance</p>
                        </div>
                        <button onClick={refreshData} className="bg-zinc-900 hover:bg-primary text-zinc-400 hover:text-black border border-zinc-800 hover:border-primary px-3 py-2 rounded transition-all flex items-center gap-2 group text-xs font-medium uppercase tracking-wider">
                            <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform">refresh</span>
                            <span className="hidden sm:inline">Refresh</span>
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
                <div ref={clearanceRef}>
                    <GeneratedClearance clearance={generatedClearance} />
                </div>
            </div>
            <div className="lg:col-span-4 flex flex-col h-full">
                <AtcSettings
                    atis={atis}
                    controllers={controllers}
                    onGenerateClearance={handleGenerateClearance}
                />
                <footer className="mt-auto pt-8 pb-4 text-center text-[10px] text-zinc-700">
                    <p>All rights reserved, Hasan Mahmood ©</p>
                </footer>
            </div>
            {generatedClearance && (
                <button
                    onClick={() => {
                        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        setGeneratedClearance('');
                    }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-primary hover:border-primary px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-200 ease-out z-50 group hover:scale-105 active:scale-95"
                    title="Scroll to Top"
                >
                    <span className="material-symbols-outlined text-xl group-hover:-translate-y-0.5 transition-transform duration-200">arrow_upward</span>
                    <span className="text-xs font-bold uppercase tracking-wider">New Clearance</span>
                </button>
            )}
        </main>
    );
};

export default MainPage;

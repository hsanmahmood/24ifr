import React, { useState, useMemo, useRef, useEffect } from 'react';
import AtcSettings from '../components/AtcSettings';
import FlightPlanSection from '../components/MainPage/FlightPlanSection';
import ClearanceDisplay from '../components/MainPage/ClearanceDisplay';
import { useFlightData } from '../hooks/useFlightData';
import { useSettings } from '../context/SettingsContext';
import * as api from '../services/api';
import { buildClearanceText, normalizeSettings } from '../services/clearance';

const MainPage = ({ onOpenLegalPopup, onOpenAboutPopup, onOpenSupportPopup }) => {
    const { flightPlans, controllers, atis, selectedFlightPlan, loading, error, selectFlightPlan, refreshData } = useFlightData();
    const { settings } = useSettings();
    
    const [generatedClearance, setGeneratedClearance] = useState(null);
    const [generationLoading, setGenerationLoading] = useState(false);
    const [refreshLoading, setRefreshLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [departureAirport, setDepartureAirport] = useState('');
    
    const mainRef = useRef(null);
    const clearanceRef = useRef(null);
    const atcSettingsRef = useRef(null);

    const PLANS_PER_PAGE = 25;

    const filteredPlans = useMemo(() => {
        if (!departureAirport) return flightPlans;
        return flightPlans.filter(p => p.departing?.toUpperCase() === departureAirport.toUpperCase());
    }, [flightPlans, departureAirport]);

    const totalPages = Math.ceil(filteredPlans.length / PLANS_PER_PAGE);
    const paginatedPlans = useMemo(() => {
        const start = (currentPage - 1) * PLANS_PER_PAGE;
        return filteredPlans.slice(start, start + PLANS_PER_PAGE);
    }, [filteredPlans, currentPage]);

    const canGenerateClearance = Boolean(selectedFlightPlan && departureAirport);

    const handleGenerateClearance = async (formSettings) => {
        if (!canGenerateClearance) return;

        setGenerationLoading(true);
        try {
            const savedSettings = api.loadUserSettings() || {};
            // Allow generation even if user hasn't configured settings; defaults will be applied
            const advancedSettings = normalizeSettings(savedSettings);
            const clearance = buildClearanceText({
                flightPlan: selectedFlightPlan,
                formSettings,
                advancedSettings,
            });

            setGeneratedClearance(clearance);

            setTimeout(() => {
                clearanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

            const clearanceData = {
                clearance_text: clearance,
                callsign: selectedFlightPlan.callsign,
                destination: selectedFlightPlan.arriving,
            };

            try {
                await api.trackClearanceGeneration(clearanceData);
                console.log('Clearance generated and tracked');
            } catch (err) {
                console.error('Failed to track clearance:', err);
            }
        } finally {
            setGenerationLoading(false);
        }
    };

    // Auto-scroll to clearance when generated
    useEffect(() => {
        if (generatedClearance && clearanceRef.current) {
            setTimeout(() => {
                clearanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [generatedClearance]);

    const handleRefresh = async () => {
        setRefreshLoading(true);
        try {
            await refreshData();
        } finally {
            setRefreshLoading(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        mainRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
        atcSettingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div ref={mainRef} className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <FlightPlanSection
                        plans={paginatedPlans}
                        selected={selectedFlightPlan}
                        onSelect={p => {
                            selectFlightPlan(p);
                            setGeneratedClearance(null);
                        }}
                        loading={loading}
                        error={error}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        onRefresh={handleRefresh}
                        refreshLoading={refreshLoading}
                    />
                    <ClearanceDisplay 
                        ref={clearanceRef}
                        clearance={generatedClearance} 
                        loading={generationLoading} 
                    />
                    {generatedClearance && (
                        <button
                            onClick={() => {
                                scrollToTop();
                                setGeneratedClearance('');
                            }}
                            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-primary hover:border-primary px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-200 ease-out z-50 group hover:scale-105 active:scale-95"
                            title="Scroll to Top"
                        >
                            <span className="material-symbols-outlined text-xl group-hover:-translate-y-0.5 transition-transform duration-200">arrow_upward</span>
                            <span className="text-xs font-bold uppercase tracking-wider">New Clearance</span>
                        </button>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <div ref={atcSettingsRef}>
                        <AtcSettings
                            atis={atis}
                            controllers={controllers}
                            onGenerateClearance={handleGenerateClearance}
                            loading={false}
                            generationLoading={generationLoading}
                            onAirportChange={setDepartureAirport}
                            canGenerate={canGenerateClearance}
                        />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={onOpenLegalPopup}
                            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors hover:text-primary"
                        >
                            Privacy & Terms
                        </button>
                        <span className="text-zinc-700">•</span>
                        <button
                            type="button"
                            onClick={onOpenAboutPopup}
                            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors hover:text-primary"
                        >
                            Credits
                        </button>
                        <span className="text-zinc-700">•</span>
                        <button
                            type="button"
                            onClick={onOpenSupportPopup}
                            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors hover:text-primary"
                        >
                            Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainPage;

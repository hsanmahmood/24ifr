import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFlightData } from '../hooks/useFlightData';
import FlightPlanList from '../components/FlightPlanList';
import AtcSettings from '../components/AtcSettings';
import GeneratedClearance from '../components/GeneratedClearance';
import AboutPopup from '../components/AboutPopup';
import SupportPopup from '../components/SupportPopup';
import * as api from '../services/api';
import { buildClearanceText, normalizeSettings } from '../services/clearance';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const MainPage = ({ onOpenLegalPopup }) => {
    const { flightPlans, controllers, atis, selectedFlightPlan, loading, error, selectFlightPlan, refreshData } = useFlightData();
    const { notify } = useNotification();
    const [generatedClearance, setGeneratedClearance] = useState('');
    const [selectedAirport, setSelectedAirport] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreditsOpen, setIsCreditsOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [documents, setDocuments] = useState([]);
    const { user } = useAuth();
    const clearanceRef = useRef(null);
    const mainRef = useRef(null);

    const normalizeCode = (value) => (value || '').toString().trim().toUpperCase();
    const savedSettings = api.loadUserSettings() || {};
    const canGenerateClearance = Boolean(selectedAirport);
    const filteredFlightPlans = useMemo(() => (
        selectedAirport
            ? flightPlans.filter((plan) => normalizeCode(plan.departing) === normalizeCode(selectedAirport))
            : flightPlans
    ), [flightPlans, selectedAirport]);
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filteredFlightPlans.length / pageSize));
    const pagedFlightPlans = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredFlightPlans.slice(startIndex, startIndex + pageSize);
    }, [filteredFlightPlans, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedAirport]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        if (filteredFlightPlans.length === 0) {
            selectFlightPlan(null);
            return;
        }

        const currentSelection = selectedFlightPlan?.callsign;
        const stillVisible = currentSelection && filteredFlightPlans.some((plan) => plan.callsign === currentSelection);

        if (!stillVisible) {
            selectFlightPlan(filteredFlightPlans[0]);
        }
    }, [filteredFlightPlans, selectedFlightPlan, selectFlightPlan]);

    useEffect(() => {
        const loadDocs = async () => {
            try {
                const result = await api.loadAdminDocuments();
                setDocuments(result.documents || []);
            } catch (err) {
                notify.error('Failed to load admin documents for popups.');
                setDocuments([]);
            }
        };

        loadDocs();
    }, []);

    

    const handleGenerateClearance = async (settings) => {
        const savedSettings = api.loadUserSettings();

            if (!selectedAirport) {
                notify.error('Please select a departure airport first.');
                return;
            }
        if (!selectedFlightPlan) {
            notify.error('Please select a flight plan first.');
            return;
        }

        const advancedSettings = normalizeSettings(savedSettings || {});
        const clearance = buildClearanceText({
            flightPlan: selectedFlightPlan,
            formSettings: settings,
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
            user_id: user?.id,
            discord_username: user?.username,
        };

        try {
            await api.trackClearanceGeneration(clearanceData);
            notify.success('Clearance generated');
        } catch (_) {
            notify.error('Failed to save clearance');
        }
    };

    return (
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 pt-20 lg:pt-6">
            <AboutPopup
                isOpen={isCreditsOpen}
                onClose={() => setIsCreditsOpen(false)}
                content={documents.find((doc) => doc.doc_key === 'credits')?.content_md || ''}
            />
            <SupportPopup
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                content={documents.find((doc) => doc.doc_key === 'support')?.content_md || ''}
            />
            <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-surface-dark border border-border-dark rounded-lg flex flex-col shadow-sm">
                    <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-surface-dark z-10 rounded-t-lg">
                        <div>
                            <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Flight Plans</h2>
                        </div>
                        <button onClick={refreshData} className="bg-zinc-900 hover:bg-primary text-zinc-400 hover:text-black border border-zinc-800 hover:border-primary px-3 py-2 rounded transition-all flex items-center gap-2 group text-xs font-medium uppercase tracking-wider">
                            <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform">refresh</span>
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                    <FlightPlanList
                        flightPlans={pagedFlightPlans}
                        selectedFlightPlan={selectedFlightPlan}
                        onSelectFlightPlan={selectFlightPlan}
                        loading={loading}
                        error={error}
                        currentPage={currentPage}
                        totalPages={filteredFlightPlans.length > pageSize ? totalPages : 1}
                        onPageChange={setCurrentPage}
                    />
                </div>
                <div ref={clearanceRef}>
                    <GeneratedClearance clearance={generatedClearance} />
                </div>
            </div>
            <div className="lg:col-span-4 flex flex-col h-full lg:sticky lg:top-6">
                <AtcSettings
                    atis={atis}
                    controllers={controllers}
                    loading={loading}
                    onGenerateClearance={handleGenerateClearance}
                    onAirportChange={setSelectedAirport}
                    canGenerate={canGenerateClearance}
                    selectedFlightPlan={selectedFlightPlan}
                />
                <div className="mt-3 flex justify-center">
                    <div className="flex items-center gap-3">
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
                            onClick={() => setIsCreditsOpen(true)}
                            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors hover:text-primary"
                        >
                            Credits
                        </button>
                    </div>
                </div>
                <div className="mt-3 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setIsSupportOpen(true)}
                        className="rounded-lg border border-zinc-800 bg-[#050505] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400 transition-colors hover:border-primary hover:text-primary"
                    >
                        Support
                    </button>
                </div>
            </div>
            {generatedClearance && (
                <button
                    onClick={() => {
                        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        setGeneratedClearance('');
                    }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-primary hover:border-primary px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-200 ease-out z-50 group hover:scale-105 active:scale-95"
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

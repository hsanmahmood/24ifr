import React, { useState, useMemo } from 'react';
import AtcSettings from '../components/AtcSettings';
import FlightPlanSection from '../components/MainPage/FlightPlanSection';
import ClearanceDisplay from '../components/MainPage/ClearanceDisplay';
import { useFlightData } from '../hooks/useFlightData';
import { useSettings } from '../context/SettingsContext';
import * as api from '../services/api';

const MainPage = () => {
    const { flightPlans, controllers, atis, selectedFlightPlan, loading, error, selectFlightPlan, refreshData } = useFlightData();
    const { settings } = useSettings();
    
    const [generatedClearance, setGeneratedClearance] = useState(null);
    const [generationLoading, setGenerationLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [departureAirport, setDepartureAirport] = useState('');

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

    const handleGenerateClearance = async (formSettings) => {
        if (!selectedFlightPlan) return;

        setGenerationLoading(true);
        try {
            const result = await api.generateClearance({
                callsign: selectedFlightPlan.callsign,
                template: settings.clearanceTemplate,
                ...formSettings
            });
            setGeneratedClearance(result.clearance);
        } catch (err) {
            console.error(err);
        } finally {
            setGenerationLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
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
                        onRefresh={refreshData}
                    />
                    <ClearanceDisplay 
                        clearance={generatedClearance} 
                        loading={generationLoading} 
                    />
                </div>

                <div className="lg:col-span-4">
                    <div className="sticky top-24">
                        <AtcSettings
                            atis={atis}
                            controllers={controllers}
                            onGenerateClearance={handleGenerateClearance}
                            loading={loading}
                            onAirportChange={setDepartureAirport}
                            canGenerate={!!selectedFlightPlan}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainPage;

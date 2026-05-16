import React from 'react';
import FlightPlanList from '../FlightPlanList';

const FlightPlanSection = ({ 
    plans, 
    selected, 
    onSelect, 
    loading, 
    error, 
    currentPage, 
    totalPages, 
    onPageChange, 
    onRefresh 
}) => {
    return (
        <div className="bg-surface-dark border border-border-dark rounded-lg flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-surface-dark z-10 rounded-t-lg">
                <div>
                    <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Flight Plans</h2>
                </div>
                <button 
                    onClick={onRefresh} 
                    className="bg-zinc-900 hover:bg-primary text-zinc-400 hover:text-black border border-zinc-800 hover:border-primary px-3 py-2 rounded transition-all flex items-center gap-2 group text-xs font-medium uppercase tracking-wider"
                >
                    <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform">refresh</span>
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>
            <FlightPlanList
                flightPlans={plans}
                selectedFlightPlan={selected}
                onSelectFlightPlan={onSelect}
                loading={loading}
                error={error}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        </div>
    );
};

export default FlightPlanSection;

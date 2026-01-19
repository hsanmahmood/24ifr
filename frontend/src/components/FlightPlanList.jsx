import React from 'react';
import Loading from './Loading';

const FlightPlanList = ({ flightPlans, selectedFlightPlan, onSelectFlightPlan, loading, error }) => {
    if (loading) return <Loading />;
    if (error) return <p className="text-center text-red-500">Failed to load flight plans.</p>;
    if (flightPlans.length === 0) return <p className="text-center text-zinc-500">There is no active flightplans</p>;

    return (
        <div className="p-4 space-y-3">
            {flightPlans.map((plan) => {
                const isSelected = selectedFlightPlan?.callsign === plan.callsign;
                return (
                    <div
                        key={plan.callsign}
                        onClick={() => onSelectFlightPlan(plan)}
                        className="block relative group cursor-pointer mb-3"
                    >
                        <div className={`bg-card-bg border rounded-md p-4 transition-all duration-200 shadow-sm relative overflow-hidden ${isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-zinc-800 hover:bg-primary/5 hover:border-primary/50'
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className={`font-display font-bold text-lg tracking-tight transition-colors ${isSelected ? 'text-primary' : 'text-white'}`}>
                                        {plan.callsign}
                                    </h3>
                                    <div className="flex gap-2">
                                        <span className="bg-zinc-800 text-[10px] px-2 py-0.5 rounded text-zinc-400 font-mono border border-zinc-700/50">{plan.aircraft || 'N/A'}</span>
                                        <span className="text-zinc-500 text-[10px] font-mono flex items-center">FL {plan.flightlevel || 'N/A'}</span>
                                    </div>
                                </div>
                                <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{plan.flightrules}</span>
                            </div>
                            <div className="flex items-center justify-between px-2 relative">
                                <div className="text-xl font-display font-bold text-zinc-200 tracking-wider">{plan.departing}</div>
                                <div className="flex-1 flex flex-col items-center mx-4 relative">
                                    <div className="w-full h-[1px] bg-zinc-800 group-hover:bg-zinc-700 transition-colors"></div>
                                    <span className="material-symbols-outlined absolute -top-3 text-zinc-600 text-lg bg-card-bg px-1 rotate-90 group-hover:text-zinc-400 transition-colors flight-line-icon">flight</span>
                                </div>
                                <div className="text-xl font-display font-bold text-zinc-200 tracking-wider">{plan.arriving}</div>
                            </div>
                            <div className="mt-3 flex justify-between items-end">
                                <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider truncate max-w-[200px]">{plan.route || 'GPS Direct'}</div>
                            </div>
                            <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-primary transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FlightPlanList;

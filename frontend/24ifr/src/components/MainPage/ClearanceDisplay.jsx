import React from 'react';
import GeneratedClearance from '../GeneratedClearance';

const ClearanceDisplay = ({ clearance, loading }) => {
    if (!clearance && !loading) {
        return (
            <div className="bg-surface-dark border border-border-dark rounded-lg p-10 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-zinc-800 mb-4">assignment</span>
                <p className="text-zinc-600 font-medium">Select a flight plan and configure settings to generate a clearance.</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-dark border border-border-dark rounded-lg flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center rounded-t-lg">
                <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Generated Clearance</h2>
            </div>
            <div className="p-6">
                <GeneratedClearance clearance={clearance} loading={loading} />
            </div>
        </div>
    );
};

export default ClearanceDisplay;

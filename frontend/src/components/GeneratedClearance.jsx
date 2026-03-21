import React from 'react';

const GeneratedClearance = ({ clearance }) => {
    return (
        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-sm">
            <h2 className="font-display text-sm font-bold text-zinc-400 tracking-wide uppercase mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">description</span>
                Generated Clearance
            </h2>
            <div className="w-full border border-dashed border-zinc-800 rounded min-h-[120px] flex items-center justify-center p-6 text-center bg-[#050505]">
                {clearance ? (
                    <p className="text-zinc-300 font-mono text-sm">{clearance}</p>
                ) : (
                    <p className="text-zinc-600 font-mono text-xs">
                        Select a flight plan and configure ATC settings to generate clearance...
                    </p>
                )}
            </div>
        </div>
    );
};

export default GeneratedClearance;

import React, { forwardRef } from 'react';

const ClearanceDisplay = forwardRef(({ clearance, loading }, ref) => {
    return (
        <div ref={ref} className="bg-surface-dark border border-border-dark rounded-lg flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center rounded-t-lg">
                <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Generated Clearance</h2>
            </div>
            <div className="p-6">
                <div className="w-full border border-dashed border-zinc-800 rounded min-h-[120px] flex items-center justify-center p-6 text-center bg-[#050505]">
                    {clearance ? (
                        <p className="text-zinc-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">{clearance}</p>
                    ) : loading ? (
                        <p className="text-zinc-600 font-mono text-xs">Generating clearance...</p>
                    ) : (
                        <p className="text-zinc-600 font-mono text-xs">
                            Select a flight plan and configure ATC settings to generate clearance...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

export default ClearanceDisplay;

export const DEFAULT_TEMPLATE = '[CALLSIGN], [ATC_STATION], good day. Startup approved. Information [ATIS] is correct. Cleared to [DESTINATION] via [ROUTE], runway [RUNWAY]. Initial climb [INITIAL_ALT]FT, expect further climb to Flight Level [FLIGHT_LEVEL]. Squawk [SQUAWK].';

export const PLACEHOLDERS = [
    '[CALLSIGN]', '[ATC_STATION]', '[ATIS]', '[DESTINATION]',
    '[ROUTE]', '[RUNWAY]', '[INITIAL_ALT]', '[FLIGHT_LEVEL]', '[SQUAWK]'
];

export const normalizeSettings = (s = {}) => ({
    clearanceTemplate: s.clearanceTemplate || DEFAULT_TEMPLATE,
    defaultAtcStation: s.defaultAtcStation || '',
    defaultRouting: s.defaultRouting || 'As Filed',
    defaultRoutingDetails: s.defaultRoutingDetails || '',
    uppercaseCallsign: s.uppercaseCallsign ?? true,
});

export const formatFlightLevel = (fl) => {
    const num = Number(fl);
    if (!Number.isFinite(num) || num <= 0) return 'XXX';
    const val = num > 999 ? Math.floor(num / 100) : num;
    return String(val).padStart(3, '0');
};

export const resolveRouting = ({ flightPlan, routing, details, settings }) => {
    const s = normalizeSettings(settings);
    const mode = routing || s.defaultRouting;
    const d = details || s.defaultRoutingDetails || '';

    if (mode === 'As Filed') return flightPlan?.route || '';
    if (mode === 'SID') return d ? `the ${d} departure` : 'the departure procedure';
    if (mode === 'DIRECT') return d ? `direct ${d}` : (flightPlan?.route || 'direct');
    if (mode === 'VECTORS') return 'Radar Vectors';
    return d || flightPlan?.route || 'as filed';
};

export const applyTemplate = (template, replacements) => {
    return Object.entries(replacements).reduce((out, [token, value]) => {
        return out.replace(new RegExp(`\\[${token}\\]`, 'g'), value ?? '');
    }, template);
};
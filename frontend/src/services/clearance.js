export const DEFAULT_CLEARANCE_TEMPLATE = '{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} is correct. Cleared to {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb {INITIAL_ALT}FT, expect further climb to Flight Level {FLIGHT_LEVEL}. Squawk {SQUAWK}.';

export const CLEARANCE_PLACEHOLDERS = [
    '{CALLSIGN}',
    '{ATC_STATION}',
    '{ATIS}',
    '{DESTINATION}',
    '{ROUTE}',
    '{RUNWAY}',
    '{INITIAL_ALT}',
    '{FLIGHT_LEVEL}',
    '{SQUAWK}',
];

export const DEFAULT_CLEARANCE_SETTINGS = {
    clearanceTemplate: DEFAULT_CLEARANCE_TEMPLATE,
    defaultAtcStation: '',
    defaultRunway: '',
    defaultAtisLetter: 'A',
    defaultRouting: 'As Filed',
    defaultRoutingDetails: '',
    defaultInitialClimb: '5000',
    autoCopyClearance: false,
    uppercaseCallsign: true,
    useFiledRouteFallback: true,
};

export const normalizeSettings = (settings = {}) => ({
    ...DEFAULT_CLEARANCE_SETTINGS,
    ...settings,
});

export const formatFlightLevel = (flightlevel) => {
    const numericFlightLevel = Number(flightlevel);
    if (!Number.isFinite(numericFlightLevel) || numericFlightLevel <= 0) {
        return 'XXX';
    }

    const normalized = numericFlightLevel > 999 ? Math.floor(numericFlightLevel / 100) : numericFlightLevel;
    return String(normalized).padStart(3, '0');
};

export const generateSquawk = () => {
    const excluded = new Set([7500, 7600, 7700]);
    let code = '';

    while (!code) {
        const candidate = Math.floor(1000 + Math.random() * 6778);
        if (excluded.has(candidate)) {
            continue;
        }

        const candidateText = String(candidate);
        if (/[89]/.test(candidateText)) {
            continue;
        }

        code = candidateText.padStart(4, '0');
    }

    return code;
};

export const resolveRoutingPhrase = ({ flightPlan, routing, routingDetails, settings }) => {
    const clearanceSettings = normalizeSettings(settings);
    const mode = routing || clearanceSettings.defaultRouting;
    const details = routingDetails || clearanceSettings.defaultRoutingDetails || '';

    if (mode === 'As Filed') {
        return flightPlan?.route || (clearanceSettings.useFiledRouteFallback ? 'as filed' : '');
    }

    if (mode === 'SID') {
        return details ? `the ${details} departure` : 'the departure procedure';
    }

    if (mode === 'DIRECT') {
        return details ? `direct ${details}` : flightPlan?.route || 'direct';
    }

    if (mode === 'VECTORS') {
        return details || 'radar vectors';
    }

    return details || flightPlan?.route || 'as filed';
};

export const applyTemplate = (template, replacements) => {
    return Object.entries(replacements).reduce((output, [token, value]) => {
        return output.replace(new RegExp(`\\{${token}\\}`, 'g'), value ?? '');
    }, template);
};

export const buildClearanceText = ({ flightPlan, formSettings = {}, advancedSettings = {} }) => {
    const settings = normalizeSettings(advancedSettings);
    const routePhrase = resolveRoutingPhrase({
        flightPlan,
        routing: formSettings.routing,
        routingDetails: formSettings.routingDetails,
        settings,
    });

    const template = settings.clearanceTemplate || DEFAULT_CLEARANCE_TEMPLATE;
    const callsign = flightPlan?.callsign ? (settings.uppercaseCallsign ? flightPlan.callsign.toUpperCase() : flightPlan.callsign) : '';
    const station = formSettings.station || settings.defaultAtcStation || '';
    const runway = formSettings.runway || settings.defaultRunway || '';
    const atisLetter = formSettings.atisLetter || settings.defaultAtisLetter || 'A';
    const initialClimb = formSettings.initialClimb || settings.defaultInitialClimb || '';
    const flightLevel = formatFlightLevel(flightPlan?.flightlevel);

    return applyTemplate(template, {
        CALLSIGN: callsign,
        ATC_STATION: station,
        ATIS: atisLetter,
        DESTINATION: flightPlan?.arriving || '',
        ROUTE: routePhrase,
        RUNWAY: runway,
        INITIAL_ALT: initialClimb,
        FLIGHT_LEVEL: flightLevel,
        SQUAWK: generateSquawk(),
    }).trim();
};
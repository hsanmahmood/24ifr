export const DEFAULT_TEMPLATE = "{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.";

export const PLACEHOLDERS = [
    "{CALLSIGN}",
    "{ATC_STATION}",
    "{ATIS}",
    "{DESTINATION}",
    "{ROUTE}",
    "{RUNWAY}",
    "{INITIAL_ALT}",
    "{FLIGHT_LEVEL}",
    "{SQUAWK}",
];

export const DEFAULT_SETTINGS = {
    clearanceTemplate: DEFAULT_TEMPLATE,
    defaultRouting: "As Filed",
    defaultRoutingDetails: "",
    uppercaseCallsign: true,
};

export const normalizeSettings = (s = {}) => ({
    clearanceTemplate: s.clearanceTemplate || DEFAULT_TEMPLATE,
    defaultRouting: s.defaultRouting || "As Filed",
    defaultRoutingDetails: s.defaultRoutingDetails || "",
    uppercaseCallsign: s.uppercaseCallsign ?? true,
});

export const formatFlightLevel = (fl) => {
    const num = Number(fl);
    if (!Number.isFinite(num) || num <= 0) return "XXX";
    const val = num > 999 ? Math.floor(num / 100) : num;
    return String(val).padStart(3, "0");
};

export const generateSquawk = () => {
    const excluded = new Set(["7500", "7600", "7700"]);
    const digits = "01234567";
    while (true) {
        const code = Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * digits.length)]).join("");
        if (!excluded.has(code)) return code;
    }
};

export const applyTemplate = (template, replacements) =>
    Object.entries(replacements).reduce(
        (out, [token, value]) => out.replace(new RegExp(`\\{${token}\\}`, "g"), value ?? ""),
        template
    ).trim();

export const resolveRouting = ({ flightPlan, routing, routingDetails, settings }) => {
    const s = normalizeSettings(settings);
    const mode = routing || s.defaultRouting;
    const details = routingDetails || s.defaultRoutingDetails || "";
    if (mode === "As Filed") return flightPlan?.route || "";
    if (mode === "SID") return details ? `the ${details} departure` : "the departure procedure";
    if (mode === "DIRECT") return details ? `direct ${details}` : (flightPlan?.route || "direct");
    if (mode === "VECTORS") return "Radar Vectors";
    return details || flightPlan?.route || "as filed";
};

export const buildClearanceText = ({ flightPlan, formSettings = {}, advancedSettings = {} }) => {
    const settings = normalizeSettings(advancedSettings);
    const routePhrase = resolveRouting({
        flightPlan,
        routing: formSettings.routing,
        routingDetails: formSettings.routingDetails,
        settings,
    });
    const template = settings.clearanceTemplate || DEFAULT_TEMPLATE;
    const callsign = flightPlan?.callsign
        ? settings.uppercaseCallsign
            ? flightPlan.callsign.toUpperCase()
            : flightPlan.callsign
        : "";
    return applyTemplate(template, {
        CALLSIGN: callsign,
        ATC_STATION: formSettings.station || "",
        ATIS: formSettings.atisLetter || "",
        DESTINATION: flightPlan?.arriving || "",
        ROUTE: routePhrase,
        RUNWAY: formSettings.runway || "",
        INITIAL_ALT: formSettings.initialClimb || "3000",
        FLIGHT_LEVEL: formatFlightLevel(flightPlan?.flightlevel),
        SQUAWK: generateSquawk(),
    });
};
export const DEFAULT_CLEARANCE_TEMPLATE = '{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.';

export const CLEARANCE_PLACEHOLDERS = [
    '[CALLSIGN]',
    '[ATC_STATION]',
    '[ATIS]',
    '[DESTINATION]',
    '[ROUTE]',
    '[RUNWAY]',
    '[INITIAL_ALT]',
    '[FLIGHT_LEVEL]',
    '[SQUAWK]',
];

export const DEFAULT_CLEARANCE_SETTINGS = {
    clearanceTemplate: DEFAULT_CLEARANCE_TEMPLATE,
    defaultRouting: 'As Filed',
    defaultRoutingDetails: '',
    uppercaseCallsign: true,
};

export const normalizeSettings = (settings = {}) => ({
    ...DEFAULT_CLEARANCE_SETTINGS,
    clearanceTemplate: settings.clearanceTemplate ?? DEFAULT_CLEARANCE_SETTINGS.clearanceTemplate,
    defaultRouting: settings.defaultRouting ?? DEFAULT_CLEARANCE_SETTINGS.defaultRouting,
    defaultRoutingDetails: settings.defaultRoutingDetails ?? DEFAULT_CLEARANCE_SETTINGS.defaultRoutingDetails,
    uppercaseCallsign: settings.uppercaseCallsign ?? DEFAULT_CLEARANCE_SETTINGS.uppercaseCallsign,
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
        return flightPlan?.route || '';
    }

    if (mode === 'SID') {
        return details ? `the ${details} departure` : 'the departure procedure';
    }

    if (mode === 'DIRECT') {
        return details ? `direct ${details}` : flightPlan?.route || 'direct';
    }

    if (mode === 'VECTORS') {
        return 'Radar Vectors';
    }

    return details || flightPlan?.route || 'as filed';
};

export const applyTemplate = (template, replacements) => {
    return Object.entries(replacements).reduce((output, [token, value]) => {
        const replacement = value ?? '';
        return output
            .replace(new RegExp(`\\[${token}\\]`, 'g'), replacement)
            .replace(new RegExp(`\\{${token}\\}`, 'g'), replacement);
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
    const station = formSettings.station || '';
    const runway = formSettings.runway || '';
    const atisLetter = formSettings.atisLetter || '';
    const initialClimb = formSettings.initialClimb || '';
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
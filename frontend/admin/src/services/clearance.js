export const DEFAULT_AUTHORITY = "ICAO-E";

export const AUTHORITY_LABELS = {
    FAA: "FAA (USA)",
    "ICAO-E": "ICAO-E (Europe)",
    CASA: "CASA (Australia)",
    CAA: "CAA (UK)",
    Generic: "Generic",
};

export const AUTHORITY_ORDER = ["FAA", "ICAO-E", "CASA", "CAA", "Generic"];

export const DEFAULT_AUTHORITY_TEMPLATES = {
    FAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} airport via {ROUTE}, maintain {INITIAL_ALT}, expect {FLIGHT_LEVEL} ten minutes after departure, squawk {SQUAWK}.",
    "ICAO-E": "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, initial climb {INITIAL_ALT}, squawk {SQUAWK}, information {ATIS}.",
    CASA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, runway {RUNWAY}, maintain {INITIAL_ALT}, squawk {SQUAWK}, ATIS {ATIS}.",
    CAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, climb initially {INITIAL_ALT}, squawk {SQUAWK}, QNH [set by controller].",
    Generic: "{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.",
};

export const DEFAULT_TEMPLATE = DEFAULT_AUTHORITY_TEMPLATES.Generic;

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
    activeAuthority: DEFAULT_AUTHORITY,
    authorities: Object.fromEntries(
        AUTHORITY_ORDER.map((authority) => [authority, { template: DEFAULT_AUTHORITY_TEMPLATES[authority] }])
    ),
    clearanceTemplate: DEFAULT_TEMPLATE,
    defaultRouting: "As Filed",
    defaultRoutingDetails: "",
    uppercaseCallsign: true,
    defaultSettingsEnabled: false,
    authority: DEFAULT_AUTHORITY,
};

const isKnownAuthority = (value) => AUTHORITY_ORDER.includes(value);

const normalizeAuthoritySlot = (authority, slot) => ({
    template: String(slot?.template || DEFAULT_AUTHORITY_TEMPLATES[authority] || DEFAULT_TEMPLATE),
});

export const normalizeSettings = (s = {}) => {
    const activeAuthority = isKnownAuthority(s.activeAuthority)
        ? s.activeAuthority
        : isKnownAuthority(s.authority)
            ? s.authority
            : DEFAULT_AUTHORITY;
    const legacyTemplate = String(s.clearanceTemplate || DEFAULT_TEMPLATE);
    const sourceAuthorities = s.authorities && typeof s.authorities === "object" ? s.authorities : {};
    const authorities = Object.fromEntries(
        AUTHORITY_ORDER.map((authority) => [
            authority,
            normalizeAuthoritySlot(
                authority,
                authority === "Generic"
                    ? { template: sourceAuthorities?.Generic?.template || legacyTemplate }
                    : sourceAuthorities?.[authority]
            ),
        ])
    );
    const activeTemplate = authorities[activeAuthority]?.template || DEFAULT_AUTHORITY_TEMPLATES[activeAuthority] || DEFAULT_TEMPLATE;

    return {
        ...DEFAULT_SETTINGS,
        ...s,
        activeAuthority,
        authorities,
        clearanceTemplate: activeTemplate,
        authority: activeAuthority,
        defaultRouting: s.defaultRouting || DEFAULT_SETTINGS.defaultRouting,
        defaultRoutingDetails: s.defaultRoutingDetails || DEFAULT_SETTINGS.defaultRoutingDetails,
        uppercaseCallsign: s.uppercaseCallsign ?? DEFAULT_SETTINGS.uppercaseCallsign,
        defaultSettingsEnabled: s.defaultSettingsEnabled ?? DEFAULT_SETTINGS.defaultSettingsEnabled,
    };
};

export const formatFlightLevel = (fl) => {
    const num = Number(fl);
    if (!Number.isFinite(num) || num <= 0) return "XXX";
    const val = num > 999 ? Math.floor(num / 100) : num;
    return String(val).padStart(3, "0");
};

export const generateSquawk = () => {
    const excluded = new Set([7500, 7600, 7700]);
    let code = '';

    while (!code) {
        const candidate = Math.floor(1000 + Math.random() * 6778);
        if (excluded.has(candidate)) continue;
        const candidateText = String(candidate);
        if (/[89]/.test(candidateText)) continue;
        code = candidateText.padStart(4, '0');
    }

    return code;
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
    const template = settings.authorities?.[settings.activeAuthority]?.template || settings.clearanceTemplate || DEFAULT_TEMPLATE;
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

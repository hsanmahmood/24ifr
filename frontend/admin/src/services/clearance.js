export const DEFAULT_PHRASEOLOGY = "ICAO-E";

export const PHRASEOLOGY_LABELS = {
    FAA: "FAA (USA)",
    "ICAO-E": "ICAO-E (Europe)",
    CASA: "CASA (Australia)",
    CAA: "CAA (UK)",
    Generic: "Generic",
};

export const PHRASEOLOGY_ORDER = ["FAA", "ICAO-E", "CASA", "CAA", "Generic"];

export const DEFAULT_PHRASEOLOGY_TEMPLATES = {
    FAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} airport via {ROUTE}, maintain {INITIAL_ALT}, expect {FLIGHT_LEVEL} ten minutes after departure, squawk {SQUAWK}.",
    "ICAO-E": "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, initial climb {INITIAL_ALT}, squawk {SQUAWK}, information {ATIS}.",
    CASA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, runway {RUNWAY}, maintain {INITIAL_ALT}, squawk {SQUAWK}, ATIS {ATIS}.",
    CAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, climb initially {INITIAL_ALT}, squawk {SQUAWK}, QNH [set by controller].",
    Generic: "{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.",
};

export const DEFAULT_TEMPLATE = DEFAULT_PHRASEOLOGY_TEMPLATES.Generic;

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
    activePhraseology: DEFAULT_PHRASEOLOGY,
    phraseologies: Object.fromEntries(
        PHRASEOLOGY_ORDER.map((phraseology) => [phraseology, { template: DEFAULT_PHRASEOLOGY_TEMPLATES[phraseology] }])
    ),
    clearanceTemplate: DEFAULT_TEMPLATE,
    defaultRouting: "As Filed",
    defaultRoutingDetails: "",
    uppercaseCallsign: true,
    defaultSettingsEnabled: false,
    phraseology: DEFAULT_PHRASEOLOGY,
};

const isKnownPhraseology = (value) => PHRASEOLOGY_ORDER.includes(value);

const normalizePhraseologySlot = (phraseology, slot) => ({
    template: String(slot?.template || DEFAULT_PHRASEOLOGY_TEMPLATES[phraseology] || DEFAULT_TEMPLATE),
});

export const normalizeSettings = (s = {}) => {
    const activePhraseology = isKnownPhraseology(s.activePhraseology)
        ? s.activePhraseology
        : isKnownPhraseology(s.phraseology)
            ? s.phraseology
            : DEFAULT_PHRASEOLOGY;
    const legacyTemplate = String(s.clearanceTemplate || DEFAULT_TEMPLATE);
    const sourcePhraseologies = s.phraseologies && typeof s.phraseologies === "object" ? s.phraseologies : {};
    const phraseologies = Object.fromEntries(
        PHRASEOLOGY_ORDER.map((phraseology) => [
            phraseology,
            normalizePhraseologySlot(
                phraseology,
                phraseology === "Generic"
                    ? { template: sourcePhraseologies?.Generic?.template || legacyTemplate }
                    : sourcePhraseologies?.[phraseology]
            ),
        ])
    );
    const activeTemplate = phraseologies[activePhraseology]?.template || DEFAULT_PHRASEOLOGY_TEMPLATES[activePhraseology] || DEFAULT_TEMPLATE;

    return {
        ...DEFAULT_SETTINGS,
        ...s,
        activePhraseology,
        phraseologies,
        clearanceTemplate: activeTemplate,
        phraseology: activePhraseology,
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
    if (mode === "Filed route") return flightPlan?.route || "";
    if (mode === "As filed") return `as filed to ${flightPlan?.arriving || ""}`;
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
    const template = settings.phraseologies?.[settings.activePhraseology]?.template || settings.clearanceTemplate || DEFAULT_TEMPLATE;
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

export const DEFAULT_AUTHORITY = "ICAO-E";

export const AUTHORITY_LABELS = {
    FAA: "FAA (USA)",
    "ICAO-E": "ICAO-E (Europe)",
    CASA: "CASA (Australia)",
    CAA: "CAA (UK)",
};

export const AUTHORITY_ORDER = ["FAA", "ICAO-E", "CASA", "CAA"];

export const DEFAULT_AUTHORITY_TEMPLATES = {
    FAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} airport via {ROUTE}, maintain {INITIAL_ALT}, expect {FLIGHT_LEVEL} ten minutes after departure, squawk {SQUAWK}.",
    "ICAO-E": "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, initial climb {INITIAL_ALT}, squawk {SQUAWK}, information {ATIS}.",
    CASA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, runway {RUNWAY}, maintain {INITIAL_ALT}, squawk {SQUAWK}, ATIS {ATIS}.",
    CAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, climb initially {INITIAL_ALT}, squawk {SQUAWK}, QNH [set by controller].",
};

export const DEFAULT_TEMPLATE = DEFAULT_AUTHORITY_TEMPLATES[DEFAULT_AUTHORITY];

export const AUTHORITY_DEFAULTS = {
    FAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} airport via {ROUTE}, maintain {INITIAL_ALT}, expect {FLIGHT_LEVEL} ten minutes after departure, squawk {SQUAWK}.",
    "ICAO-E": "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, initial climb {INITIAL_ALT}, squawk {SQUAWK}, information {ATIS}.",
    CASA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, runway {RUNWAY}, maintain {INITIAL_ALT}, squawk {SQUAWK}, ATIS {ATIS}.",
    CAA: "{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE}, climb initially {INITIAL_ALT}, squawk {SQUAWK}, information {ATIS}.",
};

export const AUTHORITY_KEYS = ["FAA", "ICAO-E", "CASA", "CAA"];

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

const buildAuthoritySlots = (authorities = {}, fallbackTemplate) => {
    const slots = {};
    for (const key of AUTHORITY_KEYS) {
        const existing = authorities?.[key]?.template;
        const migratedLegacy = key === DEFAULT_AUTHORITY && fallbackTemplate && fallbackTemplate !== AUTHORITY_DEFAULTS[DEFAULT_AUTHORITY] ? fallbackTemplate : undefined;
        slots[key] = {
            template: String(existing || migratedLegacy || AUTHORITY_DEFAULTS[key]),
        };
    }
    return slots;
};

export const DEFAULT_SETTINGS = {
    activeAuthority: DEFAULT_AUTHORITY,
    authorities: buildAuthoritySlots({}, DEFAULT_TEMPLATE),
    clearanceTemplate: DEFAULT_TEMPLATE,
    defaultRouting: "As Filed",
    defaultRoutingDetails: "",
    defaultSidRoutingDetails: "",
    defaultDirectRoutingDetails: "",
    defaultSettingsEnabled: false,
    uppercaseCallsign: true,
};

export const normalizeSettings = (s = {}) => {
    const activeAuthority = AUTHORITY_KEYS.includes(s.activeAuthority) ? s.activeAuthority : DEFAULT_AUTHORITY;
    const authorities = buildAuthoritySlots(s.authorities || {}, s.clearanceTemplate);
    const legacyTemplate = String(s.clearanceTemplate || "");
    if (legacyTemplate && !s.authorities?.[DEFAULT_AUTHORITY] && legacyTemplate !== AUTHORITY_DEFAULTS[DEFAULT_AUTHORITY]) {
        authorities[DEFAULT_AUTHORITY] = { template: legacyTemplate };
    }
    const resolvedActiveAuthority = AUTHORITY_KEYS.includes(activeAuthority) ? activeAuthority : DEFAULT_AUTHORITY;
    return {
        activeAuthority: resolvedActiveAuthority,
        authorities,
        clearanceTemplate: authorities[resolvedActiveAuthority].template,
        defaultRouting: s.defaultRouting || "As Filed",
        defaultRoutingDetails: s.defaultRoutingDetails || "",
        defaultSidRoutingDetails: s.defaultSidRoutingDetails || "",
        defaultDirectRoutingDetails: s.defaultDirectRoutingDetails || "",
        defaultSettingsEnabled: s.defaultSettingsEnabled ?? false,
        uppercaseCallsign: s.uppercaseCallsign ?? true,
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
    let code = "";
    while (!code) {
        const candidate = Math.floor(1000 + Math.random() * 6778);
        if (excluded.has(candidate)) continue;
        const candidateText = String(candidate);
        if (/[89]/.test(candidateText)) continue;
        code = candidateText.padStart(4, "0");
    }
    return code;
};

export const applyTemplate = (template, replacements) =>
    Object.entries(replacements).reduce(
        (out, [token, value]) => out.replace(new RegExp(`\\{${token}\\}`, "g"), value ?? ""),
        template
    );

export const resolveRouting = ({ flightPlan, routing, routingDetails, settings }) => {
    const s = normalizeSettings(settings);
    const mode = routing || s.defaultRouting;
    const details = routingDetails || s.defaultRoutingDetails || "";
    if (mode === "As Filed") return flightPlan?.route || "";
    if (mode === "SID") return details ? `the ${details} departure` : "the departure procedure";
    if (mode === "DIRECT") return details ? `direct ${details}` : flightPlan?.route || "direct";
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
    const template = settings.authorities[settings.activeAuthority].template;
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

function _normalizeRoute(route) {
    const normalized = String(route || "").trim();
    if (!normalized || ["N/A", "NA", "NONE"].includes(normalized.toUpperCase())) return "as filed";
    return normalized;
}

function _formatFlightLevel(flightLevel) {
    const normalized = String(flightLevel || "").trim();
    if (!normalized) return "XXX";
    if (/^\d+$/.test(normalized) && normalized.length === 3) return normalized;
    if (/^\d+$/.test(normalized) && parseInt(normalized, 10) > 999) return String(Math.floor(parseInt(normalized, 10) / 100)).padStart(3, "0");
    return normalized;
}

function _buildClearanceText(template, replacements) {
    let output = template || "";
    Object.keys(replacements).forEach((token) => {
        const value = replacements[token] || "";
        output = output.split(`{${token}}`).join(value);
    });
    return (output || "").trim();
}

function parseArrivalRunway(content) {
    if (!content) return null;
    const lines = String(content).split(/\r?\n/);
    for (const line of lines) {
        if (line.toUpperCase().indexOf("ARR RWY") === -1) continue;
        const tail = line.toUpperCase().split("ARR RWY", 2)[1].trim();
        if (!tail) return null;
        const candidate = tail.split(/\s+/)[0].replace(/[.,;:]/g, "");
        if (candidate) return candidate;
    }
    return null;
}

function resolveControllerForAirport(airport, controllers) {
    const target = (airport || "").toString().trim().toUpperCase();
    if (!target) return null;
    const list = controllers?.data || (Array.isArray(controllers) ? controllers : []);
    if (!Array.isArray(list)) return null;
    for (const c of list) {
        const controllerAirport = String(c.airport || "").trim().toUpperCase();
        const claimable = c.claimable === undefined ? true : c.claimable;
        if (controllerAirport === target && claimable === false) {
            const position = String(c.position || "TWR").trim().toUpperCase() || "TWR";
            return { atc_station: `${target}_${position}`, airport: target, position, controller: c };
        }
    }
    return { atc_station: `${target}_TWR`, airport: target, position: "TWR", controller: null };
}

function resolveAtisForAirport(airport, atis) {
    const target = (airport || "").toString().trim().toUpperCase();
    if (!target) return { atis: "A", runway: "active", entry: null };
    const list = atis?.data || (Array.isArray(atis) ? atis : []);
    if (!Array.isArray(list)) return { atis: "A", runway: "active", entry: null };
    for (const entry of list) {
        const entryAirport = String(entry.airport || "").trim().toUpperCase();
        if (entryAirport !== target) continue;
        const letter = String(entry.letter || entry.atis_code || "").trim().toUpperCase() || "A";
        const content = entry.content || entry.text_atis || "";
        const runway = parseArrivalRunway(content) || "active";
        return { atis: letter, runway, entry };
    }
    return { atis: "A", runway: "active", entry: null };
}

export function generateClearanceLocal(payload = {}, { flightPlans = [], controllers = [], atis = [] } = {}) {
    const callsign = String(payload.callsign || "").trim();
    const template = String(payload.template || DEFAULT_TEMPLATE);

    if (!callsign) throw new Error("callsign is required");

    const normalizedCall = callsign.trim().toLowerCase();
    const plans = Array.isArray(flightPlans) ? flightPlans : flightPlans.data || [];
    const plan = plans.find((p) => String(p.callsign || "").trim().toLowerCase() === normalizedCall || String(p.realcallsign || "").trim().toLowerCase() === normalizedCall);
    if (!plan) throw new Error("Flight plan not found");

    const departure = String(plan.departing || "").trim().toUpperCase();
    const destination = String(plan.arriving || "").trim().toUpperCase();
    const planCallsign = String(plan.realcallsign || plan.callsign || "").trim().toUpperCase();
    const route = _normalizeRoute(plan.route);
    const flightLevel = _formatFlightLevel(plan.flightlevel);
    const aircraft = String(plan.aircraft || "").trim();
    const flightRules = String(plan.flightrules || "").trim().toUpperCase();

    const controllerInfo = resolveControllerForAirport(departure, controllers);
    const atcStation = controllerInfo ? controllerInfo.atc_station : `${departure}_TWR`;

    const atisInfo = resolveAtisForAirport(departure, atis);
    const atisLetter = atisInfo.atis || "A";
    let runway = atisInfo.runway || "active";

    if (runway === "active") {
        const parsedRunway = parseArrivalRunway(atisInfo.entry?.content || "");
        runway = parsedRunway || "active";
    }

    const squawk = generateSquawk();
    const clearance = _buildClearanceText(template, {
        CALLSIGN: planCallsign,
        ATC_STATION: atcStation,
        ATIS: atisLetter,
        DESTINATION: destination,
        ROUTE: route,
        RUNWAY: runway,
        INITIAL_ALT: "3000",
        FLIGHT_LEVEL: flightLevel,
        SQUAWK: squawk,
    });

    return {
        clearance,
        squawk,
        callsign: planCallsign,
        destination,
        departure,
        aircraft,
        flight_rules: flightRules,
        flight_level: flightLevel,
        atis: atisLetter,
        atc_station: atcStation,
    };
}